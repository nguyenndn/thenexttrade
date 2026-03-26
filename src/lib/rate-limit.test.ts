import { describe, it, expect, vi } from 'vitest';
import { rateLimit } from './rate-limit';

describe('rateLimit', () => {
    it('should allow requests within limit', async () => {
        const limiter = rateLimit({ interval: 1000, uniqueTokenPerInterval: 500 });
        const token = 'user-1';
        await expect(limiter.check(5, token)).resolves.not.toThrow();
    });

    it('should block requests exceeding limit', async () => {
        const strictLimiter = rateLimit({ interval: 1000 });
        const testToken = 'strict-test';

        await expect(strictLimiter.check(2, testToken)).resolves.toBeUndefined();
        await expect(strictLimiter.check(2, testToken)).rejects.toBeUndefined();
    });

    it('should track tokens independently', async () => {
        const limiter = rateLimit({ interval: 1000 });
        const limit = 2;

        await expect(limiter.check(limit, 'user-A')).resolves.toBeUndefined();
        await expect(limiter.check(limit, 'user-B')).resolves.toBeUndefined();
    });

});
