import { describe, it, expect, vi, beforeEach } from 'vitest';
import { projectMt5History } from '@/lib/mt5/projector';
import { prisma } from '@/lib/prisma';

// Mock Prisma
vi.mock('@/lib/prisma', () => ({
  prisma: {
    mt5ImportJob: { findUnique: vi.fn() },
    mt5RawDeal: { findMany: vi.fn() },
    journalEntry: { upsert: vi.fn(), count: vi.fn() },
    tradingAccount: { update: vi.fn() },
  }
}));

describe('projectMt5History', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should throw an error if job is not found', async () => {
    vi.mocked(prisma.mt5ImportJob.findUnique).mockResolvedValue(null);
    await expect(projectMt5History('missing-job')).rejects.toThrow('Job missing-job not found');
  });

  it('should ignore BALANCE and CREDIT deals (dealType >= 2)', async () => {
    vi.mocked(prisma.mt5ImportJob.findUnique).mockResolvedValue({ accountId: 'acc1', userId: 'user1' } as any);
    
    // Provide a balance deal (type = 2)
    vi.mocked(prisma.mt5RawDeal.findMany).mockResolvedValue([
      {
        accountId: 'acc1',
        ticket: '100',
        payloadJson: {
          ticket: 100,
          position_id: 100,
          type: 2, // BALANCE
          entry: 0,
          volume: "0",
          price: "0",
          profit: "100",
          time_msc: 1600000000000
        }
      }
    ] as any);

    vi.mocked(prisma.journalEntry.count).mockResolvedValue(0);

    await projectMt5History('job1');

    // It should not call upsert
    expect(prisma.journalEntry.upsert).not.toHaveBeenCalled();
    expect(prisma.tradingAccount.update).toHaveBeenCalledWith({
      where: { id: 'acc1' },
      data: expect.objectContaining({ totalTrades: 0 })
    });
  });

  it('should handle partial closes correctly', async () => {
    vi.mocked(prisma.mt5ImportJob.findUnique).mockResolvedValue({ accountId: 'acc1', userId: 'user1' } as any);
    
    // Provide a buy deal and two partial close deals
    vi.mocked(prisma.mt5RawDeal.findMany).mockResolvedValue([
      {
        accountId: 'acc1',
        ticket: '101',
        payloadJson: {
          ticket: 101,
          position_id: 101,
          type: 0, // BUY
          entry: 0, // IN
          volume: "1.0",
          price: "1.1000",
          profit: "0",
          time_msc: 1600000000000
        }
      },
      {
        accountId: 'acc1',
        ticket: '102',
        payloadJson: {
          ticket: 102,
          position_id: 101, // same position
          type: 1, // SELL (close)
          entry: 1, // OUT
          volume: "0.5",
          price: "1.1050",
          profit: "50",
          time_msc: 1600000005000
        }
      },
      {
        accountId: 'acc1',
        ticket: '103',
        payloadJson: {
          ticket: 103,
          position_id: 101, // same position
          type: 1, // SELL (close)
          entry: 1, // OUT
          volume: "0.5",
          price: "1.1100",
          profit: "100",
          time_msc: 1600000010000
        }
      }
    ] as any);

    vi.mocked(prisma.journalEntry.count).mockResolvedValue(2);

    await projectMt5History('job1');

    // It should call upsert twice
    expect(prisma.journalEntry.upsert).toHaveBeenCalledTimes(2);

    // First call arguments
    const firstCall = vi.mocked(prisma.journalEntry.upsert).mock.calls[0][0];
    expect(firstCall.create.lotSize).toBe(0.5);
    expect(firstCall.create.entryPrice).toBe(1.1000);
    expect(firstCall.create.exitPrice).toBe(1.1050);
    expect(firstCall.create.pnl).toBe(50);

    // Second call arguments
    const secondCall = vi.mocked(prisma.journalEntry.upsert).mock.calls[1][0];
    expect(secondCall.create.lotSize).toBe(0.5);
    expect(secondCall.create.entryPrice).toBe(1.1000);
    expect(secondCall.create.exitPrice).toBe(1.1100);
    expect(secondCall.create.pnl).toBe(100);
  });
});
