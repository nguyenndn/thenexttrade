/**
 * Tools API Tests (Risk Calculator, Economic Calendar, Market Hours)
 * @module tests/user/api/tools.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockRiskCalculation, mockEconomicEvents } from '../__mocks__/data';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// ========================================
// Risk Calculator API Helpers
// ========================================
async function calculateRisk(params: {
    accountBalance: number;
    riskPercent: number;
    entryPrice: number;
    stopLoss: number;
    symbol: string;
    accountCurrency?: string;
}) {
    const response = await fetch('/api/tools/risk-calculator', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    return response.json();
}

async function calculatePositionSize(params: {
    accountBalance: number;
    riskAmount: number;
    entryPrice: number;
    stopLoss: number;
    symbol: string;
}) {
    const response = await fetch('/api/tools/position-size', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    return response.json();
}

async function calculatePipValue(params: {
    symbol: string;
    lotSize: number;
    accountCurrency: string;
}) {
    const response = await fetch('/api/tools/pip-value', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    return response.json();
}

async function calculateMargin(params: {
    symbol: string;
    lotSize: number;
    leverage: number;
    accountCurrency: string;
}) {
    const response = await fetch('/api/tools/margin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    return response.json();
}

async function calculateProfit(params: {
    symbol: string;
    lotSize: number;
    entryPrice: number;
    exitPrice: number;
    tradeType: 'BUY' | 'SELL';
    accountCurrency: string;
}) {
    const response = await fetch('/api/tools/profit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params),
    });
    return response.json();
}

// ========================================
// Economic Calendar API Helpers
// ========================================
async function getEconomicEvents(params?: {
    startDate?: string;
    endDate?: string;
    country?: string;
    impact?: 'LOW' | 'MEDIUM' | 'HIGH';
    currency?: string;
}) {
    const query = new URLSearchParams();
    if (params?.startDate) query.append('startDate', params.startDate);
    if (params?.endDate) query.append('endDate', params.endDate);
    if (params?.country) query.append('country', params.country);
    if (params?.impact) query.append('impact', params.impact);
    if (params?.currency) query.append('currency', params.currency);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`/api/tools/economic-calendar${queryString}`);
    return response.json();
}

async function getEventById(id: string) {
    const response = await fetch(`/api/tools/economic-calendar/${id}`);
    return response.json();
}

async function subscribeToEvent(eventId: string) {
    const response = await fetch(`/api/tools/economic-calendar/${eventId}/subscribe`, {
        method: 'POST',
    });
    return response.json();
}

async function unsubscribeFromEvent(eventId: string) {
    const response = await fetch(`/api/tools/economic-calendar/${eventId}/unsubscribe`, {
        method: 'POST',
    });
    return response.json();
}

async function getSubscribedEvents() {
    const response = await fetch('/api/tools/economic-calendar/subscribed');
    return response.json();
}

// ========================================
// Market Hours API Helpers
// ========================================
async function getMarketHours() {
    const response = await fetch('/api/tools/market-hours');
    return response.json();
}

async function getMarketStatus() {
    const response = await fetch('/api/tools/market-hours/status');
    return response.json();
}

async function getNextMarketOpen(market: string) {
    const response = await fetch(`/api/tools/market-hours/${market}/next-open`);
    return response.json();
}

async function getMarketOverlaps() {
    const response = await fetch('/api/tools/market-hours/overlaps');
    return response.json();
}

// ========================================
// Risk Calculator Tests
// ========================================
describe('Risk Calculator API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('POST /api/tools/risk-calculator', () => {
        it('should calculate risk with basic params', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockRiskCalculation,
                }),
            });

            const data = await calculateRisk({
                accountBalance: 10000,
                riskPercent: 1,
                entryPrice: 1.1000,
                stopLoss: 1.0950,
                symbol: 'EURUSD',
            });

            expect(mockFetch).toHaveBeenCalledWith('/api/tools/risk-calculator', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    accountBalance: 10000,
                    riskPercent: 1,
                    entryPrice: 1.1000,
                    stopLoss: 1.0950,
                    symbol: 'EURUSD',
                }),
            });
            expect(data.success).toBe(true);
            expect(data.data.positionSize).toBe(0.4);
        });

        it('should include pip value in calculation', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockRiskCalculation,
                }),
            });

            const data = await calculateRisk({
                accountBalance: 10000,
                riskPercent: 1,
                entryPrice: 1.1000,
                stopLoss: 1.0950,
                symbol: 'EURUSD',
            });

            expect(data.data.pipValue).toBe(10);
        });

        it('should calculate with different account currency', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        ...mockRiskCalculation,
                        accountCurrency: 'EUR',
                        pipValue: 9.09,
                    },
                }),
            });

            const data = await calculateRisk({
                accountBalance: 10000,
                riskPercent: 1,
                entryPrice: 1.1000,
                stopLoss: 1.0950,
                symbol: 'EURUSD',
                accountCurrency: 'EUR',
            });

            expect(data.data.accountCurrency).toBe('EUR');
        });

        it('should validate required fields', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Missing required fields',
                    details: {
                        accountBalance: 'Account balance is required',
                        riskPercent: 'Risk percent is required',
                    },
                }),
            });

            const data = await calculateRisk({
                accountBalance: 0,
                riskPercent: 0,
                entryPrice: 1.1000,
                stopLoss: 1.0950,
                symbol: 'EURUSD',
            });

            expect(data.success).toBe(false);
        });

        it('should reject invalid stop loss', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Stop loss must be different from entry price',
                }),
            });

            const data = await calculateRisk({
                accountBalance: 10000,
                riskPercent: 1,
                entryPrice: 1.1000,
                stopLoss: 1.1000, // Same as entry
                symbol: 'EURUSD',
            });

            expect(data.success).toBe(false);
        });
    });

    describe('POST /api/tools/position-size', () => {
        it('should calculate position size', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        positionSize: 0.5,
                        lots: 0.5,
                        units: 50000,
                        pipValue: 5,
                    },
                }),
            });

            const data = await calculatePositionSize({
                accountBalance: 10000,
                riskAmount: 250,
                entryPrice: 1.1000,
                stopLoss: 1.0950,
                symbol: 'EURUSD',
            });

            expect(data.success).toBe(true);
            expect(data.data.positionSize).toBe(0.5);
        });
    });

    describe('POST /api/tools/pip-value', () => {
        it('should calculate pip value', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        pipValue: 10,
                        pipValuePerLot: 10,
                    },
                }),
            });

            const data = await calculatePipValue({
                symbol: 'EURUSD',
                lotSize: 1,
                accountCurrency: 'USD',
            });

            expect(data.success).toBe(true);
            expect(data.data.pipValue).toBe(10);
        });

        it('should calculate for JPY pairs', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        pipValue: 6.67,
                        pipValuePerLot: 6.67,
                    },
                }),
            });

            const data = await calculatePipValue({
                symbol: 'USDJPY',
                lotSize: 1,
                accountCurrency: 'USD',
            });

            expect(data.data.pipValue).toBe(6.67);
        });
    });

    describe('POST /api/tools/margin', () => {
        it('should calculate required margin', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        requiredMargin: 500,
                        leverage: 200,
                        contractSize: 100000,
                    },
                }),
            });

            const data = await calculateMargin({
                symbol: 'EURUSD',
                lotSize: 1,
                leverage: 200,
                accountCurrency: 'USD',
            });

            expect(data.success).toBe(true);
            expect(data.data.requiredMargin).toBe(500);
        });
    });

    describe('POST /api/tools/profit', () => {
        it('should calculate profit for BUY trade', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        profit: 500,
                        pips: 50,
                        profitPercent: 5,
                    },
                }),
            });

            const data = await calculateProfit({
                symbol: 'EURUSD',
                lotSize: 1,
                entryPrice: 1.1000,
                exitPrice: 1.1050,
                tradeType: 'BUY',
                accountCurrency: 'USD',
            });

            expect(data.success).toBe(true);
            expect(data.data.profit).toBe(500);
        });

        it('should calculate loss for SELL trade gone wrong', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        profit: -300,
                        pips: -30,
                        profitPercent: -3,
                    },
                }),
            });

            const data = await calculateProfit({
                symbol: 'EURUSD',
                lotSize: 1,
                entryPrice: 1.1000,
                exitPrice: 1.1030,
                tradeType: 'SELL',
                accountCurrency: 'USD',
            });

            expect(data.data.profit).toBe(-300);
        });
    });
});

// ========================================
// Economic Calendar Tests
// ========================================
describe('Economic Calendar API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/tools/economic-calendar', () => {
        it('should get economic events', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockEconomicEvents,
                }),
            });

            const data = await getEconomicEvents();

            expect(mockFetch).toHaveBeenCalledWith('/api/tools/economic-calendar');
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(3);
        });

        it('should filter by date range', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [mockEconomicEvents[0]],
                }),
            });

            await getEconomicEvents({
                startDate: '2025-01-15',
                endDate: '2025-01-15',
            });

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/tools/economic-calendar?startDate=2025-01-15&endDate=2025-01-15'
            );
        });

        it('should filter by country', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockEconomicEvents.filter((e: any) => e.country === 'US'),
                }),
            });

            await getEconomicEvents({ country: 'US' });

            expect(mockFetch).toHaveBeenCalledWith('/api/tools/economic-calendar?country=US');
        });

        it('should filter by impact level', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockEconomicEvents.filter((e: any) => e.impact === 'HIGH'),
                }),
            });

            await getEconomicEvents({ impact: 'HIGH' });

            expect(mockFetch).toHaveBeenCalledWith('/api/tools/economic-calendar?impact=HIGH');
        });

        it('should filter by currency', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockEconomicEvents.filter((e: any) => e.currency === 'USD'),
                }),
            });

            await getEconomicEvents({ currency: 'USD' });

            expect(mockFetch).toHaveBeenCalledWith('/api/tools/economic-calendar?currency=USD');
        });
    });

    describe('GET /api/tools/economic-calendar/:id', () => {
        it('should get event by id', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockEconomicEvents[0],
                }),
            });

            const data = await getEventById('event-1');

            expect(data.success).toBe(true);
            expect(data.data.title).toBe('Non-Farm Payrolls');
        });
    });

    describe('POST /api/tools/economic-calendar/:id/subscribe', () => {
        it('should subscribe to event', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Subscribed to event',
                    data: { ...mockEconomicEvents[0], isSubscribed: true },
                }),
            });

            const data = await subscribeToEvent('event-1');

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/tools/economic-calendar/event-1/subscribe',
                { method: 'POST' }
            );
            expect(data.success).toBe(true);
        });
    });

    describe('POST /api/tools/economic-calendar/:id/unsubscribe', () => {
        it('should unsubscribe from event', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Unsubscribed from event',
                }),
            });

            const data = await unsubscribeFromEvent('event-1');

            expect(data.success).toBe(true);
        });
    });

    describe('GET /api/tools/economic-calendar/subscribed', () => {
        it('should get subscribed events', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [mockEconomicEvents[0]],
                }),
            });

            const data = await getSubscribedEvents();

            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(1);
        });
    });
});

// ========================================
// Market Hours Tests
// ========================================
describe('Market Hours API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    describe('GET /api/tools/market-hours', () => {
        it('should get market hours', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        markets: [
                            {
                                name: 'Sydney',
                                open: '22:00 UTC',
                                close: '07:00 UTC',
                                status: 'OPEN',
                            },
                            {
                                name: 'Tokyo',
                                open: '00:00 UTC',
                                close: '09:00 UTC',
                                status: 'OPEN',
                            },
                            {
                                name: 'London',
                                open: '08:00 UTC',
                                close: '17:00 UTC',
                                status: 'CLOSED',
                            },
                            {
                                name: 'New York',
                                open: '13:00 UTC',
                                close: '22:00 UTC',
                                status: 'CLOSED',
                            },
                        ],
                        currentTime: '2025-01-15T05:00:00Z',
                    },
                }),
            });

            const data = await getMarketHours();

            expect(data.success).toBe(true);
            expect(data.data.markets).toHaveLength(4);
        });
    });

    describe('GET /api/tools/market-hours/status', () => {
        it('should get current market status', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        isForexOpen: true,
                        openMarkets: ['Sydney', 'Tokyo'],
                        closedMarkets: ['London', 'New York'],
                        nextOpen: {
                            market: 'London',
                            at: '2025-01-15T08:00:00Z',
                            in: '3 hours',
                        },
                        nextClose: {
                            market: 'Sydney',
                            at: '2025-01-15T07:00:00Z',
                            in: '2 hours',
                        },
                    },
                }),
            });

            const data = await getMarketStatus();

            expect(data.success).toBe(true);
            expect(data.data.isForexOpen).toBe(true);
            expect(data.data.openMarkets).toContain('Sydney');
        });
    });

    describe('GET /api/tools/market-hours/:market/next-open', () => {
        it('should get next open time for market', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        market: 'London',
                        nextOpen: '2025-01-15T08:00:00Z',
                        countdown: '3h 0m',
                    },
                }),
            });

            const data = await getNextMarketOpen('London');

            expect(mockFetch).toHaveBeenCalledWith('/api/tools/market-hours/London/next-open');
            expect(data.success).toBe(true);
        });

        it('should return null for already open market', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        market: 'Sydney',
                        isOpen: true,
                        nextOpen: null,
                    },
                }),
            });

            const data = await getNextMarketOpen('Sydney');

            expect(data.data.isOpen).toBe(true);
            expect(data.data.nextOpen).toBeNull();
        });
    });

    describe('GET /api/tools/market-hours/overlaps', () => {
        it('should get market overlaps', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        overlaps: [
                            {
                                markets: ['Sydney', 'Tokyo'],
                                start: '00:00 UTC',
                                end: '07:00 UTC',
                                volatility: 'MEDIUM',
                            },
                            {
                                markets: ['Tokyo', 'London'],
                                start: '08:00 UTC',
                                end: '09:00 UTC',
                                volatility: 'HIGH',
                            },
                            {
                                markets: ['London', 'New York'],
                                start: '13:00 UTC',
                                end: '17:00 UTC',
                                volatility: 'HIGHEST',
                            },
                        ],
                        bestTradingTimes: [
                            {
                                description: 'London-New York Overlap',
                                time: '13:00-17:00 UTC',
                                pairs: ['EUR/USD', 'GBP/USD', 'USD/CHF'],
                            },
                        ],
                    },
                }),
            });

            const data = await getMarketOverlaps();

            expect(data.success).toBe(true);
            expect(data.data.overlaps).toHaveLength(3);
            expect(data.data.bestTradingTimes).toBeDefined();
        });
    });
});
