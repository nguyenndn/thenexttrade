import type Redis from "ioredis";
import { LRUCache } from "lru-cache";
import { getRedisClient } from "@/lib/redis";

// =============================================================================
// Distributed Rate Limiter
// Uses Redis (REDIS_URL via ioredis) when available, falling back seamlessly to
// in-memory LRU cache for local development or when Redis is unreachable.
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
                .exec();

            if (!results || results[0]?.[0]) {
                throw (
                    results?.[0]?.[0] ??
                    new Error("Redis rate-limit pipeline failed")
                );
            }

            const currentUsage = Number(results[0][1]);

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

export function rateLimit(options?: RateLimitOptions): RateLimiter {
    const intervalMs = options?.interval || 60000;
    const memoryLimiter = createMemoryRateLimiter(options);

    return {
        check: async (limit: number, token: string) => {
            const redis = getRedisClient();
            if (!redis) {
                await memoryLimiter.check(limit, token);
                return;
            }

            const redisLimiter = createRedisRateLimiter(redis, intervalMs);
            try {
                await redisLimiter.check(limit, token);
            } catch (error) {
                if (error === undefined) {
                    throw undefined;
                }
                console.warn(
                    "[RateLimit] Redis unreachable, falling back to in-memory store:",
                    error instanceof Error ? error.message : String(error)
                );
                await memoryLimiter.check(limit, token);
            }
        },
    };
}
