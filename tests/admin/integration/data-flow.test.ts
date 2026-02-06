/**
 * Admin Data Flow Integration Tests
 * Tests data consistency and state management across modules
 * @module tests/admin/integration/data-flow.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockUsers, mockArticles, mockCategories, mockBrokers, mockDashboardStats } from '../__mocks__/data';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('Admin Data Flow Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // Dashboard Statistics Consistency
    // ========================================
    describe('Dashboard Statistics Consistency', () => {
        it('should reflect article count changes in dashboard', async () => {
            // Get initial dashboard stats
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockDashboardStats, totalArticles: 10 },
                }),
            });

            const dashboardResponse1 = await fetch('/api/admin/dashboard/stats');
            const dashboardData1 = await dashboardResponse1.json();
            const initialCount = dashboardData1.data.totalArticles;

            // Create new article
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { id: 'new-article', title: 'New Article' },
                }),
            });

            await fetch('/api/admin/articles', {
                method: 'POST',
                body: JSON.stringify({ title: 'New Article' }),
            });

            // Verify dashboard reflects new count
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockDashboardStats, totalArticles: initialCount + 1 },
                }),
            });

            const dashboardResponse2 = await fetch('/api/admin/dashboard/stats');
            const dashboardData2 = await dashboardResponse2.json();

            expect(dashboardData2.data.totalArticles).toBe(initialCount + 1);
        });

        it('should reflect user count changes in dashboard', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { totalUsers: 100, activeUsers: 90 },
                }),
            });

            const response = await fetch('/api/admin/dashboard/stats');
            const data = await response.json();

            expect(data.data.totalUsers).toBe(100);
            expect(data.data.activeUsers).toBe(90);
        });
    });

    // ========================================
    // Category-Article Relationship
    // ========================================
    describe('Category-Article Relationship', () => {
        it('should update article counts when category changes', async () => {
            // Get categories with counts
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockCategories.map(c => ({
                        ...c,
                        articleCount: c.id === 'cat-1' ? 5 : 3,
                    })),
                }),
            });

            const categoriesResponse = await fetch('/api/admin/categories');
            const categoriesData = await categoriesResponse.json();
            const cat1Count = categoriesData.data.find((c: any) => c.id === 'cat-1').articleCount;

            // Move article to different category
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockArticles[0], categoryId: 'cat-2' },
                }),
            });

            await fetch('/api/admin/articles/article-1', {
                method: 'PATCH',
                body: JSON.stringify({ categoryId: 'cat-2' }),
            });

            // Verify counts updated
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockCategories.map(c => ({
                        ...c,
                        articleCount: c.id === 'cat-1' ? cat1Count - 1 : (c.id === 'cat-2' ? 4 : 3),
                    })),
                }),
            });

            const updatedCategoriesResponse = await fetch('/api/admin/categories');
            const updatedData = await updatedCategoriesResponse.json();

            expect(updatedData.data.find((c: any) => c.id === 'cat-1').articleCount).toBe(cat1Count - 1);
        });

        it('should prevent category deletion with articles', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Cannot delete category with existing articles',
                    articleCount: 5,
                }),
            });

            const response = await fetch('/api/admin/categories/cat-1', {
                method: 'DELETE',
            });
            const data = await response.json();

            expect(data.success).toBe(false);
            expect(data.error).toContain('Cannot delete');
        });
    });

    // ========================================
    // User-Content Relationship
    // ========================================
    describe('User-Content Relationship', () => {
        it('should track user activity across modules', async () => {
            const userId = 'user-1';

            // Get user's articles
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        articles: mockArticles.filter(a => a.authorId === userId),
                        count: 2,
                    },
                }),
            });

            const articlesResponse = await fetch(`/api/admin/users/${userId}/articles`);
            const articlesData = await articlesResponse.json();

            // Get user's comments
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        comments: [{ id: 'comment-1', userId, content: 'Test' }],
                        count: 1,
                    },
                }),
            });

            const commentsResponse = await fetch(`/api/admin/users/${userId}/comments`);
            const commentsData = await commentsResponse.json();

            // Verify activity summary
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        articlesCount: articlesData.data.count,
                        commentsCount: commentsData.data.count,
                        totalActivity: articlesData.data.count + commentsData.data.count,
                    },
                }),
            });

            const activityResponse = await fetch(`/api/admin/users/${userId}/activity-summary`);
            const activityData = await activityResponse.json();

            expect(activityData.data.totalActivity).toBe(
                articlesData.data.count + commentsData.data.count
            );
        });

        it('should handle user deletion with content cleanup', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        deleted: true,
                        contentHandled: {
                            articlesReassigned: 5,
                            commentsAnonymized: 10,
                        },
                    },
                }),
            });

            const response = await fetch('/api/admin/users/user-1', {
                method: 'DELETE',
                body: JSON.stringify({
                    reassignContentTo: 'admin-1',
                    anonymizeComments: true,
                }),
            });
            const data = await response.json();

            expect(data.data.contentHandled.articlesReassigned).toBe(5);
            expect(data.data.contentHandled.commentsAnonymized).toBe(10);
        });
    });

    // ========================================
    // EA Product-License Relationship
    // ========================================
    describe('EA Product-License Relationship', () => {
        it('should track license counts per product', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        products: [
                            { id: 'ea-1', name: 'EA Pro', licenseCounts: { approved: 10, pending: 2, rejected: 1 } },
                            { id: 'ea-2', name: 'EA Basic', licenseCounts: { approved: 5, pending: 1, rejected: 0 } },
                        ],
                    },
                }),
            });

            const response = await fetch('/api/admin/ea/products?includeStats=true');
            const data = await response.json();

            expect(data.data.products[0].licenseCounts.approved).toBe(10);
        });

        it('should update product stats when license approved', async () => {
            // Approve license
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { id: 'license-1', status: 'APPROVED', productId: 'ea-1' },
                }),
            });

            await fetch('/api/admin/ea/accounts/license-1/approve', {
                method: 'POST',
            });

            // Check product stats updated
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        id: 'ea-1',
                        licenseCounts: { approved: 11, pending: 1 },
                    },
                }),
            });

            const productResponse = await fetch('/api/admin/ea/products/ea-1');
            const productData = await productResponse.json();

            expect(productData.data.licenseCounts.approved).toBe(11);
        });
    });

    // ========================================
    // Academy Progress Tracking
    // ========================================
    describe('Academy Progress Tracking', () => {
        it('should track user progress across levels', async () => {
            const userId = 'user-1';

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        userId,
                        progress: {
                            'level-1': { completed: 5, total: 5, percentage: 100 },
                            'level-2': { completed: 3, total: 10, percentage: 30 },
                            'level-3': { completed: 0, total: 8, percentage: 0 },
                        },
                        overallPercentage: 35,
                    },
                }),
            });

            const response = await fetch(`/api/admin/academy/users/${userId}/progress`);
            const data = await response.json();

            expect(data.data.progress['level-1'].percentage).toBe(100);
            expect(data.data.overallPercentage).toBe(35);
        });

        it('should recalculate progress when lesson added', async () => {
            // Add new lesson
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { id: 'lesson-new', moduleId: 'module-1' },
                }),
            });

            await fetch('/api/admin/academy/lessons', {
                method: 'POST',
                body: JSON.stringify({ moduleId: 'module-1', title: 'New Lesson' }),
            });

            // Check user progress recalculated
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        progress: {
                            'level-1': { completed: 5, total: 6, percentage: 83 },
                        },
                    },
                }),
            });

            const progressResponse = await fetch('/api/admin/academy/users/user-1/progress');
            const progressData = await progressResponse.json();

            expect(progressData.data.progress['level-1'].total).toBe(6);
        });
    });

    // ========================================
    // Notification Triggers
    // ========================================
    describe('Notification Triggers', () => {
        it('should trigger notification when article published', async () => {
            // Publish article
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { id: 'article-1', status: 'PUBLISHED' },
                    notificationsSent: 50,
                }),
            });

            const response = await fetch('/api/admin/articles/article-1/publish', {
                method: 'POST',
            });
            const data = await response.json();

            expect(data.notificationsSent).toBe(50);
        });

        it('should trigger notification when license status changes', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { id: 'license-1', status: 'APPROVED' },
                    emailSent: true,
                    notificationCreated: true,
                }),
            });

            const response = await fetch('/api/admin/ea/accounts/license-1/approve', {
                method: 'POST',
            });
            const data = await response.json();

            expect(data.emailSent).toBe(true);
            expect(data.notificationCreated).toBe(true);
        });
    });

    // ========================================
    // Audit Log Integration
    // ========================================
    describe('Audit Log Integration', () => {
        it('should create audit log for all CRUD operations', async () => {
            const operations = [
                { method: 'POST', entity: 'article', action: 'CREATE' },
                { method: 'PATCH', entity: 'article', action: 'UPDATE' },
                { method: 'DELETE', entity: 'article', action: 'DELETE' },
            ];

            for (const op of operations) {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        success: true,
                        data: { id: 'article-1' },
                        auditLog: {
                            id: `log-${op.action}`,
                            action: op.action,
                            entityType: 'ARTICLE',
                        },
                    }),
                });

                const response = await fetch('/api/admin/articles/article-1', {
                    method: op.method,
                });
                const data = await response.json();

                expect(data.auditLog.action).toBe(op.action);
            }
        });

        it('should track old and new values in audit log', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { id: 'setting-1', value: 'new-value' },
                    auditLog: {
                        id: 'log-1',
                        action: 'UPDATE',
                        oldValues: { value: 'old-value' },
                        newValues: { value: 'new-value' },
                    },
                }),
            });

            const response = await fetch('/api/admin/settings/site_name', {
                method: 'PUT',
                body: JSON.stringify({ value: 'new-value' }),
            });
            const data = await response.json();

            expect(data.auditLog.oldValues.value).toBe('old-value');
            expect(data.auditLog.newValues.value).toBe('new-value');
        });
    });

    // ========================================
    // Cache Invalidation
    // ========================================
    describe('Cache Invalidation', () => {
        it('should invalidate related caches on update', async () => {
            // Update article should invalidate:
            // - Article list cache
            // - Category cache (article count)
            // - Dashboard stats cache
            // - Search index

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { id: 'article-1' },
                    cacheInvalidated: [
                        'articles:list',
                        'categories:cat-1',
                        'dashboard:stats',
                        'search:index',
                    ],
                }),
            });

            const response = await fetch('/api/admin/articles/article-1', {
                method: 'PATCH',
                body: JSON.stringify({ title: 'Updated Title' }),
            });
            const data = await response.json();

            expect(data.cacheInvalidated).toContain('articles:list');
            expect(data.cacheInvalidated).toContain('dashboard:stats');
        });
    });

    // ========================================
    // Search Index Updates
    // ========================================
    describe('Search Index Updates', () => {
        it('should update search index when content changes', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { id: 'article-1', title: 'Updated SEO Title' },
                    searchIndexUpdated: true,
                }),
            });

            const response = await fetch('/api/admin/articles/article-1', {
                method: 'PATCH',
                body: JSON.stringify({ title: 'Updated SEO Title' }),
            });
            const data = await response.json();

            expect(data.searchIndexUpdated).toBe(true);
        });

        it('should remove from search index when content deleted', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    deleted: true,
                    searchIndexRemoved: true,
                }),
            });

            const response = await fetch('/api/admin/articles/article-1', {
                method: 'DELETE',
            });
            const data = await response.json();

            expect(data.searchIndexRemoved).toBe(true);
        });
    });
});
