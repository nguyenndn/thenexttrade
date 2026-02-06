import { describe, it, expect } from 'vitest';
import { getDayMetrics, JournalEntry } from './journalUtils';

describe('getDayMetrics', () => {
    const mockEntries: JournalEntry[] = [
        {
            id: '1',
            entryDate: '2024-01-01T10:00:00Z',
            symbol: 'EURUSD',
            type: 'BUY',
            pnl: 100,
            status: 'CLOSED',
            lotSize: 1,
            entryPrice: 1.1000
        },
        {
            id: '2',
            entryDate: '2024-01-01T14:00:00Z',
            symbol: 'GBPUSD',
            type: 'SELL',
            pnl: -50,
            status: 'CLOSED',
            lotSize: 0.5,
            entryPrice: 1.2500
        },
        {
            id: '3',
            entryDate: '2024-01-02T10:00:00Z',
            symbol: 'XAUUSD',
            type: 'BUY',
            pnl: 200,
            status: 'CLOSED',
            lotSize: 0.1,
            entryPrice: 2000
        }
    ];

    it('should aggregate PnL for a specific day', () => {
        const day = new Date('2024-01-01T00:00:00Z');
        const metrics = getDayMetrics(mockEntries, day);

        expect(metrics).not.toBeNull();
        expect(metrics?.totalPnL).toBe(50); // 100 - 50
        expect(metrics?.tradeCount).toBe(2);
    });

    it('should return null if no trades on that day', () => {
        const day = new Date('2024-01-10T00:00:00Z');
        const metrics = getDayMetrics(mockEntries, day);

        expect(metrics).toBeNull();
    });
});
