"use server";

const TURNSTILE_VERIFY_URL =
    "https://challenges.cloudflare.com/turnstile/v0/siteverify";

/**
 * Verify a Cloudflare Turnstile token server-side.
 * Returns true if valid, false otherwise.
 *
 * Docs: https://developers.cloudflare.com/turnstile/get-started/server-side-validation/
 */
export async function verifyTurnstile(
    token: string,
    ip?: string
): Promise<{ success: boolean; error?: string }> {
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    const disableTurnstile =
        process.env.DISABLE_TURNSTILE === "true" ||
        process.env.NEXT_PUBLIC_DISABLE_TURNSTILE === "true";

    if (disableTurnstile) {
        return { success: true };
    }

    const isProd = process.env.NODE_ENV === "production";

    // Development bypass must happen server-side too. Some forms hide the
    // Turnstile widget locally, so the server can receive an empty token.
    if (!isProd) {
        return { success: true };
    }

    // Skip verification if Turnstile is not configured (no secret key set)
    if (!secretKey) {
        console.error(
            "[Turnstile] Missing TURNSTILE_SECRET_KEY in production."
        );
        return {
            success: false,
            error: "Configuration error. Verification unavailable.",
        };
    }

    if (!token) {
        return { success: false, error: "Verification required" };
    }

    try {
        const body: Record<string, string> = {
            secret: secretKey,
            response: token,
        };

        if (ip) {
            body.remoteip = ip;
        }

        const res = await fetch(TURNSTILE_VERIFY_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
        });

        const data = await res.json();

        if (data.success) {
            return { success: true };
        }

        return {
            success: false,
            error: "Verification failed. Please try again.",
        };
    } catch {
        console.error("[Turnstile] Verification request failed");
        if (isProd) {
            return {
                success: false,
                error: "Verification service unavailable. Please try again.",
            };
        }
        return { success: true };
    }
}
