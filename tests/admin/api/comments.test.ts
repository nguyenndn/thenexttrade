/**
 * Comments API Tests
 * @module tests/admin/api/comments.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockComments, mockUsers } from '../__mocks__/data';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock window.confirm
vi.stubGlobal('confirm', vi.fn());

// Comment API helper
async function fetchComments(params: {
    page?: number;
    limit?: number;
    search?: string;
    status?: string;
}) {
    const query = new URLSearchParams();
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());
    if (params.search) query.set('search', params.search);
    if (params.status) query.set('status', params.status);

    return fetch(`/api/admin/comments?${query.toString()}`);
}

async function approveComment(id: string) {
    return fetch(`/api/admin/comments/${id}/approve`, {
        method: 'POST',
    });
}

async function rejectComment(id: string) {
    return fetch(`/api/admin/comments/${id}/reject`, {
        method: 'POST',
    });
}

async function deleteComment(id: string) {
    return fetch(`/api/admin/comments/${id}`, {
        method: 'DELETE',
    });
}

async function bulkApprove(ids: string[]) {
    return fetch('/api/admin/comments/bulk-approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
}

async function bulkReject(ids: string[]) {
    return fetch('/api/admin/comments/bulk-reject', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
}

async function bulkDelete(ids: string[]) {
    return fetch('/api/admin/comments/bulk-delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids }),
    });
}

describe('Comments API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockFetch.mockResolvedValue({
            ok: true,
            status: 200,
            json: () => Promise.resolve({ success: true }),
        });
    });

    // ========================================
    // List Comments Tests
    // ========================================
    describe('GET /api/admin/comments', () => {
        it('should fetch comments with default params', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        comments: mockComments,
                        total: 50,
                        page: 1,
                        totalPages: 5,
                    },
                }),
            });

            const response = await fetchComments({});
            const data = await response.json();

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/comments?');
            expect(data.success).toBe(true);
            expect(data.data.comments).toEqual(mockComments);
        });

        it('should fetch with pagination', async () => {
            await fetchComments({ page: 2, limit: 20 });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/comments?page=2&limit=20');
        });

        it('should fetch with search filter', async () => {
            await fetchComments({ search: 'great article' });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/comments?search=great+article');
        });

        it('should fetch with status filter - pending', async () => {
            await fetchComments({ status: 'PENDING' });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/comments?status=PENDING');
        });

        it('should fetch with status filter - approved', async () => {
            await fetchComments({ status: 'APPROVED' });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/comments?status=APPROVED');
        });

        it('should combine multiple filters', async () => {
            await fetchComments({
                page: 1,
                limit: 10,
                search: 'test',
                status: 'PENDING',
            });

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/admin/comments?page=1&limit=10&search=test&status=PENDING'
            );
        });

        it('should handle empty response', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        comments: [],
                        total: 0,
                        page: 1,
                        totalPages: 0,
                    },
                }),
            });

            const response = await fetchComments({});
            const data = await response.json();

            expect(data.data.comments).toEqual([]);
            expect(data.data.total).toBe(0);
        });
    });

    // ========================================
    // Approve Comment Tests
    // ========================================
    describe('POST /api/admin/comments/:id/approve', () => {
        it('should approve a comment', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockComments[0], status: 'APPROVED' },
                }),
            });

            const response = await approveComment('comment-1');
            const data = await response.json();

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/admin/comments/comment-1/approve',
                { method: 'POST' }
            );
            expect(data.success).toBe(true);
        });

        it('should handle not found error', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Comment not found',
                }),
            });

            const response = await approveComment('invalid-id');
            const data = await response.json();

            expect(response.ok).toBe(false);
            expect(data.success).toBe(false);
        });

        it('should handle already approved', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Comment already approved',
                }),
            });

            const response = await approveComment('already-approved');
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('Comment already approved');
        });
    });

    // ========================================
    // Reject Comment Tests
    // ========================================
    describe('POST /api/admin/comments/:id/reject', () => {
        it('should reject a comment', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockComments[0], status: 'REJECTED' },
                }),
            });

            const response = await rejectComment('comment-1');
            const data = await response.json();

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/admin/comments/comment-1/reject',
                { method: 'POST' }
            );
            expect(data.success).toBe(true);
        });

        it('should handle unauthorized', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Unauthorized',
                }),
            });

            const response = await rejectComment('comment-1');

            expect(response.status).toBe(401);
        });
    });

    // ========================================
    // Delete Comment Tests
    // ========================================
    describe('DELETE /api/admin/comments/:id', () => {
        it('should delete a comment', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Comment deleted successfully',
                }),
            });

            const response = await deleteComment('comment-1');
            const data = await response.json();

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/admin/comments/comment-1',
                { method: 'DELETE' }
            );
            expect(data.success).toBe(true);
        });

        it('should handle deletion of comment with replies', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Comment and 3 replies deleted',
                    deletedCount: 4,
                }),
            });

            const response = await deleteComment('comment-with-replies');
            const data = await response.json();

            expect(data.deletedCount).toBe(4);
        });
    });

    // ========================================
    // Bulk Approve Tests
    // ========================================
    describe('POST /api/admin/comments/bulk-approve', () => {
        it('should approve multiple comments', async () => {
            const ids = ['comment-1', 'comment-2', 'comment-3'];
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    approvedCount: 3,
                }),
            });

            const response = await bulkApprove(ids);
            const data = await response.json();

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/admin/comments/bulk-approve',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids }),
                }
            );
            expect(data.approvedCount).toBe(3);
        });

        it('should handle partial success', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    approvedCount: 2,
                    failedCount: 1,
                    errors: ['comment-3: already approved'],
                }),
            });

            const response = await bulkApprove(['comment-1', 'comment-2', 'comment-3']);
            const data = await response.json();

            expect(data.approvedCount).toBe(2);
            expect(data.failedCount).toBe(1);
        });

        it('should validate non-empty array', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'At least one comment ID is required',
                }),
            });

            const response = await bulkApprove([]);
            const data = await response.json();

            expect(response.status).toBe(400);
            expect(data.error).toBe('At least one comment ID is required');
        });
    });

    // ========================================
    // Bulk Reject Tests
    // ========================================
    describe('POST /api/admin/comments/bulk-reject', () => {
        it('should reject multiple comments', async () => {
            const ids = ['comment-1', 'comment-2'];
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    rejectedCount: 2,
                }),
            });

            const response = await bulkReject(ids);
            const data = await response.json();

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/admin/comments/bulk-reject',
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids }),
                }
            );
            expect(data.rejectedCount).toBe(2);
        });
    });

    // ========================================
    // Bulk Delete Tests
    // ========================================
    describe('DELETE /api/admin/comments/bulk-delete', () => {
        it('should delete multiple comments', async () => {
            const ids = ['comment-1', 'comment-2'];
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    deletedCount: 2,
                }),
            });

            const response = await bulkDelete(ids);
            const data = await response.json();

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/admin/comments/bulk-delete',
                {
                    method: 'DELETE',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ ids }),
                }
            );
            expect(data.deletedCount).toBe(2);
        });

        it('should handle large batch', async () => {
            const ids = Array.from({ length: 100 }, (_, i) => `comment-${i}`);
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    deletedCount: 100,
                }),
            });

            const response = await bulkDelete(ids);
            const data = await response.json();

            expect(data.deletedCount).toBe(100);
        });
    });

    // ========================================
    // Error Handling Tests
    // ========================================
    describe('Error Handling', () => {
        it('should handle network errors', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(fetchComments({})).rejects.toThrow('Network error');
        });

        it('should handle 500 server error', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Internal server error',
                }),
            });

            const response = await fetchComments({});

            expect(response.status).toBe(500);
        });

        it('should handle unauthorized access', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Unauthorized',
                }),
            });

            const response = await approveComment('comment-1');
            const data = await response.json();

            expect(data.error).toBe('Unauthorized');
        });

        it('should handle forbidden access', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Insufficient permissions',
                }),
            });

            const response = await deleteComment('comment-1');
            const data = await response.json();

            expect(response.status).toBe(403);
            expect(data.error).toBe('Insufficient permissions');
        });
    });
});
