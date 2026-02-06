
import { redis } from "./redis";

const DEFAULT_TTL = 3600; // 1 hour

export const cache = {
    async get<T>(key: string): Promise<T | null> {
        if (!redis || redis.status !== 'ready') return null;
        try {
            const data = await redis.get(key);
            return data ? JSON.parse(data) : null;
        } catch (error) {
            console.warn(`Cache GET error for ${key}:`, error);
            return null;
        }
    },

    async set(key: string, value: any, ttl: number = DEFAULT_TTL): Promise<void> {
        if (!redis || redis.status !== 'ready') return;
        try {
            const serialized = JSON.stringify(value);
            if (ttl) {
                await redis.set(key, serialized, "EX", ttl);
            } else {
                await redis.set(key, serialized);
            }
        } catch (error) {
            console.warn(`Cache SET error for ${key}:`, error);
        }
    },

    async del(key: string): Promise<void> {
        if (!redis || redis.status !== 'ready') return;
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
        if (cached) {
            return cached;
        }

        const fresh = await fn();
        if (fresh) {
            await this.set(key, fresh, ttl);
        }
        return fresh;
    }
};
