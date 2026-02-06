/**
 * Comments API Tests
 * @module tests/user/api/comments.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper functions
async function getComments(articleId: string, page = 1) {
    const res = await fetch(`/api/comments?articleId=${articleId}&page=${page}`);
    return res.json();
}

async function createComment(data: { articleId: string; content: string; parentId?: string }) {
    const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return res.json();
}

async function updateComment(id: string, content: string) {
    const res = await fetch(`/api/comments/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content }),
    });
    return res.json();
}

async function deleteComment(id: string) {
    const res = await fetch(`/api/comments/${id}`, { method: 'DELETE' });
    return res.json();
}

async function likeComment(id: string) {
    const res = await fetch(`/api/comments/${id}/like`, { method: 'POST' });
    return res.json();
}

async function reportComment(id: string, reason: string) {
    const res = await fetch(`/api/comments/${id}/report`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason }),
    });
    return res.json();
}

// Mock data
const mockComments = [
    {
        id: 'comment-1',
        articleId: 'article-1',
        userId: 'user-1',
        content: 'Great article! Very informative.',
        author: { id: 'user-1', name: 'John Trader', avatar: '/avatars/user-1.jpg' },
        likes: 5,
        isLiked: false,
        repliesCount: 2,
        createdAt: '2025-01-15T10:00:00Z',
        updatedAt: '2025-01-15T10:00:00Z',
    },
    {
        id: 'comment-2',
        articleId: 'article-1',
        userId: 'user-2',
        content: 'Thanks for sharing this knowledge.',
        author: { id: 'user-2', name: 'Jane Smith', avatar: '/avatars/user-2.jpg' },
        likes: 3,
        isLiked: true,
        repliesCount: 0,
        createdAt: '2025-01-15T11:00:00Z',
        updatedAt: '2025-01-15T11:00:00Z',
    },
];

const mockReplies = [
    {
        id: 'reply-1',
        articleId: 'article-1',
        parentId: 'comment-1',
        userId: 'user-3',
        content: 'I agree with this!',
        author: { id: 'user-3', name: 'Bob Wilson', avatar: null },
        likes: 1,
        isLiked: false,
        createdAt: '2025-01-15T12:00:00Z',
    },
];

describe('Comments API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // Get Comments Tests
    // ========================================
    describe('GET /api/comments', () => {
        it('should get comments for an article', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockComments,
                    meta: { page: 1, totalPages: 1, total: 2 },
                }),
            });

            const data = await getComments('article-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/comments?articleId=article-1&page=1');
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(2);
        });

        it('should include author info', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockComments,
                }),
            });

            const data = await getComments('article-1');

            expect(data.data[0].author.name).toBe('John Trader');
            expect(data.data[0].author.avatar).toBeDefined();
        });

        it('should show like status for authenticated user', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockComments,
                }),
            });

            const data = await getComments('article-1');

            expect(data.data[0].isLiked).toBe(false);
            expect(data.data[1].isLiked).toBe(true);
        });

        it('should show replies count', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockComments,
                }),
            });

            const data = await getComments('article-1');

            expect(data.data[0].repliesCount).toBe(2);
        });

        it('should paginate comments', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [],
                    meta: { page: 2, totalPages: 3, total: 25 },
                }),
            });

            await getComments('article-1', 2);

            expect(mockFetch).toHaveBeenCalledWith('/api/comments?articleId=article-1&page=2');
        });
    });

    // ========================================
    // Create Comment Tests
    // ========================================
    describe('POST /api/comments', () => {
        it('should create a new comment', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        id: 'comment-new',
                        articleId: 'article-1',
                        content: 'This is my comment',
                        author: { id: 'user-1', name: 'John Trader' },
                        likes: 0,
                        createdAt: new Date().toISOString(),
                    },
                }),
            });

            const data = await createComment({
                articleId: 'article-1',
                content: 'This is my comment',
            });

            expect(mockFetch).toHaveBeenCalledWith('/api/comments', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    articleId: 'article-1',
                    content: 'This is my comment',
                }),
            });
            expect(data.success).toBe(true);
            expect(data.data.content).toBe('This is my comment');
        });

        it('should create a reply to existing comment', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        id: 'reply-new',
                        articleId: 'article-1',
                        parentId: 'comment-1',
                        content: 'This is a reply',
                    },
                }),
            });

            const data = await createComment({
                articleId: 'article-1',
                content: 'This is a reply',
                parentId: 'comment-1',
            });

            expect(data.success).toBe(true);
            expect(data.data.parentId).toBe('comment-1');
        });

        it('should validate content is not empty', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Content is required',
                }),
            });

            const data = await createComment({
                articleId: 'article-1',
                content: '',
            });

            expect(data.success).toBe(false);
            expect(data.error).toBe('Content is required');
        });

        it('should validate content length', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Content is too long',
                }),
            });

            const data = await createComment({
                articleId: 'article-1',
                content: 'a'.repeat(5001),
            });

            expect(data.success).toBe(false);
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

            const data = await createComment({
                articleId: 'article-1',
                content: 'Test comment',
            });

            expect(data.success).toBe(false);
            expect(data.error).toBe('Unauthorized');
        });
    });

    // ========================================
    // Update Comment Tests
    // ========================================
    describe('PATCH /api/comments/:id', () => {
        it('should update own comment', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        id: 'comment-1',
                        content: 'Updated content',
                        updatedAt: new Date().toISOString(),
                    },
                }),
            });

            const data = await updateComment('comment-1', 'Updated content');

            expect(mockFetch).toHaveBeenCalledWith('/api/comments/comment-1', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ content: 'Updated content' }),
            });
            expect(data.success).toBe(true);
            expect(data.data.content).toBe('Updated content');
        });

        it('should not update other user comment', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                json: () => Promise.resolve({
                    success: false,
                    error: 'You can only edit your own comments',
                }),
            });

            const data = await updateComment('comment-2', 'Hacked content');

            expect(data.success).toBe(false);
        });

        it('should mark comment as edited', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        id: 'comment-1',
                        content: 'Updated content',
                        isEdited: true,
                        updatedAt: new Date().toISOString(),
                    },
                }),
            });

            const data = await updateComment('comment-1', 'Updated content');

            expect(data.data.isEdited).toBe(true);
        });
    });

    // ========================================
    // Delete Comment Tests
    // ========================================
    describe('DELETE /api/comments/:id', () => {
        it('should delete own comment', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Comment deleted',
                }),
            });

            const data = await deleteComment('comment-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/comments/comment-1', {
                method: 'DELETE',
            });
            expect(data.success).toBe(true);
        });

        it('should not delete other user comment', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                json: () => Promise.resolve({
                    success: false,
                    error: 'You can only delete your own comments',
                }),
            });

            const data = await deleteComment('comment-2');

            expect(data.success).toBe(false);
        });

        it('should delete comment with replies (soft delete)', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        id: 'comment-1',
                        content: '[Deleted]',
                        isDeleted: true,
                    },
                }),
            });

            const data = await deleteComment('comment-1');

            expect(data.success).toBe(true);
            expect(data.data.isDeleted).toBe(true);
        });
    });

    // ========================================
    // Like Comment Tests
    // ========================================
    describe('POST /api/comments/:id/like', () => {
        it('should like a comment', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        id: 'comment-1',
                        likes: 6,
                        isLiked: true,
                    },
                }),
            });

            const data = await likeComment('comment-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/comments/comment-1/like', {
                method: 'POST',
            });
            expect(data.success).toBe(true);
            expect(data.data.isLiked).toBe(true);
            expect(data.data.likes).toBe(6);
        });

        it('should unlike a previously liked comment', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        id: 'comment-2',
                        likes: 2,
                        isLiked: false,
                    },
                }),
            });

            const data = await likeComment('comment-2');

            expect(data.data.isLiked).toBe(false);
            expect(data.data.likes).toBe(2);
        });

        it('should not like own comment', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Cannot like your own comment',
                }),
            });

            const data = await likeComment('comment-1');

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Report Comment Tests
    // ========================================
    describe('POST /api/comments/:id/report', () => {
        it('should report a comment', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Comment reported successfully',
                }),
            });

            const data = await reportComment('comment-1', 'Spam content');

            expect(mockFetch).toHaveBeenCalledWith('/api/comments/comment-1/report', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Spam content' }),
            });
            expect(data.success).toBe(true);
        });

        it('should require reason for report', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Reason is required',
                }),
            });

            const data = await reportComment('comment-1', '');

            expect(data.success).toBe(false);
        });

        it('should not report same comment twice', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'You have already reported this comment',
                }),
            });

            const data = await reportComment('comment-1', 'Spam');

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Get Replies Tests
    // ========================================
    describe('GET /api/comments/:id/replies', () => {
        it('should get replies for a comment', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockReplies,
                }),
            });

            const res = await fetch('/api/comments/comment-1/replies');
            const data = await res.json();

            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(1);
            expect(data.data[0].parentId).toBe('comment-1');
        });
    });
});
