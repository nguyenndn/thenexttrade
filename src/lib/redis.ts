import Redis from "ioredis";

function createRedisInstance(url: string): Redis {
    const client = new Redis(url, {
        maxRetriesPerRequest: 1,
        connectTimeout: 3000,
        commandTimeout: 2000,
        enableOfflineQueue: false,
        lazyConnect: true,
    });

    client.on("error", (err: Error) => {
        console.warn("[Redis] Connection warning:", err.message);
    });

    return client;
}

export function getRedisClient(): Redis | null {
    const url = process.env.REDIS_URL?.trim();
    if (!url) {
        return null;
    }

    if (!globalThis.redisClient) {
        globalThis.redisClient = createRedisInstance(url);
    }

    return globalThis.redisClient;
}

declare global {
    var redisClient: Redis | undefined;
}

export const redis = getRedisClient();
