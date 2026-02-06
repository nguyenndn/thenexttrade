/**
 * Dashboard API Tests
 * @module tests/admin/api/dashboard.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockDashboardStats } from '../__mocks__/data';
import { mockPrismaClient, mockAdminSession, mockUserSession } from '../__mocks__/helpers';

// Mock the prisma module
vi.mock('@/lib/prisma', () => ({
    prisma: mockPrismaClient,
}));

// Simulated API handler for testing
async function getDashboardStats(session: typeof mockAdminSession | null) {
    // Check authentication
    if (!session) {
        return { success: false, error: 'Unauthorized', status: 401 };
    }

    // Check authorization
    if (session.user.role !== 'ADMIN' && session.user.role !== 'EDITOR') {
        return { success: false, error: 'Forbidden', status: 403 };
    }

    try {
        // Simulate fetching stats
        const stats = {
            totalUsers: await mockPrismaClient.user.count(),
            totalArticles: await mockPrismaClient.article.count(),
            pendingLicenses: await mockPrismaClient.licenseAccount.count({ where: { status: 'PENDING' } }),
        };

        return { success: true, data: stats, status: 200 };
    } catch (error) {
        return { success: false, error: 'Internal Server Error', status: 500 };
    }
}

describe('Dashboard API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // Authentication Tests
    // ========================================
    describe('Authentication', () => {
        it('should return 401 when not authenticated', async () => {
            const result = await getDashboardStats(null);
            
            expect(result.success).toBe(false);
            expect(result.status).toBe(401);
            expect(result.error).toBe('Unauthorized');
        });

        it('should allow admin users', async () => {
            mockPrismaClient.user.count.mockResolvedValue(1500);
            mockPrismaClient.article.count.mockResolvedValue(120);
            mockPrismaClient.licenseAccount.count.mockResolvedValue(3);

            const result = await getDashboardStats(mockAdminSession);
            
            expect(result.success).toBe(true);
            expect(result.status).toBe(200);
        });

        it('should deny regular users', async () => {
            const result = await getDashboardStats(mockUserSession);
            
            expect(result.success).toBe(false);
            expect(result.status).toBe(403);
            expect(result.error).toBe('Forbidden');
        });
    });

    // ========================================
    // Data Fetching Tests
    // ========================================
    describe('Data Fetching', () => {
        it('should return dashboard statistics', async () => {
            mockPrismaClient.user.count.mockResolvedValue(1500);
            mockPrismaClient.article.count.mockResolvedValue(120);
            mockPrismaClient.licenseAccount.count.mockResolvedValue(3);

            const result = await getDashboardStats(mockAdminSession);
            
            expect(result.success).toBe(true);
            expect(result.data).toEqual({
                totalUsers: 1500,
                totalArticles: 120,
                pendingLicenses: 3,
            });
        });

        it('should call count methods correctly', async () => {
            mockPrismaClient.user.count.mockResolvedValue(100);
            mockPrismaClient.article.count.mockResolvedValue(50);
            mockPrismaClient.licenseAccount.count.mockResolvedValue(5);

            await getDashboardStats(mockAdminSession);
            
            expect(mockPrismaClient.user.count).toHaveBeenCalled();
            expect(mockPrismaClient.article.count).toHaveBeenCalled();
            expect(mockPrismaClient.licenseAccount.count).toHaveBeenCalledWith({
                where: { status: 'PENDING' },
            });
        });
    });

    // ========================================
    // Error Handling Tests
    // ========================================
    describe('Error Handling', () => {
        it('should return 500 on database error', async () => {
            mockPrismaClient.user.count.mockRejectedValue(new Error('Database connection failed'));

            const result = await getDashboardStats(mockAdminSession);
            
            expect(result.success).toBe(false);
            expect(result.status).toBe(500);
            expect(result.error).toBe('Internal Server Error');
        });
    });

    // ========================================
    // Cache Tests
    // ========================================
    describe('Caching', () => {
        it('should fetch fresh data on each request', async () => {
            mockPrismaClient.user.count.mockResolvedValue(100);
            mockPrismaClient.article.count.mockResolvedValue(50);
            mockPrismaClient.licenseAccount.count.mockResolvedValue(2);

            await getDashboardStats(mockAdminSession);
            await getDashboardStats(mockAdminSession);
            
            // Should be called twice (no caching in this simple implementation)
            expect(mockPrismaClient.user.count).toHaveBeenCalledTimes(2);
        });
    });
});
