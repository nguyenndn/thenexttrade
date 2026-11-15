import type Redis from "ioredis";
import { logSecurityEvent, SECURITY_EVENT_TYPES } from "@/lib/security-logger";
import { getRedisClient } from "@/lib/redis";

// =============================================================================
// Auth Rate Limiter — Distributed via Redis (REDIS_URL)
// Falls back to in-memory Map when Redis is not configured or unreachable.
// =============================================================================

export type AuthRateLimitAction =
    | "login"
    | "signup"
    | "magic_link"
    | "forgot_password"
    | "verify_otp"
    | "resend_otp"
    | "verify_2fa"
    | "update_password"
    | "disable_2fa"
    | "feedback";

interface RateLimitRule {
    limit: number;
    windowMs: number;
}

const limits: Record<AuthRateLimitAction, RateLimitRule> = {
    login: { limit: 5, windowMs: 10 * 60 * 1000 },
    signup: { limit: 5, windowMs: 60 * 60 * 1000 },
    magic_link: { limit: 3, windowMs: 10 * 60 * 1000 },
    forgot_password: { limit: 3, windowMs: 15 * 60 * 1000 },
    verify_otp: { limit: 5, windowMs: 10 * 60 * 1000 },
    resend_otp: { limit: 3, windowMs: 15 * 60 * 1000 },
    verify_2fa: { limit: 5, windowMs: 10 * 60 * 1000 },
    update_password: { limit: 5, windowMs: 10 * 60 * 1000 },
    disable_2fa: { limit: 5, windowMs: 10 * 60 * 1000 },
    feedback: { limit: 5, windowMs: 10 * 60 * 1000 },
};

// In-memory fallback store
const memoryStore = new Map<string, { count: number; resetAt: number }>();

export function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

/**
 * Check if an auth action is rate-limited using Redis (distributed) or
 * in-memory Map (local dev / offline fallback).
 * @returns true if blocked, false if allowed.
 */
async function checkWithRedis(
    redis: Redis,
    keysToVerify: string[],
    rule: RateLimitRule
): Promise<boolean> {
    const windowSec = Math.max(1, Math.ceil(rule.windowMs / 1000));

    for (const key of keysToVerify) {
        const redisKey = `auth_rl:${key}`;
        const results = await redis
            .pipeline()
            .incr(redisKey)
            .ttl(redisKey)
            .exec();

        if (!results || results[0]?.[0] || results[1]?.[0]) {
            throw (
                results?.[0]?.[0] ??
                results?.[1]?.[0] ??
                new Error("Redis auth rate-limit pipeline failed")
            );
        }

        const currentCount = Number(results[0][1]);
        const currentTtl = Number(results[1][1]);

        if (currentCount === 1 || currentTtl < 0) {
            await redis.expire(redisKey, windowSec);
        }

        if (currentCount > rule.limit) {
            return true; // blocked
        }
    }
    return false;
}

function checkWithMemory(
    keysToVerify: string[],
    rule: RateLimitRule
): boolean {
    const now = Date.now();

    // First pass: check if any key is already blocked
    for (const key of keysToVerify) {
        const record = memoryStore.get(key);
        if (record && now < record.resetAt && record.count >= rule.limit) {
            return true; // blocked
        }
    }

    // Second pass: increment counters
    for (const key of keysToVerify) {
        const record = memoryStore.get(key);
        if (record && now < record.resetAt) {
            record.count += 1;
        } else {
            memoryStore.set(key, {
                count: 1,
                resetAt: now + rule.windowMs,
            });
        }
    }

    // Probabilistic cleanup
    if (Math.random() < 0.05) {
        for (const [k, v] of memoryStore.entries()) {
            if (now > v.resetAt) {
                memoryStore.delete(k);
            }
        }
    }

    return false;
}

export async function checkAuthRateLimit(
    action: AuthRateLimitAction,
    ip: string,
    email?: string
): Promise<boolean> {
    const rule = limits[action];

    const keysToVerify: string[] = [`${action}:ip:${ip}`];
    if (email) {
        keysToVerify.push(`${action}:email:${normalizeEmail(email)}`);
    }

    const redis = getRedisClient();
    let isBlocked: boolean;
    if (redis) {
        try {
            isBlocked = await checkWithRedis(redis, keysToVerify, rule);
        } catch (error) {
            console.warn(
                "[AuthRateLimit] Redis unreachable, falling back to in-memory store:",
                error instanceof Error ? error.message : String(error)
            );
            isBlocked = checkWithMemory(keysToVerify, rule);
        }
    } else {
        isBlocked = checkWithMemory(keysToVerify, rule);
    }

    if (isBlocked) {
        const maskedEmail = email
            ? `${email.substring(0, 3)}***@***.com`
            : "unknown";
        await logSecurityEvent({
            type: SECURITY_EVENT_TYPES.RATE_LIMIT || "RATE_LIMIT",
            ip,
            path: `/auth/actions/${action}`,
            detail: `Rate limit hit for ${action}. Email: ${maskedEmail}`,
        }).catch(() => {});
    }

    return isBlocked;
}
