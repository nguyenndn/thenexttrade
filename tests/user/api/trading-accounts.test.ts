/**
 * Trading Accounts API Tests
 * @module tests/user/api/trading-accounts.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockTradingAccounts } from '../__mocks__/data';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// API helper functions
async function getTradingAccounts() {
    const response = await fetch('/api/trading-accounts');
    return response.json();
}

async function getTradingAccountById(id: string) {
    const response = await fetch(`/api/trading-accounts/${id}`);
    return response.json();
}

async function createTradingAccount(data: {
    name: string;
    broker: string;
    accountNumber: string;
    accountType: 'LIVE' | 'DEMO';
    currency: string;
    balance: number;
    leverage: string;
    platform: string;
}) {
    const response = await fetch('/api/trading-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

async function updateTradingAccount(id: string, data: Partial<{
    name: string;
    balance: number;
    equity: number;
    leverage: string;
    isActive: boolean;
}>) {
    const response = await fetch(`/api/trading-accounts/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

async function deleteTradingAccount(id: string) {
    const response = await fetch(`/api/trading-accounts/${id}`, {
        method: 'DELETE',
    });
    return response.json();
}

async function setPrimaryAccount(id: string) {
    const response = await fetch(`/api/trading-accounts/${id}/set-primary`, {
        method: 'POST',
    });
    return response.json();
}

async function syncAccountBalance(id: string) {
    const response = await fetch(`/api/trading-accounts/${id}/sync`, {
        method: 'POST',
    });
    return response.json();
}

async function getAccountStats(id: string, period?: string) {
    const query = period ? `?period=${period}` : '';
    const response = await fetch(`/api/trading-accounts/${id}/stats${query}`);
    return response.json();
}

describe('Trading Accounts API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // List Accounts Tests
    // ========================================
    describe('GET /api/trading-accounts', () => {
        it('should get all trading accounts', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockTradingAccounts,
                }),
            });

            const data = await getTradingAccounts();

            expect(mockFetch).toHaveBeenCalledWith('/api/trading-accounts');
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(2);
        });

        it('should return accounts with primary flag', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockTradingAccounts,
                }),
            });

            const data = await getTradingAccounts();

            const primary = data.data.find((a: any) => a.isPrimary);
            expect(primary).toBeDefined();
            expect(primary.id).toBe('account-1');
        });
    });

    // ========================================
    // Get Single Account Tests
    // ========================================
    describe('GET /api/trading-accounts/:id', () => {
        it('should get account by id', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockTradingAccounts[0],
                }),
            });

            const data = await getTradingAccountById('account-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/trading-accounts/account-1');
            expect(data.success).toBe(true);
            expect(data.data.name).toBe('Main Trading Account');
        });

        it('should return error for non-existent account', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Trading account not found',
                }),
            });

            const data = await getTradingAccountById('non-existent');

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Create Account Tests
    // ========================================
    describe('POST /api/trading-accounts', () => {
        const validAccount = {
            name: 'New Account',
            broker: 'FXCM',
            accountNumber: '99999999',
            accountType: 'LIVE' as const,
            currency: 'USD',
            balance: 5000,
            leverage: '1:200',
            platform: 'MT5',
        };

        it('should create a new trading account', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { id: 'account-new', ...validAccount, isActive: true },
                }),
            });

            const data = await createTradingAccount(validAccount);

            expect(mockFetch).toHaveBeenCalledWith('/api/trading-accounts', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validAccount),
            });
            expect(data.success).toBe(true);
        });

        it('should validate required fields', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Validation failed',
                    details: {
                        name: 'Name is required',
                        broker: 'Broker is required',
                    },
                }),
            });

            const data = await createTradingAccount({
                ...validAccount,
                name: '',
                broker: '',
            });

            expect(data.success).toBe(false);
        });

        it('should validate account number uniqueness', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Account number already exists',
                }),
            });

            const data = await createTradingAccount({
                ...validAccount,
                accountNumber: '12345678', // Existing
            });

            expect(data.success).toBe(false);
            expect(data.error).toBe('Account number already exists');
        });

        it('should validate balance is positive', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Balance must be positive',
                }),
            });

            const data = await createTradingAccount({
                ...validAccount,
                balance: -100,
            });

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Update Account Tests
    // ========================================
    describe('PATCH /api/trading-accounts/:id', () => {
        it('should update trading account', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockTradingAccounts[0], name: 'Updated Name' },
                }),
            });

            const data = await updateTradingAccount('account-1', { name: 'Updated Name' });

            expect(mockFetch).toHaveBeenCalledWith('/api/trading-accounts/account-1', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Updated Name' }),
            });
            expect(data.success).toBe(true);
            expect(data.data.name).toBe('Updated Name');
        });

        it('should update balance and equity', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockTradingAccounts[0], balance: 12000, equity: 12500 },
                }),
            });

            const data = await updateTradingAccount('account-1', {
                balance: 12000,
                equity: 12500,
            });

            expect(data.data.balance).toBe(12000);
            expect(data.data.equity).toBe(12500);
        });

        it('should deactivate account', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockTradingAccounts[0], isActive: false },
                }),
            });

            const data = await updateTradingAccount('account-1', { isActive: false });

            expect(data.data.isActive).toBe(false);
        });
    });

    // ========================================
    // Delete Account Tests
    // ========================================
    describe('DELETE /api/trading-accounts/:id', () => {
        it('should delete trading account', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Account deleted successfully',
                }),
            });

            const data = await deleteTradingAccount('account-2');

            expect(mockFetch).toHaveBeenCalledWith('/api/trading-accounts/account-2', {
                method: 'DELETE',
            });
            expect(data.success).toBe(true);
        });

        it('should not delete primary account', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Cannot delete primary account. Set another account as primary first.',
                }),
            });

            const data = await deleteTradingAccount('account-1');

            expect(data.success).toBe(false);
        });

        it('should not delete account with open trades', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Cannot delete account with open trades',
                    openTrades: 3,
                }),
            });

            const data = await deleteTradingAccount('account-1');

            expect(data.success).toBe(false);
            expect(data.openTrades).toBe(3);
        });
    });

    // ========================================
    // Set Primary Account Tests
    // ========================================
    describe('POST /api/trading-accounts/:id/set-primary', () => {
        it('should set account as primary', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockTradingAccounts[1], isPrimary: true },
                }),
            });

            const data = await setPrimaryAccount('account-2');

            expect(mockFetch).toHaveBeenCalledWith('/api/trading-accounts/account-2/set-primary', {
                method: 'POST',
            });
            expect(data.success).toBe(true);
            expect(data.data.isPrimary).toBe(true);
        });

        it('should update previous primary to non-primary', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockTradingAccounts[1], isPrimary: true },
                    previousPrimaryId: 'account-1',
                }),
            });

            const data = await setPrimaryAccount('account-2');

            expect(data.previousPrimaryId).toBe('account-1');
        });
    });

    // ========================================
    // Sync Balance Tests
    // ========================================
    describe('POST /api/trading-accounts/:id/sync', () => {
        it('should sync account balance', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        ...mockTradingAccounts[0],
                        balance: 10500,
                        equity: 10750,
                        lastSyncAt: '2025-01-15T12:00:00Z',
                    },
                }),
            });

            const data = await syncAccountBalance('account-1');

            expect(data.success).toBe(true);
            expect(data.data.lastSyncAt).toBeDefined();
        });

        it('should handle sync failure', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 503,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Unable to connect to broker API',
                }),
            });

            const data = await syncAccountBalance('account-1');

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Account Stats Tests
    // ========================================
    describe('GET /api/trading-accounts/:id/stats', () => {
        it('should get account statistics', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        totalTrades: 50,
                        winRate: 62,
                        totalPnl: 2500,
                        profitFactor: 1.6,
                        averageTrade: 50,
                    },
                }),
            });

            const data = await getAccountStats('account-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/trading-accounts/account-1/stats');
            expect(data.success).toBe(true);
            expect(data.data.winRate).toBe(62);
        });

        it('should filter stats by period', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { totalTrades: 15, totalPnl: 800 },
                }),
            });

            await getAccountStats('account-1', 'month');

            expect(mockFetch).toHaveBeenCalledWith('/api/trading-accounts/account-1/stats?period=month');
        });
    });
});
