import { logSecurityEvent, SECURITY_EVENT_TYPES } from '@/lib/security-logger';

type AuthRateLimitAction = "login" | "signup" | "magic_link" | "forgot_password" | "verify_otp" | "resend_otp" | "verify_2fa";

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
};

const store = new Map<string, { count: number; resetAt: number }>();

export function normalizeEmail(email: string) {
    return email.trim().toLowerCase();
}

/**
 * Checks if the action is rate limited.
 * @returns true if blocked, false if allowed.
 */
export async function checkAuthRateLimit(
    action: AuthRateLimitAction,
    ip: string,
    email?: string
): Promise<boolean> {
    const now = Date.now();
    const rule = limits[action];

    const keysToVerify: string[] = [];
    keysToVerify.push(`${action}:ip:${ip}`);
    
    if (email) {
        const normalized = normalizeEmail(email);
        keysToVerify.push(`${action}:email:${normalized}`);
    }

    let isBlocked = false;

    // First pass: Check if any key is already blocked
    for (const key of keysToVerify) {
        const record = store.get(key);
        if (record && now < record.resetAt) {
            if (record.count >= rule.limit) {
                isBlocked = true;
                break;
            }
        }
    }

    if (isBlocked) {
        const maskedEmail = email ? `${email.substring(0, 3)}***@***.com` : 'unknown';
        await logSecurityEvent({
            type: SECURITY_EVENT_TYPES.RATE_LIMIT || 'RATE_LIMIT',
            ip,
            path: `/auth/actions/${action}`,
            detail: `Rate limit hit for ${action}. Email: ${maskedEmail}`
        }).catch(() => {});
        return true;
    }

    // Second pass: Increment counters
    for (const key of keysToVerify) {
        const record = store.get(key);
        if (record && now < record.resetAt) {
            record.count += 1;
        } else {
            store.set(key, {
                count: 1,
                resetAt: now + rule.windowMs
            });
        }
    }

    // Periodically cleanup the store
    if (Math.random() < 0.05) {
        for (const [k, v] of store.entries()) {
            if (now > v.resetAt) {
                store.delete(k);
            }
        }
    }

    return false;
}
