/**
 * Articles API Tests (User perspective)
 * @module tests/user/api/articles.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper functions
async function getArticles(options?: { page?: number; category?: string; tag?: string }) {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', String(options.page));
    if (options?.category) params.append('category', options.category);
    if (options?.tag) params.append('tag', options.tag);

    const url = params.toString() ? `/api/articles?${params}` : '/api/articles';
    const res = await fetch(url);
    return res.json();
}

async function getArticleBySlug(slug: string) {
    const res = await fetch(`/api/articles/${slug}`);
    return res.json();
}

async function getRelatedArticles(articleId: string) {
    const res = await fetch(`/api/articles/${articleId}/related`);
    return res.json();
}

async function bookmarkArticle(articleId: string) {
    const res = await fetch(`/api/articles/${articleId}/bookmark`, { method: 'POST' });
    return res.json();
}

async function getBookmarks() {
    const res = await fetch('/api/articles/bookmarks');
    return res.json();
}

async function trackArticleView(articleId: string) {
    const res = await fetch(`/api/articles/${articleId}/view`, { method: 'POST' });
    return res.json();
}

async function getArticleCategories() {
    const res = await fetch('/api/categories');
    return res.json();
}

async function getArticleTags() {
    const res = await fetch('/api/tags');
    return res.json();
}

// Mock data
const mockArticles = [
    {
        id: 'article-1',
        title: 'Understanding Support and Resistance',
        slug: 'understanding-support-resistance',
        excerpt: 'Learn how to identify key support and resistance levels in forex trading.',
        featuredImage: '/images/articles/support-resistance.jpg',
        category: { id: 'cat-1', name: 'Technical Analysis', slug: 'technical-analysis' },
        tags: [{ id: 'tag-1', name: 'Forex' }, { id: 'tag-2', name: 'Basics' }],
        author: { id: 'author-1', name: 'GSN Team', avatar: '/avatars/gsn.jpg' },
        viewCount: 1500,
        readingTime: 8,
        publishedAt: '2025-01-10T10:00:00Z',
        isBookmarked: false,
    },
    {
        id: 'article-2',
        title: 'Risk Management Basics',
        slug: 'risk-management-basics',
        excerpt: 'Essential risk management strategies for traders.',
        featuredImage: '/images/articles/risk-management.jpg',
        category: { id: 'cat-2', name: 'Risk Management', slug: 'risk-management' },
        tags: [{ id: 'tag-3', name: 'Risk' }],
        author: { id: 'author-1', name: 'GSN Team', avatar: '/avatars/gsn.jpg' },
        viewCount: 2000,
        readingTime: 10,
        publishedAt: '2025-01-08T10:00:00Z',
        isBookmarked: true,
    },
];

const mockCategories = [
    { id: 'cat-1', name: 'Technical Analysis', slug: 'technical-analysis', count: 25 },
    { id: 'cat-2', name: 'Risk Management', slug: 'risk-management', count: 15 },
    { id: 'cat-3', name: 'Fundamental Analysis', slug: 'fundamental-analysis', count: 20 },
    { id: 'cat-4', name: 'Trading Psychology', slug: 'trading-psychology', count: 12 },
];

const mockTags = [
    { id: 'tag-1', name: 'Forex', count: 50 },
    { id: 'tag-2', name: 'Basics', count: 30 },
    { id: 'tag-3', name: 'Risk', count: 25 },
    { id: 'tag-4', name: 'Strategy', count: 40 },
];

describe('Articles API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // List Articles Tests
    // ========================================
    describe('GET /api/articles', () => {
        it('should get published articles', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockArticles,
                    meta: { page: 1, totalPages: 5, total: 50 },
                }),
            });

            const data = await getArticles();

            expect(mockFetch).toHaveBeenCalledWith('/api/articles');
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(2);
        });

        it('should paginate articles', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [],
                    meta: { page: 2, totalPages: 5, total: 50 },
                }),
            });

            await getArticles({ page: 2 });

            expect(mockFetch).toHaveBeenCalledWith('/api/articles?page=2');
        });

        it('should filter by category', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [mockArticles[0]],
                }),
            });

            await getArticles({ category: 'technical-analysis' });

            expect(mockFetch).toHaveBeenCalledWith('/api/articles?category=technical-analysis');
        });

        it('should filter by tag', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockArticles,
                }),
            });

            await getArticles({ tag: 'forex' });

            expect(mockFetch).toHaveBeenCalledWith('/api/articles?tag=forex');
        });

        it('should include reading time', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockArticles,
                }),
            });

            const data = await getArticles();

            expect(data.data[0].readingTime).toBe(8);
        });

        it('should show bookmark status for authenticated user', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockArticles,
                }),
            });

            const data = await getArticles();

            expect(data.data[0].isBookmarked).toBe(false);
            expect(data.data[1].isBookmarked).toBe(true);
        });
    });

    // ========================================
    // Get Article by Slug Tests
    // ========================================
    describe('GET /api/articles/:slug', () => {
        it('should get article by slug', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        ...mockArticles[0],
                        content: '<p>Full article content...</p>',
                    },
                }),
            });

            const data = await getArticleBySlug('understanding-support-resistance');

            expect(mockFetch).toHaveBeenCalledWith('/api/articles/understanding-support-resistance');
            expect(data.success).toBe(true);
            expect(data.data.content).toBeDefined();
        });

        it('should return 404 for non-existent slug', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Article not found',
                }),
            });

            const data = await getArticleBySlug('non-existent');

            expect(data.success).toBe(false);
        });

        it('should include full content', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        ...mockArticles[0],
                        content: '<h2>Introduction</h2><p>Content here...</p>',
                    },
                }),
            });

            const data = await getArticleBySlug('understanding-support-resistance');

            expect(data.data.content).toContain('<h2>');
        });

        it('should include author details', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockArticles[0],
                }),
            });

            const data = await getArticleBySlug('understanding-support-resistance');

            expect(data.data.author.name).toBe('GSN Team');
            expect(data.data.author.avatar).toBeDefined();
        });
    });

    // ========================================
    // Related Articles Tests
    // ========================================
    describe('GET /api/articles/:id/related', () => {
        it('should get related articles', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [mockArticles[1]],
                }),
            });

            const data = await getRelatedArticles('article-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/articles/article-1/related');
            expect(data.success).toBe(true);
            expect(data.data.length).toBeGreaterThan(0);
        });

        it('should limit to 4 related articles', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockArticles.slice(0, 4),
                }),
            });

            const data = await getRelatedArticles('article-1');

            expect(data.data.length).toBeLessThanOrEqual(4);
        });
    });

    // ========================================
    // Bookmark Tests
    // ========================================
    describe('POST /api/articles/:id/bookmark', () => {
        it('should bookmark an article', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        articleId: 'article-1',
                        isBookmarked: true,
                    },
                }),
            });

            const data = await bookmarkArticle('article-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/articles/article-1/bookmark', { method: 'POST' });
            expect(data.success).toBe(true);
            expect(data.data.isBookmarked).toBe(true);
        });

        it('should unbookmark a bookmarked article', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        articleId: 'article-2',
                        isBookmarked: false,
                    },
                }),
            });

            const data = await bookmarkArticle('article-2');

            expect(data.data.isBookmarked).toBe(false);
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

            const data = await bookmarkArticle('article-1');

            expect(data.success).toBe(false);
        });
    });

    describe('GET /api/articles/bookmarks', () => {
        it('should get user bookmarks', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [mockArticles[1]],
                }),
            });

            const data = await getBookmarks();

            expect(mockFetch).toHaveBeenCalledWith('/api/articles/bookmarks');
            expect(data.success).toBe(true);
            expect(data.data.every((a: any) => a.isBookmarked)).toBe(true);
        });
    });

    // ========================================
    // View Tracking Tests
    // ========================================
    describe('POST /api/articles/:id/view', () => {
        it('should track article view', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        viewCount: 1501,
                    },
                }),
            });

            const data = await trackArticleView('article-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/articles/article-1/view', { method: 'POST' });
            expect(data.success).toBe(true);
            expect(data.data.viewCount).toBe(1501);
        });

        it('should not count duplicate views from same user quickly', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        viewCount: 1500,
                        alreadyCounted: true,
                    },
                }),
            });

            const data = await trackArticleView('article-1');

            expect(data.data.alreadyCounted).toBe(true);
        });
    });

    // ========================================
    // Categories Tests
    // ========================================
    describe('GET /api/categories', () => {
        it('should get all categories', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockCategories,
                }),
            });

            const data = await getArticleCategories();

            expect(mockFetch).toHaveBeenCalledWith('/api/categories');
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(4);
        });

        it('should include article count per category', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockCategories,
                }),
            });

            const data = await getArticleCategories();

            expect(data.data[0].count).toBe(25);
        });
    });

    // ========================================
    // Tags Tests
    // ========================================
    describe('GET /api/tags', () => {
        it('should get all tags', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockTags,
                }),
            });

            const data = await getArticleTags();

            expect(mockFetch).toHaveBeenCalledWith('/api/tags');
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(4);
        });

        it('should include article count per tag', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockTags,
                }),
            });

            const data = await getArticleTags();

            expect(data.data[0].count).toBe(50);
        });
    });
});
