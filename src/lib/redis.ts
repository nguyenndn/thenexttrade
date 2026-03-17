import { Redis } from "@upstash/redis";

// Upstash REST client for Vercel serverless
const getRedisClient = () => {
    const url = process.env.UPSTASH_REDIS_REST_URL;
    const token = process.env.UPSTASH_REDIS_REST_TOKEN;

    if (!url || !token) {
        console.warn("Upstash Redis not configured. Caching disabled.");
        return null;
    }

    return new Redis({ url, token });
};

// Singleton for dev mode
declare global {
    var redisClient: ReturnType<typeof getRedisClient> | undefined;
}

export const redis = globalThis.redisClient || getRedisClient();

if (process.env.NODE_ENV !== "production") {
    globalThis.redisClient = redis;
}
