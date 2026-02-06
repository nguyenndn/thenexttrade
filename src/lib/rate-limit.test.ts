import { describe, it, expect, vi } from 'vitest';
import { rateLimit } from './rate-limit';

describe('rateLimit', () => {
    it('should allow requests within limit', async () => {
        const limiter = rateLimit({ interval: 1000, uniqueTokenPerInterval: 500 });
        const token = 'user-1';

        // Limit is 5. We consume 1.
        await expect(limiter.check(5, token)).resolves.not.toThrow();
    });

    it('should block requests exceeding limit', async () => {
        const limiter = rateLimit({ interval: 1000, uniqueTokenPerInterval: 500 });
        const token = 'user-flood';
        const limit = 2;

        await limiter.check(limit, token); // 1st request (Usage: 1)
        await limiter.check(limit, token); // 2nd request (Usage: 2) -> Wait, logic says usage >= limit is blocked?

        // Let's check logic:
        // tokenCount starts at 0? No, line 17: (tokenCache.get(token) as number[]) || [0];
        // line 21: tokenCount[0] += 1;
        // So 1st call: usage=1. isRateLimited = 1 >= 2 (False) -> Resolve.
        // 2nd call: usage=2. isRateLimited = 2 >= 2 (True) -> Reject?
        // Wait, usually limit is inclusive or exclusive?
        // Code: isRateLimited = currentUsage >= limit;
        // So if limit is 2, usage 2 IS limited. So max allowed is Limit-1?
        // Let's verify constraint. If I set limit 3.
        // 1: usage 1 < 3. OK.
        // 2: usage 2 < 3. OK.
        // 3: usage 3 >= 3. REJECT.

        // So if limit is 3, only 2 requests allowed? That seems odd. Usually limit 3 means 3 requests allowed.
        // If currentUsage >= limit, then we reject.
        // So if usage becomes 3, we reject. So 3 is NOT allowed.
        // So specific implementation blocks the Nth request if N == limit.

        // Let's test this behavior.

        const strictLimiter = rateLimit({ interval: 1000 });
        const testToken = 'strict-test';

        // Allow
        await expect(strictLimiter.check(2, testToken)).resolves.toBeUndefined();

        // Deny (Usage now 2, Limit 2)
        await expect(strictLimiter.check(2, testToken)).rejects.toBeUndefined();
    });

    it('should track tokens independently', async () => {
        const limiter = rateLimit({ interval: 1000 });
        const limit = 2;

        await expect(limiter.check(limit, 'user-A')).resolves.toBeUndefined(); // A: 1
        await expect(limiter.check(limit, 'user-B')).resolves.toBeUndefined(); // B: 1

        // Both safely under limit (limit 2 means < 2 allowed? wait, let's assume limit means distinct hits allowed)
        // Actually based on logic: usage >= limit -> reject.
        // so usage 1 is ok. usage 2 is reject.
        // effectively max requests = limit - 1.
        it('should reset limit after interval passes', async () => {
            // Mock timers
            vi.useFakeTimers();

            const limiter = rateLimit({ interval: 1000 }); // 1 sec window
            const token = 'user-timeout';
            const limit = 2; // Allow 1 request per window logic (usage < limit), effectively. 
            // Actually code: usage >= limit (reject). So limit 2 means 1 allowed.
            // Let's use limit 5 (4 allowed).

            // Use all requests
            await expect(limiter.check(5, token)).resolves.toBeUndefined(); // 1
            await expect(limiter.check(5, token)).resolves.toBeUndefined(); // 2
            await expect(limiter.check(5, token)).resolves.toBeUndefined(); // 3
            await expect(limiter.check(5, token)).resolves.toBeUndefined(); // 4

            // 5th should block
            await expect(limiter.check(5, token)).rejects.toBeUndefined();

            // Fast forward time > interval
            vi.advanceTimersByTime(1100);

            // In simpler LRU cache rate limit implementations, the cache might clear the key on TTL.
            // If LRU 'ttl' option works, the key 'user-timeout' should expire.
            // When checking again, it should re-init to 0.

            // Verify we can request again
            await expect(limiter.check(5, token)).resolves.toBeUndefined();

            vi.useRealTimers();
        });
    });
});
