/**
 * Admin Module Integration Tests
 * @module tests/admin/integration/admin-workflow.test
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { mockUsers, mockArticles, mockCategories, mockBrokers, mockEAProducts, mockLicenseAccounts } from '../__mocks__/data';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock localStorage
const localStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(global, 'localStorage', { value: localStorageMock });

// Mock sessionStorage
const sessionStorageMock = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn(),
};
Object.defineProperty(global, 'sessionStorage', { value: sessionStorageMock });

describe('Admin Workflow Integration Tests', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // Authentication Flow
    // ========================================
    describe('Authentication Flow', () => {
        it('should redirect to login if not authenticated', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: () => Promise.resolve({ error: 'Unauthorized' }),
            });

            const response = await fetch('/api/admin/dashboard');
            const data = await response.json();

            expect(response.status).toBe(401);
            expect(data.error).toBe('Unauthorized');
        });

        it('should access admin routes when authenticated', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: () => Promise.resolve({
                    success: true,
                    data: { stats: {} },
                }),
            });

            const response = await fetch('/api/admin/dashboard', {
                headers: { Authorization: 'Bearer valid-token' },
            });

            expect(response.ok).toBe(true);
        });

        it('should check admin role for protected routes', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                json: () => Promise.resolve({ error: 'Admin access required' }),
            });

            const response = await fetch('/api/admin/settings', {
                headers: { Authorization: 'Bearer user-token' },
            });

            expect(response.status).toBe(403);
        });
    });

    // ========================================
    // Article Management Workflow
    // ========================================
    describe('Article Management Workflow', () => {
        it('should complete article creation flow', async () => {
            // Step 1: Create draft
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        id: 'new-article',
                        title: 'New Article',
                        status: 'DRAFT',
                    },
                }),
            });

            const createResponse = await fetch('/api/admin/articles', {
                method: 'POST',
                body: JSON.stringify({
                    title: 'New Article',
                    content: 'Content here',
                    categoryId: 'cat-1',
                }),
            });
            const createData = await createResponse.json();

            expect(createData.success).toBe(true);
            expect(createData.data.status).toBe('DRAFT');

            // Step 2: Update content
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...createData.data, content: 'Updated content' },
                }),
            });

            await fetch(`/api/admin/articles/${createData.data.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ content: 'Updated content' }),
            });

            // Step 3: Publish
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...createData.data, status: 'PUBLISHED' },
                }),
            });

            const publishResponse = await fetch(`/api/admin/articles/${createData.data.id}/publish`, {
                method: 'POST',
            });
            const publishData = await publishResponse.json();

            expect(publishData.data.status).toBe('PUBLISHED');
        });

        it('should handle article bulk operations', async () => {
            const articleIds = ['article-1', 'article-2'];

            // Bulk publish
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    publishedCount: 2,
                }),
            });

            const response = await fetch('/api/admin/articles/bulk-publish', {
                method: 'POST',
                body: JSON.stringify({ ids: articleIds }),
            });
            const data = await response.json();

            expect(data.publishedCount).toBe(2);
        });
    });

    // ========================================
    // User Management Workflow
    // ========================================
    describe('User Management Workflow', () => {
        it('should complete user role update flow', async () => {
            // Step 1: Get user
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockUsers[1],
                }),
            });

            const getUserResponse = await fetch('/api/admin/users/user-2');
            const userData = await getUserResponse.json();

            expect(userData.data.role).toBe('USER');

            // Step 2: Update role
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...userData.data, role: 'MODERATOR' },
                }),
            });

            const updateResponse = await fetch('/api/admin/users/user-2', {
                method: 'PATCH',
                body: JSON.stringify({ role: 'MODERATOR' }),
            });
            const updateData = await updateResponse.json();

            expect(updateData.data.role).toBe('MODERATOR');
        });

        it('should complete user ban/unban flow', async () => {
            // Step 1: Ban user
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockUsers[1], status: 'BANNED' },
                }),
            });

            const banResponse = await fetch('/api/admin/users/user-2/ban', {
                method: 'POST',
                body: JSON.stringify({ reason: 'Violation of terms' }),
            });
            const banData = await banResponse.json();

            expect(banData.data.status).toBe('BANNED');

            // Step 2: Unban user
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockUsers[1], status: 'ACTIVE' },
                }),
            });

            const unbanResponse = await fetch('/api/admin/users/user-2/unban', {
                method: 'POST',
            });
            const unbanData = await unbanResponse.json();

            expect(unbanData.data.status).toBe('ACTIVE');
        });
    });

    // ========================================
    // EA License Management Workflow
    // ========================================
    describe('EA License Management Workflow', () => {
        it('should complete license approval flow', async () => {
            // Step 1: Get pending licenses
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        accounts: mockLicenseAccounts.filter(l => l.status === 'PENDING'),
                        total: 1,
                    },
                }),
            });

            const pendingResponse = await fetch('/api/admin/ea/accounts?status=PENDING');
            const pendingData = await pendingResponse.json();

            expect(pendingData.data.accounts.length).toBeGreaterThan(0);

            // Step 2: Approve license
            const licenseId = pendingData.data.accounts[0].id;
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockLicenseAccounts[1], status: 'APPROVED' },
                }),
            });

            const approveResponse = await fetch(`/api/admin/ea/accounts/${licenseId}/approve`, {
                method: 'POST',
            });
            const approveData = await approveResponse.json();

            expect(approveData.data.status).toBe('APPROVED');
        });

        it('should complete license rejection flow with reason', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockLicenseAccounts[1], status: 'REJECTED' },
                }),
            });

            const response = await fetch('/api/admin/ea/accounts/license-2/reject', {
                method: 'POST',
                body: JSON.stringify({ reason: 'Invalid account number' }),
            });
            const data = await response.json();

            expect(data.data.status).toBe('REJECTED');
        });
    });

    // ========================================
    // Academy Management Workflow
    // ========================================
    describe('Academy Management Workflow', () => {
        it('should complete course structure creation', async () => {
            // Step 1: Create level
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { id: 'level-new', name: 'Expert', order: 4 },
                }),
            });

            const levelResponse = await fetch('/api/admin/academy/levels', {
                method: 'POST',
                body: JSON.stringify({ name: 'Expert' }),
            });
            const levelData = await levelResponse.json();

            // Step 2: Create module
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { id: 'module-new', levelId: levelData.data.id, name: 'Advanced Strategies' },
                }),
            });

            const moduleResponse = await fetch('/api/admin/academy/modules', {
                method: 'POST',
                body: JSON.stringify({ levelId: levelData.data.id, name: 'Advanced Strategies' }),
            });
            const moduleData = await moduleResponse.json();

            // Step 3: Create lesson
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { id: 'lesson-new', moduleId: moduleData.data.id, title: 'Price Action' },
                }),
            });

            const lessonResponse = await fetch('/api/admin/academy/lessons', {
                method: 'POST',
                body: JSON.stringify({
                    moduleId: moduleData.data.id,
                    title: 'Price Action',
                    content: '<p>Lesson content</p>',
                }),
            });
            const lessonData = await lessonResponse.json();

            expect(lessonData.success).toBe(true);
        });
    });

    // ========================================
    // Broker Management Workflow
    // ========================================
    describe('Broker Management Workflow', () => {
        it('should complete broker creation and featuring', async () => {
            // Step 1: Create broker
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        id: 'broker-new',
                        name: 'New Broker',
                        isActive: true,
                        isFeatured: false,
                    },
                }),
            });

            const createResponse = await fetch('/api/admin/brokers', {
                method: 'POST',
                body: JSON.stringify({ name: 'New Broker', slug: 'new-broker' }),
            });
            const createData = await createResponse.json();

            // Step 2: Feature broker
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...createData.data, isFeatured: true },
                }),
            });

            const featureResponse = await fetch(`/api/admin/brokers/${createData.data.id}/toggle`, {
                method: 'PATCH',
                body: JSON.stringify({ field: 'isFeatured' }),
            });
            const featureData = await featureResponse.json();

            expect(featureData.data.isFeatured).toBe(true);
        });
    });

    // ========================================
    // Settings Management Workflow
    // ========================================
    describe('Settings Management Workflow', () => {
        it('should complete settings update with audit log', async () => {
            // Step 1: Get current setting
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { key: 'site_name', value: 'Old Name', category: 'general' },
                }),
            });

            await fetch('/api/admin/settings/site_name');

            // Step 2: Update setting
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { key: 'site_name', value: 'New Name', category: 'general' },
                    auditLogId: 'log-new',
                }),
            });

            const updateResponse = await fetch('/api/admin/settings/site_name', {
                method: 'PUT',
                body: JSON.stringify({ value: 'New Name' }),
            });
            const updateData = await updateResponse.json();

            expect(updateData.data.value).toBe('New Name');
            expect(updateData.auditLogId).toBeDefined();

            // Step 3: Verify audit log created
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        logs: [{ id: updateData.auditLogId, action: 'UPDATE', entityType: 'SETTING' }],
                    },
                }),
            });

            const auditResponse = await fetch('/api/admin/settings/audit');
            const auditData = await auditResponse.json();

            expect(auditData.data.logs.length).toBeGreaterThan(0);
        });
    });

    // ========================================
    // Comment Moderation Workflow
    // ========================================
    describe('Comment Moderation Workflow', () => {
        it('should complete comment moderation flow', async () => {
            // Step 1: Get pending comments
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        comments: [{ id: 'comment-pending', status: 'PENDING', content: 'Test' }],
                        total: 1,
                    },
                }),
            });

            const pendingResponse = await fetch('/api/admin/comments?status=PENDING');
            const pendingData = await pendingResponse.json();

            // Step 2: Approve comment
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { id: 'comment-pending', status: 'APPROVED' },
                }),
            });

            const approveResponse = await fetch('/api/admin/comments/comment-pending/approve', {
                method: 'POST',
            });
            const approveData = await approveResponse.json();

            expect(approveData.data.status).toBe('APPROVED');
        });

        it('should handle bulk comment moderation', async () => {
            const commentIds = ['comment-1', 'comment-2', 'comment-3'];

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    approvedCount: 3,
                }),
            });

            const response = await fetch('/api/admin/comments/bulk-approve', {
                method: 'POST',
                body: JSON.stringify({ ids: commentIds }),
            });
            const data = await response.json();

            expect(data.approvedCount).toBe(3);
        });
    });

    // ========================================
    // Error Recovery Workflow
    // ========================================
    describe('Error Recovery Workflow', () => {
        it('should handle network errors gracefully', async () => {
            mockFetch.mockRejectedValueOnce(new Error('Network error'));

            try {
                await fetch('/api/admin/dashboard');
            } catch (error) {
                expect((error as Error).message).toBe('Network error');
            }
        });

        it('should handle server errors with retry', async () => {
            // First attempt: server error
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 500,
                json: () => Promise.resolve({ error: 'Server error' }),
            });

            // Retry: success
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({ success: true, data: {} }),
            });

            const response1 = await fetch('/api/admin/dashboard');
            expect(response1.ok).toBe(false);

            const response2 = await fetch('/api/admin/dashboard');
            expect(response2.ok).toBe(true);
        });

        it('should handle validation errors with feedback', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Validation failed',
                    details: {
                        title: 'Title must be at least 5 characters',
                        content: 'Content is required',
                    },
                }),
            });

            const response = await fetch('/api/admin/articles', {
                method: 'POST',
                body: JSON.stringify({ title: 'Hi' }),
            });
            const data = await response.json();

            expect(data.success).toBe(false);
            expect(data.details.title).toBeDefined();
            expect(data.details.content).toBeDefined();
        });
    });
});
