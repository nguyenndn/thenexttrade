import { describe, it, expect, vi, beforeEach } from 'vitest';
import { checkUserQuota, reserveAiRequest } from './quota-service';
import { prisma } from '@/lib/prisma';
import { getUserProAccess } from '@/lib/pro-access';

vi.mock('@/lib/prisma', () => ({
  prisma: {
    aiRequest: { count: vi.fn() },
    $transaction: vi.fn()
  }
}));

vi.mock('@/lib/pro-access', () => ({
  getUserProAccess: vi.fn()
}));

describe('Quota Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows request if under quota (free user)', async () => {
    (getUserProAccess as any).mockResolvedValue({ isPro: false });
    (prisma.aiRequest.count as any).mockResolvedValue(2);
    
    const res = await checkUserQuota('user-1');
    expect(res.hasQuota).toBe(true);
    expect(res.isPro).toBe(false);
    expect(res.dailyLimit).toBe(10);
    expect(res.usedToday).toBe(2);
    expect(res.remainingToday).toBe(8);
  });

  it('rejects request if over quota (free user)', async () => {
    (getUserProAccess as any).mockResolvedValue({ isPro: false });
    (prisma.aiRequest.count as any).mockResolvedValue(10);
    
    const res = await checkUserQuota('user-1');
    expect(res.hasQuota).toBe(false);
    expect(res.remainingToday).toBe(0);
  });

  it('allows request if under quota (pro user)', async () => {
    (getUserProAccess as any).mockResolvedValue({ isPro: true });
    (prisma.aiRequest.count as any).mockResolvedValue(99);
    
    const res = await checkUserQuota('user-1');
    expect(res.hasQuota).toBe(true);
    expect(res.isPro).toBe(true);
    expect(res.dailyLimit).toBe(100);
    expect(res.usedToday).toBe(99);
    expect(res.remainingToday).toBe(1);
  });

  it('rejects request if over quota (pro user)', async () => {
    (getUserProAccess as any).mockResolvedValue({ isPro: true });
    (prisma.aiRequest.count as any).mockResolvedValue(100);
    
    const res = await checkUserQuota('user-1');
    expect(res.hasQuota).toBe(false);
    expect(res.remainingToday).toBe(0);
  });

  it('counts only requests that consumed quota', async () => {
    (getUserProAccess as any).mockResolvedValue({ isPro: false });
    (prisma.aiRequest.count as any).mockResolvedValue(0);

    await checkUserQuota('user-filter');

    expect(prisma.aiRequest.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        userId: 'user-filter',
        OR: [
          { status: { in: ['ROUTING', 'CALLING_PROVIDER', 'COMPLETED'] } },
          { status: 'REJECTED', errorCode: 'SAFETY_REJECTED' },
          { status: 'FAILED', attempts: { some: { latencyMs: { gt: 0 } } } }
        ]
      })
    });
  });

  it('acquires a database lock before reserving quota', async () => {
    (getUserProAccess as any).mockResolvedValue({ isPro: false });
    const tx = {
      $executeRaw: vi.fn().mockResolvedValue(1),
      aiRequest: {
        findUnique: vi.fn().mockResolvedValue(null),
        count: vi.fn().mockResolvedValue(9),
        create: vi.fn().mockResolvedValue({ id: 'db-request-1' })
      }
    };
    (prisma.$transaction as any).mockImplementation(async (callback: any) => callback(tx));

    const result = await reserveAiRequest({
      requestId: 'request-lock',
      userId: 'user-lock',
      symbol: 'XAUUSD',
      timeframe: 'M15',
      analysisMode: 'SCALPING',
      promptVersion: '1.0'
    });

    expect(tx.$executeRaw).toHaveBeenCalledOnce();
    expect(tx.aiRequest.count).toHaveBeenCalledOnce();
    expect(tx.aiRequest.create).toHaveBeenCalledWith({
      data: expect.objectContaining({ requestId: 'request-lock', status: 'ROUTING' })
    });
    expect(result).toMatchObject({
      status: 'RESERVED',
      quota: { usedToday: 10, remainingToday: 0 }
    });
  });
});
