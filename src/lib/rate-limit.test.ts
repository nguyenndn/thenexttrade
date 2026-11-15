import { describe, it, expect, vi, beforeEach } from "vitest";

const getRedisClientMock = vi.fn<() => unknown>(() => null);

vi.mock("@/lib/redis", () => ({
    getRedisClient: () => getRedisClientMock(),
    redis: null,
}));

beforeEach(() => {
    vi.resetModules();
    getRedisClientMock.mockReset();
    getRedisClientMock.mockReturnValue(null);
});

describe("rateLimit", () => {
    it("allows requests within limit using in-memory fallback", async () => {
        const { rateLimit } = await import("./rate-limit");
        const limiter = rateLimit({
            interval: 1000,
            uniqueTokenPerInterval: 500,
        });
        await expect(limiter.check(5, "user-1")).resolves.not.toThrow();
    });

    it("blocks requests exceeding limit using in-memory fallback", async () => {
        const { rateLimit } = await import("./rate-limit");
        const strictLimiter = rateLimit({ interval: 1000 });

        await expect(
            strictLimiter.check(2, "strict-test")
        ).resolves.toBeUndefined();
        await expect(
            strictLimiter.check(2, "strict-test")
        ).rejects.toBeUndefined();
    });

    it("tracks tokens independently", async () => {
        const { rateLimit } = await import("./rate-limit");
        const limiter = rateLimit({ interval: 1000 });

        await expect(limiter.check(2, "user-A")).resolves.toBeUndefined();
        await expect(limiter.check(2, "user-B")).resolves.toBeUndefined();
    });

    it("uses ioredis pipeline when Redis is available and falls back on network error", async () => {
        const execMock = vi
            .fn()
            .mockResolvedValueOnce([
                [null, 1],
                [null, 1],
            ])
            .mockResolvedValueOnce([
                [null, 3],
                [null, 1],
            ])
            .mockRejectedValueOnce(new Error("ECONNREFUSED"));

        getRedisClientMock.mockReturnValue({
            pipeline: () => ({
                incr: () => ({
                    expire: () => ({
                        exec: execMock,
                    }),
                }),
            }),
        });

        const { rateLimit } = await import("./rate-limit");
        const limiter = rateLimit({ interval: 1000 });

        await expect(limiter.check(2, "redis-user")).resolves.toBeUndefined();
        await expect(limiter.check(2, "redis-user")).rejects.toBeUndefined();
        // Network error falls back to in-memory instead of throwing ECONNREFUSED
        await expect(
            limiter.check(2, "fallback-user")
        ).resolves.toBeUndefined();
    });
});
