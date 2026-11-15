import { getRedisClient } from "./redis";

const DEFAULT_TTL = 3600; // 1 hour

export const cache = {
    async get<T>(key: string): Promise<T | null> {
        const redis = getRedisClient();
        if (!redis) return null;
        try {
            const raw = await redis.get(key);
            if (raw === null) return null;
            try {
                return JSON.parse(raw) as T;
            } catch {
                return raw as unknown as T;
            }
        } catch (error) {
            console.warn(`Cache GET error for ${key}:`, error);
            return null;
        }
    },

    async set(
        key: string,
        value: unknown,
        ttl: number = DEFAULT_TTL
    ): Promise<void> {
        const redis = getRedisClient();
        if (!redis) return;
        try {
            const serialized = JSON.stringify(value);
            if (ttl > 0) {
                await redis.set(key, serialized, "EX", ttl);
            } else {
                await redis.set(key, serialized);
            }
        } catch (error) {
            console.warn(`Cache SET error for ${key}:`, error);
        }
    },

    async del(key: string): Promise<void> {
        const redis = getRedisClient();
        if (!redis) return;
        try {
            await redis.del(key);
        } catch (error) {
            console.warn(`Cache DEL error for ${key}:`, error);
        }
    },

    // Helper to wrap a function with caching
    async wrap<T>(
        key: string,
        fn: () => Promise<T>,
        ttl: number = DEFAULT_TTL
    ): Promise<T> {
        const cached = await this.get<T>(key);
        if (cached !== null) {
            return cached;
        }

        const fresh = await fn();
        if (fresh !== undefined && fresh !== null) {
            await this.set(key, fresh, ttl);
        }
        return fresh;
    },
};
