
import Redis from "ioredis";

const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";

const getRedisClient = () => {
    const client = new Redis(REDIS_URL, {
        maxRetriesPerRequest: null, // Required by BullMQ
        retryStrategy: (times) => {
            return Math.min(times * 50, 2000);
        }
    });

    client.on("error", (err) => {
        console.warn("Redis connection error:", err);
    });

    return client;
};

// Singleton pattern for Next.js to avoid too many connections in dev
declare global {
    var redis: ReturnType<typeof getRedisClient> | undefined;
}

export const redis = globalThis.redis || getRedisClient();

if (process.env.NODE_ENV !== "production") {
    globalThis.redis = redis;
}
