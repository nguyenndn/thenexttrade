/**
 * Brokers API Tests (User perspective)
 * @module tests/user/api/brokers.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper functions
async function getBrokers(options?: { page?: number; category?: string; sort?: string }) {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', String(options.page));
    if (options?.category) params.append('category', options.category);
    if (options?.sort) params.append('sort', options.sort);

    const url = params.toString() ? `/api/brokers?${params}` : '/api/brokers';
    const res = await fetch(url);
    return res.json();
}

async function getBrokerBySlug(slug: string) {
    const res = await fetch(`/api/brokers/${slug}`);
    return res.json();
}

async function compareBrokers(brokerIds: string[]) {
    const res = await fetch('/api/brokers/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brokerIds }),
    });
    return res.json();
}

async function getBrokerReviews(brokerId: string) {
    const res = await fetch(`/api/brokers/${brokerId}/reviews`);
    return res.json();
}

async function submitBrokerReview(brokerId: string, review: any) {
    const res = await fetch(`/api/brokers/${brokerId}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(review),
    });
    return res.json();
}

async function getFeaturedBrokers() {
    const res = await fetch('/api/brokers/featured');
    return res.json();
}

// Mock data
const mockBrokers = [
    {
        id: 'broker-1',
        name: 'XM Trading',
        slug: 'xm-trading',
        logo: '/images/brokers/xm.png',
        description: 'A leading forex and CFD broker.',
        rating: 4.5,
        reviewCount: 250,
        minDeposit: 5,
        maxLeverage: 888,
        spreadsFrom: 0.6,
        regulations: ['CySEC', 'ASIC', 'IFSC'],
        tradingPlatforms: ['MT4', 'MT5', 'WebTrader'],
        accountTypes: ['Standard', 'Micro', 'Ultra Low'],
        features: ['Negative Balance Protection', 'Free VPS', 'Copy Trading'],
        isFeatured: true,
    },
    {
        id: 'broker-2',
        name: 'IC Markets',
        slug: 'ic-markets',
        logo: '/images/brokers/icmarkets.png',
        description: 'True ECN broker with low spreads.',
        rating: 4.7,
        reviewCount: 320,
        minDeposit: 200,
        maxLeverage: 500,
        spreadsFrom: 0.0,
        regulations: ['ASIC', 'CySEC', 'FSA'],
        tradingPlatforms: ['MT4', 'MT5', 'cTrader'],
        accountTypes: ['Raw Spread', 'Standard'],
        features: ['Low Latency', 'No Dealing Desk', 'Deep Liquidity'],
        isFeatured: true,
    },
];

const mockReviews = [
    {
        id: 'review-1',
        userId: 'user-1',
        userName: 'TradingPro',
        rating: 5,
        title: 'Excellent spreads and execution',
        content: 'Best broker I have used for scalping. Very low spreads and fast execution.',
        pros: ['Low spreads', 'Fast execution', 'Good customer support'],
        cons: ['Limited educational resources'],
        createdAt: '2025-01-15T10:00:00Z',
        helpfulCount: 25,
    },
    {
        id: 'review-2',
        userId: 'user-2',
        userName: 'ForexNewbie',
        rating: 4,
        title: 'Good for beginners',
        content: 'Great platform for new traders. Easy to use and understand.',
        pros: ['User friendly', 'Good demo account'],
        cons: ['Higher minimum deposit'],
        createdAt: '2025-01-14T08:00:00Z',
        helpfulCount: 15,
    },
];

describe('Brokers API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // List Brokers Tests
    // ========================================
    describe('GET /api/brokers', () => {
        it('should get all brokers', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockBrokers,
                    meta: { page: 1, totalPages: 3, total: 25 },
                }),
            });

            const data = await getBrokers();

            expect(mockFetch).toHaveBeenCalledWith('/api/brokers');
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(2);
        });

        it('should paginate brokers', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [],
                    meta: { page: 2, totalPages: 3, total: 25 },
                }),
            });

            await getBrokers({ page: 2 });

            expect(mockFetch).toHaveBeenCalledWith('/api/brokers?page=2');
        });

        it('should filter by category', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockBrokers,
                }),
            });

            await getBrokers({ category: 'ecn' });

            expect(mockFetch).toHaveBeenCalledWith('/api/brokers?category=ecn');
        });

        it('should sort by rating', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [mockBrokers[1], mockBrokers[0]], // IC Markets first (higher rating)
                }),
            });

            const data = await getBrokers({ sort: 'rating' });

            expect(mockFetch).toHaveBeenCalledWith('/api/brokers?sort=rating');
            expect(data.data[0].rating).toBeGreaterThanOrEqual(data.data[1].rating);
        });

        it('should include broker details', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockBrokers,
                }),
            });

            const data = await getBrokers();

            expect(data.data[0].minDeposit).toBeDefined();
            expect(data.data[0].maxLeverage).toBeDefined();
            expect(data.data[0].spreadsFrom).toBeDefined();
            expect(data.data[0].regulations).toBeInstanceOf(Array);
        });
    });

    // ========================================
    // Get Broker by Slug Tests
    // ========================================
    describe('GET /api/brokers/:slug', () => {
        it('should get broker by slug', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        ...mockBrokers[0],
                        fullDescription: '<p>Full broker description...</p>',
                        depositMethods: ['Bank Transfer', 'Credit Card', 'Skrill'],
                        withdrawalMethods: ['Bank Transfer', 'Skrill'],
                    },
                }),
            });

            const data = await getBrokerBySlug('xm-trading');

            expect(mockFetch).toHaveBeenCalledWith('/api/brokers/xm-trading');
            expect(data.success).toBe(true);
            expect(data.data.name).toBe('XM Trading');
        });

        it('should return 404 for non-existent broker', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Broker not found',
                }),
            });

            const data = await getBrokerBySlug('non-existent-broker');

            expect(data.success).toBe(false);
        });

        it('should include full broker details', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        ...mockBrokers[1],
                        tradingPlatforms: ['MT4', 'MT5', 'cTrader'],
                        accountTypes: ['Raw Spread', 'Standard'],
                    },
                }),
            });

            const data = await getBrokerBySlug('ic-markets');

            expect(data.data.tradingPlatforms).toContain('cTrader');
            expect(data.data.accountTypes).toContain('Raw Spread');
        });
    });

    // ========================================
    // Featured Brokers Tests
    // ========================================
    describe('GET /api/brokers/featured', () => {
        it('should get featured brokers', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockBrokers.filter((b) => b.isFeatured),
                }),
            });

            const data = await getFeaturedBrokers();

            expect(mockFetch).toHaveBeenCalledWith('/api/brokers/featured');
            expect(data.success).toBe(true);
            expect(data.data.every((b: any) => b.isFeatured)).toBe(true);
        });
    });

    // ========================================
    // Broker Comparison Tests
    // ========================================
    describe('POST /api/brokers/compare', () => {
        it('should compare multiple brokers', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        brokers: mockBrokers,
                        comparison: {
                            minDeposit: { lowest: 'XM Trading', value: 5 },
                            maxLeverage: { highest: 'XM Trading', value: 888 },
                            spreads: { lowest: 'IC Markets', value: 0.0 },
                            rating: { highest: 'IC Markets', value: 4.7 },
                        },
                    },
                }),
            });

            const data = await compareBrokers(['broker-1', 'broker-2']);

            expect(mockFetch).toHaveBeenCalledWith('/api/brokers/compare', expect.anything());
            expect(data.success).toBe(true);
            expect(data.data.brokers).toHaveLength(2);
            expect(data.data.comparison).toBeDefined();
        });

        it('should limit comparison to 4 brokers', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Maximum 4 brokers can be compared',
                }),
            });

            const data = await compareBrokers(['b1', 'b2', 'b3', 'b4', 'b5']);

            expect(data.success).toBe(false);
        });

        it('should require at least 2 brokers', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Minimum 2 brokers required for comparison',
                }),
            });

            const data = await compareBrokers(['broker-1']);

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Broker Reviews Tests
    // ========================================
    describe('GET /api/brokers/:id/reviews', () => {
        it('should get broker reviews', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockReviews,
                    meta: { averageRating: 4.5, totalReviews: 250 },
                }),
            });

            const data = await getBrokerReviews('broker-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/brokers/broker-1/reviews');
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(2);
            expect(data.meta.averageRating).toBe(4.5);
        });

        it('should include review details', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockReviews,
                }),
            });

            const data = await getBrokerReviews('broker-1');

            expect(data.data[0].pros).toBeInstanceOf(Array);
            expect(data.data[0].cons).toBeInstanceOf(Array);
            expect(data.data[0].helpfulCount).toBeDefined();
        });
    });

    describe('POST /api/brokers/:id/reviews', () => {
        it('should submit a broker review', async () => {
            const newReview = {
                rating: 5,
                title: 'Great broker',
                content: 'I love trading with this broker.',
                pros: ['Fast execution', 'Good support'],
                cons: ['Could have more pairs'],
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        id: 'review-3',
                        ...newReview,
                        userId: 'user-1',
                        userName: 'CurrentUser',
                        createdAt: new Date().toISOString(),
                    },
                }),
            });

            const data = await submitBrokerReview('broker-1', newReview);

            expect(data.success).toBe(true);
            expect(data.data.rating).toBe(5);
        });

        it('should require authentication', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Unauthorized',
                }),
            });

            const data = await submitBrokerReview('broker-1', { rating: 5 });

            expect(data.success).toBe(false);
        });

        it('should validate rating range', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Rating must be between 1 and 5',
                }),
            });

            const data = await submitBrokerReview('broker-1', { rating: 10 });

            expect(data.success).toBe(false);
        });

        it('should prevent duplicate reviews', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 409,
                json: () => Promise.resolve({
                    success: false,
                    error: 'You have already reviewed this broker',
                }),
            });

            const data = await submitBrokerReview('broker-1', { rating: 4, title: 'Another review' });

            expect(data.success).toBe(false);
        });
    });
});
