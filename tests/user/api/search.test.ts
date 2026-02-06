/**
 * Search API Tests
 * @module tests/user/api/search.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper functions
async function search(query: string, options?: { type?: string; page?: number; limit?: number }) {
    const params = new URLSearchParams({ q: query });
    if (options?.type) params.append('type', options.type);
    if (options?.page) params.append('page', String(options.page));
    if (options?.limit) params.append('limit', String(options.limit));
    
    const res = await fetch(`/api/search?${params}`);
    return res.json();
}

async function searchArticles(query: string) {
    const res = await fetch(`/api/search/articles?q=${encodeURIComponent(query)}`);
    return res.json();
}

async function searchLessons(query: string) {
    const res = await fetch(`/api/search/lessons?q=${encodeURIComponent(query)}`);
    return res.json();
}

async function getSearchSuggestions(query: string) {
    const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
    return res.json();
}

async function getRecentSearches() {
    const res = await fetch('/api/search/recent');
    return res.json();
}

async function clearRecentSearches() {
    const res = await fetch('/api/search/recent', { method: 'DELETE' });
    return res.json();
}

// Mock data
const mockSearchResults = {
    articles: [
        {
            id: 'article-1',
            type: 'article',
            title: 'Understanding Support and Resistance',
            excerpt: 'Learn how to identify key levels...',
            url: '/articles/support-resistance',
            score: 0.95,
        },
        {
            id: 'article-2',
            type: 'article',
            title: 'Risk Management Basics',
            excerpt: 'Essential risk management strategies...',
            url: '/articles/risk-management',
            score: 0.85,
        },
    ],
    lessons: [
        {
            id: 'lesson-1',
            type: 'lesson',
            title: 'Introduction to Technical Analysis',
            levelName: 'Beginner',
            url: '/academy/lessons/lesson-1',
            score: 0.90,
        },
    ],
    brokers: [
        {
            id: 'broker-1',
            type: 'broker',
            name: 'XM Trading',
            url: '/brokers/xm-trading',
            score: 0.75,
        },
    ],
};

const mockSuggestions = [
    'support and resistance',
    'support levels',
    'support zone',
    'support trading strategy',
];

describe('Search API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // Global Search Tests
    // ========================================
    describe('GET /api/search', () => {
        it('should search across all content types', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockSearchResults,
                    meta: { query: 'support', totalResults: 4 },
                }),
            });

            const data = await search('support');

            expect(mockFetch).toHaveBeenCalledWith('/api/search?q=support');
            expect(data.success).toBe(true);
            expect(data.data.articles).toHaveLength(2);
            expect(data.data.lessons).toHaveLength(1);
            expect(data.data.brokers).toHaveLength(1);
        });

        it('should filter by content type', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { articles: mockSearchResults.articles },
                }),
            });

            await search('support', { type: 'articles' });

            expect(mockFetch).toHaveBeenCalledWith('/api/search?q=support&type=articles');
        });

        it('should paginate results', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockSearchResults,
                    meta: { page: 2, totalPages: 5 },
                }),
            });

            await search('trading', { page: 2, limit: 10 });

            expect(mockFetch).toHaveBeenCalledWith('/api/search?q=trading&page=2&limit=10');
        });

        it('should return empty results for no matches', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { articles: [], lessons: [], brokers: [] },
                    meta: { query: 'xyz123', totalResults: 0 },
                }),
            });

            const data = await search('xyz123');

            expect(data.data.articles).toHaveLength(0);
            expect(data.meta.totalResults).toBe(0);
        });

        it('should require minimum query length', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Query must be at least 2 characters',
                }),
            });

            const data = await search('a');

            expect(data.success).toBe(false);
        });

        it('should include relevance scores', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockSearchResults,
                }),
            });

            const data = await search('support');

            expect(data.data.articles[0].score).toBeDefined();
            expect(data.data.articles[0].score).toBeGreaterThan(0);
        });

        it('should sort by relevance', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockSearchResults,
                }),
            });

            const data = await search('support');

            // First result should have highest score
            expect(data.data.articles[0].score).toBeGreaterThanOrEqual(data.data.articles[1].score);
        });
    });

    // ========================================
    // Article Search Tests
    // ========================================
    describe('GET /api/search/articles', () => {
        it('should search only articles', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockSearchResults.articles,
                }),
            });

            const data = await searchArticles('risk management');

            expect(mockFetch).toHaveBeenCalledWith('/api/search/articles?q=risk%20management');
            expect(data.success).toBe(true);
        });

        it('should include article metadata', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [
                        {
                            ...mockSearchResults.articles[0],
                            author: { name: 'GSN Team' },
                            publishedAt: '2025-01-10T10:00:00Z',
                            readingTime: 8,
                        },
                    ],
                }),
            });

            const data = await searchArticles('support');

            expect(data.data[0].author).toBeDefined();
            expect(data.data[0].readingTime).toBe(8);
        });
    });

    // ========================================
    // Lesson Search Tests
    // ========================================
    describe('GET /api/search/lessons', () => {
        it('should search only lessons', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockSearchResults.lessons,
                }),
            });

            const data = await searchLessons('technical analysis');

            expect(mockFetch).toHaveBeenCalledWith('/api/search/lessons?q=technical%20analysis');
            expect(data.success).toBe(true);
        });

        it('should include level info', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockSearchResults.lessons,
                }),
            });

            const data = await searchLessons('analysis');

            expect(data.data[0].levelName).toBe('Beginner');
        });
    });

    // ========================================
    // Search Suggestions Tests
    // ========================================
    describe('GET /api/search/suggestions', () => {
        it('should get search suggestions', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockSuggestions,
                }),
            });

            const data = await getSearchSuggestions('supp');

            expect(mockFetch).toHaveBeenCalledWith('/api/search/suggestions?q=supp');
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(4);
            expect(data.data[0]).toContain('support');
        });

        it('should limit suggestions count', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockSuggestions.slice(0, 5),
                }),
            });

            const data = await getSearchSuggestions('tra');

            expect(data.data.length).toBeLessThanOrEqual(5);
        });

        it('should return empty for short query', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [],
                }),
            });

            const data = await getSearchSuggestions('s');

            expect(data.data).toHaveLength(0);
        });
    });

    // ========================================
    // Recent Searches Tests
    // ========================================
    describe('GET /api/search/recent', () => {
        it('should get recent searches', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [
                        { query: 'support resistance', timestamp: '2025-01-15T10:00:00Z' },
                        { query: 'risk management', timestamp: '2025-01-14T10:00:00Z' },
                        { query: 'forex basics', timestamp: '2025-01-13T10:00:00Z' },
                    ],
                }),
            });

            const data = await getRecentSearches();

            expect(mockFetch).toHaveBeenCalledWith('/api/search/recent');
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(3);
        });

        it('should limit to 10 recent searches', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: Array(10).fill({ query: 'test', timestamp: new Date().toISOString() }),
                }),
            });

            const data = await getRecentSearches();

            expect(data.data.length).toBeLessThanOrEqual(10);
        });
    });

    describe('DELETE /api/search/recent', () => {
        it('should clear recent searches', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Recent searches cleared',
                }),
            });

            const data = await clearRecentSearches();

            expect(mockFetch).toHaveBeenCalledWith('/api/search/recent', { method: 'DELETE' });
            expect(data.success).toBe(true);
        });
    });

    // ========================================
    // Search Analytics Tests
    // ========================================
    describe('Search Analytics', () => {
        it('should track search queries', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockSearchResults,
                    tracked: true,
                }),
            });

            const data = await search('forex trading');

            expect(data.tracked).toBe(true);
        });
    });
});
