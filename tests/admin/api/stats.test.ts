/**
 * Admin Dashboard API Tests
 * @module tests/admin/api/stats.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDashboardStats, mockUserStats } from '../__mocks__/data';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// API helper functions
async function getDashboardStats() {
    const response = await fetch('/api/admin/stats');
    return response.json();
}

async function getUserStats() {
    const response = await fetch('/api/admin/stats/users');
    return response.json();
}

async function getContentStats() {
    const response = await fetch('/api/admin/stats/content');
    return response.json();
}

async function getRecentActivity(limit = 10) {
    const response = await fetch(`/api/admin/stats/activity?limit=${limit}`);
    return response.json();
}

async function getSystemHealth() {
    const response = await fetch('/api/admin/stats/health');
    return response.json();
}

describe('Dashboard Stats API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // Get Dashboard Stats Tests
    // ========================================
    describe('GET /api/admin/stats', () => {
        it('should return dashboard stats', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockDashboardStats,
                }),
            });

            const data = await getDashboardStats();

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/stats');
            expect(data.success).toBe(true);
            expect(data.data).toEqual(mockDashboardStats);
        });

        it('should include all required fields', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockDashboardStats,
                }),
            });

            const data = await getDashboardStats();

            expect(data.data).toHaveProperty('totalUsers');
            expect(data.data).toHaveProperty('totalArticles');
            expect(data.data).toHaveProperty('pendingArticles');
            expect(data.data).toHaveProperty('pendingLicenses');
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

            const data = await getDashboardStats();

            expect(data.success).toBe(false);
            expect(data.error).toBe('Internal server error');
        });
    });

    // ========================================
    // Get User Stats Tests
    // ========================================
    describe('GET /api/admin/stats/users', () => {
        it('should return user statistics', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockUserStats,
                }),
            });

            const data = await getUserStats();

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/stats/users');
            expect(data.success).toBe(true);
            expect(data.data.totalUsers).toBe(1500);
            expect(data.data.newUsersThisMonth).toBe(120);
        });

        it('should include role distribution', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockUserStats,
                }),
            });

            const data = await getUserStats();

            expect(data.data.roleDistribution).toBeDefined();
            expect(data.data.roleDistribution.ADMIN).toBe(5);
            expect(data.data.roleDistribution.EDITOR).toBe(15);
            expect(data.data.roleDistribution.USER).toBe(1480);
        });
    });

    // ========================================
    // Get Content Stats Tests
    // ========================================
    describe('GET /api/admin/stats/content', () => {
        it('should return content statistics', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        totalArticles: 120,
                        publishedArticles: 95,
                        draftArticles: 20,
                        pendingArticles: 5,
                        totalCategories: 12,
                        totalTags: 45,
                    },
                }),
            });

            const data = await getContentStats();

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/stats/content');
            expect(data.success).toBe(true);
            expect(data.data.totalArticles).toBe(120);
        });

        it('should include article breakdown by status', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        totalArticles: 120,
                        publishedArticles: 95,
                        draftArticles: 20,
                        pendingArticles: 5,
                    },
                }),
            });

            const data = await getContentStats();

            expect(data.data.publishedArticles).toBeDefined();
            expect(data.data.draftArticles).toBeDefined();
            expect(data.data.pendingArticles).toBeDefined();
        });
    });

    // ========================================
    // Get Recent Activity Tests
    // ========================================
    describe('GET /api/admin/stats/activity', () => {
        const mockActivity = [
            {
                id: 'act-1',
                type: 'ARTICLE_CREATED',
                user: { name: 'John Doe' },
                details: { title: 'New Article' },
                createdAt: new Date().toISOString(),
            },
            {
                id: 'act-2',
                type: 'USER_REGISTERED',
                user: { name: 'Jane Smith' },
                details: {},
                createdAt: new Date().toISOString(),
            },
        ];

        it('should return recent activity', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockActivity,
                }),
            });

            const data = await getRecentActivity();

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/stats/activity?limit=10');
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(2);
        });

        it('should respect limit parameter', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockActivity.slice(0, 1),
                }),
            });

            await getRecentActivity(1);

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/stats/activity?limit=1');
        });

        it('should include activity type and user info', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockActivity,
                }),
            });

            const data = await getRecentActivity();

            expect(data.data[0]).toHaveProperty('type');
            expect(data.data[0]).toHaveProperty('user');
            expect(data.data[0]).toHaveProperty('createdAt');
        });
    });

    // ========================================
    // Get System Health Tests
    // ========================================
    describe('GET /api/admin/stats/health', () => {
        const mockHealth = {
            database: { status: 'healthy', latency: 5 },
            cache: { status: 'healthy', hitRate: 0.95 },
            storage: { status: 'healthy', usedSpace: '45%' },
            queue: { status: 'healthy', pendingJobs: 12 },
        };

        it('should return system health status', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockHealth,
                }),
            });

            const data = await getSystemHealth();

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/stats/health');
            expect(data.success).toBe(true);
        });

        it('should include all service statuses', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockHealth,
                }),
            });

            const data = await getSystemHealth();

            expect(data.data.database).toBeDefined();
            expect(data.data.cache).toBeDefined();
            expect(data.data.storage).toBeDefined();
        });

        it('should indicate unhealthy services', async () => {
            const unhealthyData = {
                ...mockHealth,
                database: { status: 'unhealthy', error: 'Connection timeout' },
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: unhealthyData,
                }),
            });

            const data = await getSystemHealth();

            expect(data.data.database.status).toBe('unhealthy');
            expect(data.data.database.error).toBe('Connection timeout');
        });
    });

    // ========================================
    // Error Handling Tests
    // ========================================
    describe('Error Handling', () => {
        it('should handle network errors', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            await expect(getDashboardStats()).rejects.toThrow('Network error');
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

            const data = await getDashboardStats();

            expect(data.success).toBe(false);
            expect(data.error).toBe('Unauthorized');
        });

        it('should handle forbidden access', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Admin access required',
                }),
            });

            const data = await getDashboardStats();

            expect(data.success).toBe(false);
            expect(data.error).toBe('Admin access required');
        });
    });
});
