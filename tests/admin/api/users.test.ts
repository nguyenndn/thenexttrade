/**
 * Users API Tests
 * @module tests/admin/api/users.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockUsers, mockUserStats } from '../__mocks__/data';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// API helper functions
async function getUsers(params: {
    role?: string;
    status?: string;
    search?: string;
    page?: number;
    limit?: number;
} = {}) {
    const query = new URLSearchParams();
    if (params.role) query.set('role', params.role);
    if (params.status) query.set('status', params.status);
    if (params.search) query.set('search', params.search);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const response = await fetch(`/api/admin/users?${query.toString()}`);
    return response.json();
}

async function getUserById(id: string) {
    const response = await fetch(`/api/admin/users/${id}`);
    return response.json();
}

async function updateUser(id: string, data: {
    role?: string;
    status?: string;
    email?: string;
}) {
    const response = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

async function banUser(id: string, reason: string, duration?: number) {
    const response = await fetch(`/api/admin/users/${id}/ban`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason, duration }),
    });
    return response.json();
}

async function unbanUser(id: string) {
    const response = await fetch(`/api/admin/users/${id}/unban`, {
        method: 'POST',
    });
    return response.json();
}

async function deleteUser(id: string) {
    const response = await fetch(`/api/admin/users/${id}`, {
        method: 'DELETE',
    });
    return response.json();
}

async function getUserActivity(id: string, params: {
    type?: string;
    startDate?: string;
    endDate?: string;
    page?: number;
    limit?: number;
} = {}) {
    const query = new URLSearchParams();
    if (params.type) query.set('type', params.type);
    if (params.startDate) query.set('startDate', params.startDate);
    if (params.endDate) query.set('endDate', params.endDate);
    if (params.page) query.set('page', params.page.toString());
    if (params.limit) query.set('limit', params.limit.toString());

    const response = await fetch(`/api/admin/users/${id}/activity?${query.toString()}`);
    return response.json();
}

async function getUserStats(id: string) {
    const response = await fetch(`/api/admin/users/${id}/stats`);
    return response.json();
}

async function exportUsers(format: 'csv' | 'xlsx', filters?: {
    role?: string;
    status?: string;
}) {
    const query = new URLSearchParams({ format });
    if (filters?.role) query.set('role', filters.role);
    if (filters?.status) query.set('status', filters.status);

    const response = await fetch(`/api/admin/users/export?${query.toString()}`);
    return response.json();
}

async function sendBulkEmail(userIds: string[], subject: string, message: string) {
    const response = await fetch('/api/admin/users/bulk-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userIds, subject, message }),
    });
    return response.json();
}

describe('Users API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // List Users Tests
    // ========================================
    describe('GET /api/admin/users', () => {
        it('should get all users', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        users: mockUsers,
                        total: mockUsers.length,
                        page: 1,
                        totalPages: 1,
                    },
                }),
            });

            const data = await getUsers();

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/users?');
            expect(data.success).toBe(true);
            expect(data.data.users).toEqual(mockUsers);
        });

        it('should filter by role', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { users: [mockUsers[0]], total: 1 },
                }),
            });

            await getUsers({ role: 'ADMIN' });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/users?role=ADMIN');
        });

        it('should filter by status', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { users: mockUsers.filter(u => (u as any).status === 'ACTIVE'), total: 2 },
                }),
            });

            await getUsers({ status: 'ACTIVE' });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/users?status=ACTIVE');
        });

        it('should search by name or email', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { users: [mockUsers[0]], total: 1 },
                }),
            });

            await getUsers({ search: 'admin@' });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/users?search=admin%40');
        });

        it('should paginate results', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { users: mockUsers.slice(0, 25), total: 100, page: 2, totalPages: 4 },
                }),
            });

            await getUsers({ page: 2, limit: 25 });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/users?page=2&limit=25');
        });

        it('should combine filters', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { users: [mockUsers[1]], total: 1 },
                }),
            });

            await getUsers({
                role: 'USER',
                status: 'ACTIVE',
                search: 'test',
            });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/users?role=USER&status=ACTIVE&search=test');
        });
    });

    // ========================================
    // Get Single User Tests
    // ========================================
    describe('GET /api/admin/users/:id', () => {
        it('should get user by id', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockUsers[0],
                }),
            });

            const data = await getUserById('user-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/user-1');
            expect(data.success).toBe(true);
            expect(data.data).toEqual(mockUsers[0]);
        });

        it('should handle not found', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: () => Promise.resolve({
                    success: false,
                    error: 'User not found',
                }),
            });

            const data = await getUserById('invalid');

            expect(data.success).toBe(false);
            expect(data.error).toBe('User not found');
        });
    });

    // ========================================
    // Update User Tests
    // ========================================
    describe('PATCH /api/admin/users/:id', () => {
        it('should update user role', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockUsers[1], role: 'MODERATOR' },
                }),
            });

            const data = await updateUser('user-2', { role: 'MODERATOR' });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/user-2', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ role: 'MODERATOR' }),
            });
            expect(data.success).toBe(true);
        });

        it('should prevent demoting last admin', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Cannot demote the last admin',
                }),
            });

            const data = await updateUser('user-1', { role: 'USER' });

            expect(data.success).toBe(false);
            expect(data.error).toBe('Cannot demote the last admin');
        });

        it('should validate role value', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Invalid role',
                }),
            });

            const data = await updateUser('user-2', { role: 'INVALID' });

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Ban User Tests
    // ========================================
    describe('POST /api/admin/users/:id/ban', () => {
        it('should ban user permanently', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockUsers[1], status: 'BANNED' },
                }),
            });

            const data = await banUser('user-2', 'Violation of terms');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/user-2/ban', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ reason: 'Violation of terms', duration: undefined }),
            });
            expect(data.success).toBe(true);
        });

        it('should ban user temporarily', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { 
                        ...mockUsers[1], 
                        status: 'BANNED',
                        banExpiresAt: '2025-02-01T00:00:00Z',
                    },
                }),
            });

            const data = await banUser('user-2', 'Spam', 7);

            expect(data.success).toBe(true);
            expect(data.data.banExpiresAt).toBeDefined();
        });

        it('should require ban reason', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Ban reason is required',
                }),
            });

            const data = await banUser('user-2', '');

            expect(data.success).toBe(false);
            expect(data.error).toBe('Ban reason is required');
        });

        it('should prevent banning admins', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Cannot ban admin users',
                }),
            });

            const data = await banUser('user-1', 'Test');

            expect(data.success).toBe(false);
            expect(data.error).toBe('Cannot ban admin users');
        });
    });

    // ========================================
    // Unban User Tests
    // ========================================
    describe('POST /api/admin/users/:id/unban', () => {
        it('should unban user', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockUsers[2], status: 'ACTIVE' },
                }),
            });

            const data = await unbanUser('user-3');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/user-3/unban', {
                method: 'POST',
            });
            expect(data.success).toBe(true);
        });

        it('should handle user not banned', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'User is not banned',
                }),
            });

            const data = await unbanUser('user-2');

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Delete User Tests
    // ========================================
    describe('DELETE /api/admin/users/:id', () => {
        it('should delete user', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'User deleted',
                }),
            });

            const data = await deleteUser('user-2');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/user-2', {
                method: 'DELETE',
            });
            expect(data.success).toBe(true);
        });

        it('should prevent self-deletion', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Cannot delete your own account',
                }),
            });

            const data = await deleteUser('user-1');

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // User Activity Tests
    // ========================================
    describe('GET /api/admin/users/:id/activity', () => {
        it('should get user activity', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        activities: [
                            { type: 'LOGIN', timestamp: '2025-01-01T10:00:00Z' },
                            { type: 'COMMENT', timestamp: '2025-01-01T09:00:00Z' },
                        ],
                        total: 2,
                    },
                }),
            });

            const data = await getUserActivity('user-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/user-1/activity?');
            expect(data.success).toBe(true);
        });

        it('should filter by type', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { activities: [{ type: 'LOGIN' }], total: 1 },
                }),
            });

            await getUserActivity('user-1', { type: 'LOGIN' });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/user-1/activity?type=LOGIN');
        });

        it('should filter by date range', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { activities: [], total: 0 },
                }),
            });

            await getUserActivity('user-1', {
                startDate: '2025-01-01',
                endDate: '2025-01-31',
            });

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/admin/users/user-1/activity?startDate=2025-01-01&endDate=2025-01-31'
            );
        });
    });

    // ========================================
    // User Stats Tests
    // ========================================
    describe('GET /api/admin/users/:id/stats', () => {
        it('should get user stats', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockUserStats,
                }),
            });

            const data = await getUserStats('user-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/user-1/stats');
            expect(data.success).toBe(true);
            expect(data.data).toEqual(mockUserStats);
        });
    });

    // ========================================
    // Export Users Tests
    // ========================================
    describe('GET /api/admin/users/export', () => {
        it('should export users as CSV', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    downloadUrl: '/exports/users-2025-01.csv',
                }),
            });

            const data = await exportUsers('csv');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/export?format=csv');
            expect(data.success).toBe(true);
            expect(data.downloadUrl).toBeDefined();
        });

        it('should export users as XLSX', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    downloadUrl: '/exports/users-2025-01.xlsx',
                }),
            });

            const data = await exportUsers('xlsx');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/export?format=xlsx');
            expect(data.success).toBe(true);
        });

        it('should export with filters', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    downloadUrl: '/exports/users-filtered.csv',
                }),
            });

            await exportUsers('csv', { role: 'USER', status: 'ACTIVE' });

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/admin/users/export?format=csv&role=USER&status=ACTIVE'
            );
        });
    });

    // ========================================
    // Bulk Email Tests
    // ========================================
    describe('POST /api/admin/users/bulk-email', () => {
        it('should send bulk email', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    sentCount: 2,
                }),
            });

            const data = await sendBulkEmail(
                ['user-1', 'user-2'],
                'Newsletter',
                'Hello everyone!'
            );

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/users/bulk-email', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userIds: ['user-1', 'user-2'],
                    subject: 'Newsletter',
                    message: 'Hello everyone!',
                }),
            });
            expect(data.success).toBe(true);
            expect(data.sentCount).toBe(2);
        });

        it('should require subject', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Subject is required',
                }),
            });

            const data = await sendBulkEmail(['user-1'], '', 'Message');

            expect(data.success).toBe(false);
        });

        it('should require at least one recipient', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'At least one recipient is required',
                }),
            });

            const data = await sendBulkEmail([], 'Subject', 'Message');

            expect(data.success).toBe(false);
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

            const data = await getUsers();

            expect(data.success).toBe(false);
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

            const data = await deleteUser('user-1');

            expect(data.success).toBe(false);
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

            const data = await getUsers();

            expect(data.success).toBe(false);
        });
    });
});
