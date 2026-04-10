import { prisma } from "@/lib/prisma";
import { createHash, timingSafeEqual } from "crypto";

// ============================================================================
// PARTNER API KEY AUTHENTICATION
// ============================================================================

interface PartnerAuthResult {
    success: boolean;
    partner?: {
        id: number;
        partnerCode: string;
        partnerName: string;
        webhookUrl: string | null;
    };
    error?: string;
    status?: number;
}

/**
 * Validate partner API key from request headers.
 * Uses SHA-256 hash + timing-safe comparison.
 */
export async function validatePartnerAuth(
    request: Request,
    partnerCode: string
): Promise<PartnerAuthResult> {
    const apiKey = request.headers.get("x-api-key");

    if (!apiKey) {
        return { success: false, error: "Missing API key", status: 401 };
    }

    // Rate limit check
    const rateLimitResult = checkRateLimit(apiKey);
    if (!rateLimitResult.allowed) {
        return {
            success: false,
            error: `Rate limit exceeded. Try again in ${rateLimitResult.retryAfter}s`,
            status: 429
        };
    }

    // Find partner
    const partner = await prisma.partner.findUnique({
        where: { partnerCode },
        select: {
            id: true,
            partnerCode: true,
            partnerName: true,
            apiKeyHash: true,
            webhookUrl: true,
            status: true,
            allowedIps: true,
        }
    });

    if (!partner) {
        return { success: false, error: "Invalid partner code", status: 401 };
    }

    if (partner.status !== "ACTIVE") {
        return { success: false, error: "Partner account suspended", status: 403 };
    }

    // Verify API key using SHA-256 + timing-safe compare
    const incomingHash = hashApiKey(apiKey);
    const storedHash = partner.apiKeyHash;

    try {
        const isValid = timingSafeEqual(
            Buffer.from(incomingHash, "hex"),
            Buffer.from(storedHash, "hex")
        );

        if (!isValid) {
            return { success: false, error: "Invalid API key", status: 401 };
        }
    } catch {
        return { success: false, error: "Invalid API key", status: 401 };
    }

    return {
        success: true,
        partner: {
            id: partner.id,
            partnerCode: partner.partnerCode,
            partnerName: partner.partnerName,
            webhookUrl: partner.webhookUrl,
        }
    };
}

/**
 * Hash API key with SHA-256.
 */
export function hashApiKey(key: string): string {
    return createHash("sha256").update(key).digest("hex");
}

// ============================================================================
// IN-MEMORY RATE LIMITER (60 req/min per API key)
// ============================================================================

const RATE_LIMIT_WINDOW_MS = 60_000; // 1 minute
const RATE_LIMIT_MAX = 60;

interface RateLimitEntry {
    count: number;
    windowStart: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

// Cleanup stale entries every 5 minutes
setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of rateLimitMap.entries()) {
        if (now - entry.windowStart > RATE_LIMIT_WINDOW_MS * 2) {
            rateLimitMap.delete(key);
        }
    }
}, 300_000);

function checkRateLimit(apiKey: string): { allowed: boolean; retryAfter?: number } {
    const now = Date.now();
    const keyHash = apiKey.slice(0, 16); // Use prefix as map key to save memory

    const entry = rateLimitMap.get(keyHash);

    if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
        rateLimitMap.set(keyHash, { count: 1, windowStart: now });
        return { allowed: true };
    }

    entry.count++;

    if (entry.count > RATE_LIMIT_MAX) {
        const retryAfter = Math.ceil((entry.windowStart + RATE_LIMIT_WINDOW_MS - now) / 1000);
        return { allowed: false, retryAfter };
    }

    return { allowed: true };
}
