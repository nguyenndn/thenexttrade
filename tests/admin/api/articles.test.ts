/**
 * Articles API Tests
 * @module tests/admin/api/articles.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockArticles, mockCategories, mockAuthors } from '../__mocks__/data';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// API helper functions
async function getArticles(params: {
    status?: string;
    categoryId?: string;
    authorId?: string;
    search?: string;
    page?: number;
    limit?: number;
} = {}) {
    const query = new URLSearchParams();
    if (params.status) query.set('status', params.status);
    if (params.categoryId) query.set('categoryId', params.categoryId);
    if (params.authorId) query.set('authorId', params.authorId);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const response = await fetch(`/api/admin/articles?${query.toString()}`);
    return response.json();
}

async function getArticleById(id: string) {
    const response = await fetch(`/api/admin/articles/${id}`);
    return response.json();
}

async function createArticle(data: {
    title: string;
    slug: string;
    content: string;
    categoryId: string;
    status?: string;
}) {
    const response = await fetch('/api/admin/articles', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

async function updateArticle(id: string, data: {
    title?: string;
    content?: string;
    status?: string;
}) {
    const response = await fetch(`/api/admin/articles/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

async function deleteArticle(id: string) {
    const response = await fetch(`/api/admin/articles/${id}`, {
        method: 'DELETE',
    });
    return response.json();
}

async function publishArticle(id: string) {
    const response = await fetch(`/api/admin/articles/${id}/publish`, {
        method: 'POST',
    });
    return response.json();
}

async function unpublishArticle(id: string) {
    const response = await fetch(`/api/admin/articles/${id}/unpublish`, {
        method: 'POST',
    });
    return response.json();
}

async function bulkDeleteArticles(ids: string[]) {
    const response = await fetch('/api/admin/articles/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
    return response.json();
}

async function bulkPublishArticles(ids: string[]) {
    const response = await fetch('/api/admin/articles/bulk-publish', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
    return response.json();
}

describe('Articles API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // List Articles Tests
    // ========================================
    describe('GET /api/admin/articles', () => {
        it('should get all articles', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        articles: mockArticles,
                        total: mockArticles.length,
                        page: 1,
                        totalPages: 1,
                    },
                }),
            });

            const data = await getArticles();

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/articles?');
            expect(data.success).toBe(true);
            expect(data.data.articles).toEqual(mockArticles);
        });

        it('should filter by status', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { articles: [mockArticles[0]], total: 1 },
                }),
            });

            await getArticles({ status: 'PUBLISHED' });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/articles?status=PUBLISHED');
        });

        it('should filter by category', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { articles: mockArticles.filter(a => a.categoryId === 'cat-1'), total: 1 },
                }),
            });

            await getArticles({ categoryId: 'cat-1' });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/articles?categoryId=cat-1');
        });

        it('should filter by author', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { articles: mockArticles.filter(a => a.authorId === 'user-1'), total: 2 },
                }),
            });

            await getArticles({ authorId: 'user-1' });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/articles?authorId=user-1');
        });

        it('should search by title', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { articles: [mockArticles[0]], total: 1 },
                }),
            });

            await getArticles({ search: 'forex' });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/articles?search=forex');
        });

        it('should paginate results', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { articles: mockArticles, total: 50, page: 2 },
                }),
            });

            await getArticles({ page: 2, limit: 10 });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/articles?page=2&limit=10');
        });

        it('should combine filters', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { articles: [], total: 0 },
                }),
            });

            await getArticles({
                status: 'DRAFT',
                categoryId: 'cat-1',
                search: 'test',
            });

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/admin/articles?status=DRAFT&categoryId=cat-1&search=test'
            );
        });
    });

    // ========================================
    // Get Single Article Tests
    // ========================================
    describe('GET /api/admin/articles/:id', () => {
        it('should get article by id', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockArticles[0],
                }),
            });

            const data = await getArticleById('article-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/articles/article-1');
            expect(data.success).toBe(true);
            expect(data.data).toEqual(mockArticles[0]);
        });

        it('should handle not found', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Article not found',
                }),
            });

            const data = await getArticleById('invalid');

            expect(data.success).toBe(false);
            expect(data.error).toBe('Article not found');
        });
    });

    // ========================================
    // Create Article Tests
    // ========================================
    describe('POST /api/admin/articles', () => {
        const validData = {
            title: 'Test Article',
            slug: 'test-article',
            content: '<p>Content here</p>',
            categoryId: 'cat-1',
        };

        it('should create article', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { id: 'new-article', ...validData },
                }),
            });

            const data = await createArticle(validData);

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/articles', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validData),
            });
            expect(data.success).toBe(true);
        });

        it('should handle validation errors', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Title is required',
                }),
            });

            const data = await createArticle({ ...validData, title: '' });

            expect(data.success).toBe(false);
            expect(data.error).toBe('Title is required');
        });

        it('should handle duplicate slug', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Slug already exists',
                }),
            });

            const data = await createArticle(validData);

            expect(data.success).toBe(false);
            expect(data.error).toBe('Slug already exists');
        });
    });

    // ========================================
    // Update Article Tests
    // ========================================
    describe('PATCH /api/admin/articles/:id', () => {
        it('should update article', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockArticles[0], title: 'Updated Title' },
                }),
            });

            const data = await updateArticle('article-1', { title: 'Updated Title' });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/articles/article-1', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ title: 'Updated Title' }),
            });
            expect(data.success).toBe(true);
        });

        it('should handle not found', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Article not found',
                }),
            });

            const data = await updateArticle('invalid', { title: 'Test' });

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Delete Article Tests
    // ========================================
    describe('DELETE /api/admin/articles/:id', () => {
        it('should delete article', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Article deleted',
                }),
            });

            const data = await deleteArticle('article-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/articles/article-1', {
                method: 'DELETE',
            });
            expect(data.success).toBe(true);
        });
    });

    // ========================================
    // Publish Article Tests
    // ========================================
    describe('POST /api/admin/articles/:id/publish', () => {
        it('should publish article', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockArticles[1], status: 'PUBLISHED' },
                }),
            });

            const data = await publishArticle('article-2');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/articles/article-2/publish', {
                method: 'POST',
            });
            expect(data.success).toBe(true);
        });

        it('should handle already published', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Article already published',
                }),
            });

            const data = await publishArticle('article-1');

            expect(data.success).toBe(false);
            expect(data.error).toBe('Article already published');
        });
    });

    // ========================================
    // Unpublish Article Tests
    // ========================================
    describe('POST /api/admin/articles/:id/unpublish', () => {
        it('should unpublish article', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockArticles[0], status: 'DRAFT' },
                }),
            });

            const data = await unpublishArticle('article-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/articles/article-1/unpublish', {
                method: 'POST',
            });
            expect(data.success).toBe(true);
        });
    });

    // ========================================
    // Bulk Delete Tests
    // ========================================
    describe('DELETE /api/admin/articles/bulk-delete', () => {
        it('should bulk delete articles', async () => {
            const ids = ['article-1', 'article-2'];
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    deletedCount: 2,
                }),
            });

            const data = await bulkDeleteArticles(ids);

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/articles/bulk-delete', {
                method: 'DELETE',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids }),
            });
            expect(data.deletedCount).toBe(2);
        });
    });

    // ========================================
    // Bulk Publish Tests
    // ========================================
    describe('POST /api/admin/articles/bulk-publish', () => {
        it('should bulk publish articles', async () => {
            const ids = ['article-2', 'article-3'];
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    publishedCount: 2,
                }),
            });

            const data = await bulkPublishArticles(ids);

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/articles/bulk-publish', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids }),
            });
            expect(data.publishedCount).toBe(2);
        });

        it('should handle partial success', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    publishedCount: 1,
                    skippedCount: 1,
                    errors: ['article-1: already published'],
                }),
            });

            const data = await bulkPublishArticles(['article-1', 'article-2']);

            expect(data.publishedCount).toBe(1);
            expect(data.skippedCount).toBe(1);
        });
    });

    // ========================================
    // Error Handling Tests
    // ========================================
    describe('Error Handling', () => {
        it('should handle unauthorized', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Unauthorized',
                }),
            });

            const data = await getArticles();

            expect(data.success).toBe(false);
            expect(data.error).toBe('Unauthorized');
        });

        it('should handle forbidden', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Insufficient permissions',
                }),
            });

            const data = await deleteArticle('article-1');

            expect(data.success).toBe(false);
            expect(data.error).toBe('Insufficient permissions');
        });

        it('should handle server error', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Internal server error',
                }),
            });

            const data = await getArticles();

            expect(data.success).toBe(false);
        });
    });
});
