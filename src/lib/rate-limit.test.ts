import { describe, it, expect, vi, beforeEach } from "vitest";

// Mock Upstash Redis to not exist — forces LRU fallback
vi.mock("@upstash/redis", () => ({
    Redis: vi.fn(),
}));

// Clear module cache between tests to get fresh rate limiter instances
beforeEach(() => {
    vi.resetModules();
});

describe("rateLimit (in-memory fallback)", () => {
    it("should allow requests within limit", async () => {
        const { rateLimit } = await import("./rate-limit");
        const limiter = rateLimit({
            interval: 1000,
            uniqueTokenPerInterval: 500,
        });
        const token = "user-1";
        await expect(limiter.check(5, token)).resolves.not.toThrow();
    });

    it("should block requests exceeding limit", async () => {
        const { rateLimit } = await import("./rate-limit");
        const strictLimiter = rateLimit({ interval: 1000 });
        const testToken = "strict-test";

        await expect(
            strictLimiter.check(2, testToken)
        ).resolves.toBeUndefined();
        await expect(strictLimiter.check(2, testToken)).rejects.toBeUndefined();
    });

    it("should track tokens independently", async () => {
        const { rateLimit } = await import("./rate-limit");
        const limiter = rateLimit({ interval: 1000 });
        const limit = 2;

        await expect(limiter.check(limit, "user-A")).resolves.toBeUndefined();
        await expect(limiter.check(limit, "user-B")).resolves.toBeUndefined();
    });
});
