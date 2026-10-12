import { Redis } from "@upstash/redis";
import { LRUCache } from "lru-cache";

// =============================================================================
// Distributed Rate Limiter
// Uses Upstash Redis when available (multi-instance safe), falls back to
// in-memory LRU cache for local development or when Redis is not configured.
// =============================================================================

type RateLimitOptions = {
    uniqueTokenPerInterval?: number;
    interval?: number; // milliseconds
};

interface RateLimiter {
    check: (limit: number, token: string) => Promise<void>;
}

function createRedisRateLimiter(
    redis: Redis,
    intervalMs: number
): RateLimiter {
    return {
        check: async (limit: number, token: string) => {
            const key = `rl:${token}`;
            const windowSec = Math.max(1, Math.ceil(intervalMs / 1000));

            const results = await redis
                .pipeline()
                .incr(key)
                .expire(key, windowSec)
                .exec<[number, number]>();

            const currentUsage = results[0];

            if (currentUsage > limit) {
                throw undefined; // Matches original reject() behavior
            }
        },
    };
}

function createMemoryRateLimiter(options?: RateLimitOptions): RateLimiter {
    const tokenCache = new LRUCache({
        max: options?.uniqueTokenPerInterval || 500,
        ttl: options?.interval || 60000,
    });

    return {
        check: (limit: number, token: string) =>
            new Promise<void>((resolve, reject) => {
                const tokenCount = (tokenCache.get(token) as number[]) || [0];
                if (tokenCount[0] === 0) {
                    tokenCache.set(token, tokenCount);
                }
                tokenCount[0] += 1;

                const currentUsage = tokenCount[0];
                if (currentUsage >= limit) {
                    reject();
                } else {
                    resolve();
                }
            }),
    };
}

// Lazily resolved Redis client (avoids import-time side effects)
let _redis: Redis | null | undefined;
function getRedis(): Redis | null {
    if (_redis !== undefined) return _redis;
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;
    _redis = url && token ? new Redis({ url, token }) : null;
    return _redis;
}

export function rateLimit(options?: RateLimitOptions): RateLimiter {
    const redis = getRedis();
    const intervalMs = options?.interval || 60000;

    if (redis) {
        return createRedisRateLimiter(redis, intervalMs);
    }
    return createMemoryRateLimiter(options);
}
