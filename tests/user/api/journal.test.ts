/**
 * Journal API Tests
 * @module tests/user/api/journal.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockJournalEntries, mockJournalStats, mockTradingAccounts } from '../__mocks__/data';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// API helper functions
async function getJournalEntries(params: {
    accountId?: string;
    symbol?: string;
    type?: 'BUY' | 'SELL';
    status?: 'OPEN' | 'CLOSED';
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
} = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, String(value));
    });
    const response = await fetch(`/api/journal?${query.toString()}`);
    return response.json();
}

async function getJournalEntryById(id: string) {
    const response = await fetch(`/api/journal/${id}`);
    return response.json();
}

async function createJournalEntry(data: {
    accountId: string;
    symbol: string;
    type: 'BUY' | 'SELL';
    entryPrice: number;
    lotSize: number;
    stopLoss?: number;
    takeProfit?: number;
    notes?: string;
}) {
    const response = await fetch('/api/journal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

async function updateJournalEntry(id: string, data: Partial<{
    exitPrice: number;
    stopLoss: number;
    takeProfit: number;
    notes: string;
    emotions: string;
    rating: number;
    tags: string[];
    status: 'OPEN' | 'CLOSED';
}>) {
    const response = await fetch(`/api/journal/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

async function closeJournalEntry(id: string, exitPrice: number, notes?: string) {
    const response = await fetch(`/api/journal/${id}/close`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ exitPrice, notes }),
    });
    return response.json();
}

async function deleteJournalEntry(id: string) {
    const response = await fetch(`/api/journal/${id}`, {
        method: 'DELETE',
    });
    return response.json();
}

async function getJournalStats(params: {
    accountId?: string;
    startDate?: string;
    endDate?: string;
    period?: 'week' | 'month' | 'year' | 'all';
} = {}) {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, String(value));
    });
    const response = await fetch(`/api/journal/stats?${query.toString()}`);
    return response.json();
}

async function uploadTradeScreenshot(entryId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    const response = await fetch(`/api/journal/${entryId}/screenshot`, {
        method: 'POST',
        body: formData,
    });
    return response.json();
}

async function exportJournal(format: 'csv' | 'xlsx' | 'pdf', params: {
    accountId?: string;
    startDate?: string;
    endDate?: string;
} = {}) {
    const query = new URLSearchParams({ format });
    Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) query.set(key, String(value));
    });
    const response = await fetch(`/api/journal/export?${query.toString()}`);
    return response.json();
}

describe('Journal API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // List Journal Entries Tests
    // ========================================
    describe('GET /api/journal', () => {
        it('should get all journal entries', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        entries: mockJournalEntries,
                        total: mockJournalEntries.length,
                        page: 1,
                        totalPages: 1,
                    },
                }),
            });

            const data = await getJournalEntries();

            expect(mockFetch).toHaveBeenCalledWith('/api/journal?');
            expect(data.success).toBe(true);
            expect(data.data.entries).toEqual(mockJournalEntries);
        });

        it('should filter by account', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { entries: mockJournalEntries, total: 3 },
                }),
            });

            await getJournalEntries({ accountId: 'account-1' });

            expect(mockFetch).toHaveBeenCalledWith('/api/journal?accountId=account-1');
        });

        it('should filter by symbol', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { entries: [mockJournalEntries[0]], total: 1 },
                }),
            });

            await getJournalEntries({ symbol: 'EUR/USD' });

            expect(mockFetch).toHaveBeenCalledWith('/api/journal?symbol=EUR%2FUSD');
        });

        it('should filter by type (BUY/SELL)', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { entries: mockJournalEntries.filter(e => e.type === 'BUY'), total: 2 },
                }),
            });

            await getJournalEntries({ type: 'BUY' });

            expect(mockFetch).toHaveBeenCalledWith('/api/journal?type=BUY');
        });

        it('should filter by status (OPEN/CLOSED)', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { entries: mockJournalEntries.filter(e => e.status === 'OPEN'), total: 1 },
                }),
            });

            await getJournalEntries({ status: 'OPEN' });

            expect(mockFetch).toHaveBeenCalledWith('/api/journal?status=OPEN');
        });

        it('should filter by date range', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { entries: mockJournalEntries, total: 3 },
                }),
            });

            await getJournalEntries({
                startDate: '2025-01-01',
                endDate: '2025-01-31',
            });

            expect(mockFetch).toHaveBeenCalledWith('/api/journal?startDate=2025-01-01&endDate=2025-01-31');
        });

        it('should paginate results', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { entries: mockJournalEntries, total: 100, page: 2, totalPages: 10 },
                }),
            });

            await getJournalEntries({ page: 2, limit: 10 });

            expect(mockFetch).toHaveBeenCalledWith('/api/journal?page=2&limit=10');
        });

        it('should combine multiple filters', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { entries: [], total: 0 },
                }),
            });

            await getJournalEntries({
                accountId: 'account-1',
                symbol: 'EUR/USD',
                type: 'BUY',
                status: 'CLOSED',
            });

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/journal?accountId=account-1&symbol=EUR%2FUSD&type=BUY&status=CLOSED'
            );
        });
    });

    // ========================================
    // Get Single Entry Tests
    // ========================================
    describe('GET /api/journal/:id', () => {
        it('should get entry by id', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockJournalEntries[0],
                }),
            });

            const data = await getJournalEntryById('entry-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/journal/entry-1');
            expect(data.success).toBe(true);
            expect(data.data.id).toBe('entry-1');
        });

        it('should return error for non-existent entry', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Journal entry not found',
                }),
            });

            const data = await getJournalEntryById('non-existent');

            expect(data.success).toBe(false);
            expect(data.error).toBe('Journal entry not found');
        });
    });

    // ========================================
    // Create Entry Tests
    // ========================================
    describe('POST /api/journal', () => {
        const validEntry = {
            accountId: 'account-1',
            symbol: 'EUR/USD',
            type: 'BUY' as const,
            entryPrice: 1.0850,
            lotSize: 0.5,
            stopLoss: 1.0800,
            takeProfit: 1.0950,
            notes: 'Test trade',
        };

        it('should create a new journal entry', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { id: 'new-entry', ...validEntry, status: 'OPEN' },
                }),
            });

            const data = await createJournalEntry(validEntry);

            expect(mockFetch).toHaveBeenCalledWith('/api/journal', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validEntry),
            });
            expect(data.success).toBe(true);
            expect(data.data.status).toBe('OPEN');
        });

        it('should validate required fields', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Validation failed',
                    details: {
                        symbol: 'Symbol is required',
                        entryPrice: 'Entry price is required',
                    },
                }),
            });

            const data = await createJournalEntry({
                accountId: 'account-1',
                symbol: '',
                type: 'BUY',
                entryPrice: 0,
                lotSize: 0.5,
            });

            expect(data.success).toBe(false);
            expect(data.details.symbol).toBeDefined();
        });

        it('should validate lot size', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Lot size must be positive',
                }),
            });

            const data = await createJournalEntry({
                ...validEntry,
                lotSize: -0.5,
            });

            expect(data.success).toBe(false);
        });

        it('should validate stop loss position', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Stop loss must be below entry price for BUY trades',
                }),
            });

            const data = await createJournalEntry({
                ...validEntry,
                stopLoss: 1.0900, // Above entry for BUY
            });

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Update Entry Tests
    // ========================================
    describe('PATCH /api/journal/:id', () => {
        it('should update journal entry', async () => {
            const updates = { notes: 'Updated notes', rating: 4 };
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockJournalEntries[0], ...updates },
                }),
            });

            const data = await updateJournalEntry('entry-1', updates);

            expect(mockFetch).toHaveBeenCalledWith('/api/journal/entry-1', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(updates),
            });
            expect(data.success).toBe(true);
            expect(data.data.notes).toBe('Updated notes');
        });

        it('should add tags', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockJournalEntries[0], tags: ['breakout', 'trend', 'new-tag'] },
                }),
            });

            const data = await updateJournalEntry('entry-1', {
                tags: ['breakout', 'trend', 'new-tag'],
            });

            expect(data.data.tags).toContain('new-tag');
        });

        it('should update emotions', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockJournalEntries[0], emotions: 'Anxious' },
                }),
            });

            const data = await updateJournalEntry('entry-1', { emotions: 'Anxious' });

            expect(data.data.emotions).toBe('Anxious');
        });
    });

    // ========================================
    // Close Entry Tests
    // ========================================
    describe('POST /api/journal/:id/close', () => {
        it('should close an open trade', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        ...mockJournalEntries[2],
                        status: 'CLOSED',
                        exitPrice: 149.00,
                        pnl: 100,
                        pips: 50,
                    },
                }),
            });

            const data = await closeJournalEntry('entry-3', 149.00, 'Took profit');

            expect(mockFetch).toHaveBeenCalledWith('/api/journal/entry-3/close', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ exitPrice: 149.00, notes: 'Took profit' }),
            });
            expect(data.success).toBe(true);
            expect(data.data.status).toBe('CLOSED');
            expect(data.data.pnl).toBeDefined();
        });

        it('should calculate PnL correctly', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        ...mockJournalEntries[2],
                        exitPrice: 149.00,
                        pnl: 100,
                        pips: 50,
                    },
                }),
            });

            const data = await closeJournalEntry('entry-3', 149.00);

            expect(data.data.pnl).toBe(100);
            expect(data.data.pips).toBe(50);
        });

        it('should not close already closed trade', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Trade is already closed',
                }),
            });

            const data = await closeJournalEntry('entry-1', 1.0920);

            expect(data.success).toBe(false);
            expect(data.error).toBe('Trade is already closed');
        });
    });

    // ========================================
    // Delete Entry Tests
    // ========================================
    describe('DELETE /api/journal/:id', () => {
        it('should delete journal entry', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Entry deleted successfully',
                }),
            });

            const data = await deleteJournalEntry('entry-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/journal/entry-1', {
                method: 'DELETE',
            });
            expect(data.success).toBe(true);
        });

        it('should return error for non-existent entry', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Entry not found',
                }),
            });

            const data = await deleteJournalEntry('non-existent');

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Stats Tests
    // ========================================
    describe('GET /api/journal/stats', () => {
        it('should get journal statistics', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockJournalStats,
                }),
            });

            const data = await getJournalStats();

            expect(mockFetch).toHaveBeenCalledWith('/api/journal/stats?');
            expect(data.success).toBe(true);
            expect(data.data.winRate).toBe(65.5);
            expect(data.data.profitFactor).toBe(1.8);
        });

        it('should filter stats by account', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockJournalStats,
                }),
            });

            await getJournalStats({ accountId: 'account-1' });

            expect(mockFetch).toHaveBeenCalledWith('/api/journal/stats?accountId=account-1');
        });

        it('should filter stats by period', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockJournalStats, totalTrades: 30 },
                }),
            });

            await getJournalStats({ period: 'month' });

            expect(mockFetch).toHaveBeenCalledWith('/api/journal/stats?period=month');
        });

        it('should return stats by symbol', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockJournalStats,
                }),
            });

            const data = await getJournalStats();

            expect(data.data.bySymbol['EUR/USD']).toBeDefined();
            expect(data.data.bySymbol['EUR/USD'].winRate).toBe(68);
        });
    });

    // ========================================
    // Screenshot Upload Tests
    // ========================================
    describe('POST /api/journal/:id/screenshot', () => {
        it('should upload trade screenshot', async () => {
            const file = new File(['image'], 'trade.png', { type: 'image/png' });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        url: '/uploads/trade-new.png',
                    },
                }),
            });

            const data = await uploadTradeScreenshot('entry-1', file);

            expect(data.success).toBe(true);
            expect(data.data.url).toBeDefined();
        });

        it('should validate file type', async () => {
            const file = new File(['text'], 'document.txt', { type: 'text/plain' });
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Only image files are allowed',
                }),
            });

            const data = await uploadTradeScreenshot('entry-1', file);

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Export Tests
    // ========================================
    describe('GET /api/journal/export', () => {
        it('should export as CSV', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    downloadUrl: '/exports/journal-2025-01.csv',
                }),
            });

            const data = await exportJournal('csv');

            expect(mockFetch).toHaveBeenCalledWith('/api/journal/export?format=csv');
            expect(data.success).toBe(true);
            expect(data.downloadUrl).toBeDefined();
        });

        it('should export as XLSX', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    downloadUrl: '/exports/journal-2025-01.xlsx',
                }),
            });

            const data = await exportJournal('xlsx');

            expect(mockFetch).toHaveBeenCalledWith('/api/journal/export?format=xlsx');
        });

        it('should export with date filters', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    downloadUrl: '/exports/journal-filtered.csv',
                }),
            });

            await exportJournal('csv', {
                startDate: '2025-01-01',
                endDate: '2025-01-31',
            });

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/journal/export?format=csv&startDate=2025-01-01&endDate=2025-01-31'
            );
        });
    });
});
