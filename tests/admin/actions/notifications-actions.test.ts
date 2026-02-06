/**
 * Notification Actions Tests
 * @module tests/admin/actions/notifications-actions.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockNotifications, mockBroadcasts } from '../__mocks__/data';

// Mock Prisma
const mockPrisma = {
    notification: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        updateMany: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
    broadcast: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
};

vi.mock('@/lib/prisma', () => ({
    default: mockPrisma,
}));

// Simulated server actions
async function getNotifications(options: {
    userId?: string;
    type?: string;
    isRead?: boolean;
    limit?: number;
    offset?: number;
}) {
    const where: Record<string, unknown> = {};
    if (options.userId) where.userId = options.userId;
    if (options.type) where.type = options.type;
    if (options.isRead !== undefined) where.isRead = options.isRead;

    const notifications = await mockPrisma.notification.findMany({
        where,
        take: options.limit || 10,
        skip: options.offset || 0,
        orderBy: { createdAt: 'desc' },
    });

    const total = await mockPrisma.notification.count({ where });

    return {
        success: true,
        data: { notifications, total },
    };
}

async function markAsRead(id: string) {
    const notification = await mockPrisma.notification.findUnique({
        where: { id },
    });

    if (!notification) {
        return { success: false, error: 'Notification not found' };
    }

    const updated = await mockPrisma.notification.update({
        where: { id },
        data: { isRead: true },
    });

    return { success: true, data: updated };
}

async function markAllAsRead(userId: string) {
    await mockPrisma.notification.updateMany({
        where: { userId, isRead: false },
        data: { isRead: true },
    });

    return { success: true };
}

async function deleteNotification(id: string) {
    const notification = await mockPrisma.notification.findUnique({
        where: { id },
    });

    if (!notification) {
        return { success: false, error: 'Notification not found' };
    }

    await mockPrisma.notification.delete({
        where: { id },
    });

    return { success: true };
}

async function createBroadcast(data: {
    title: string;
    message: string;
    type: string;
    targetRoles?: string[];
    targetUsers?: string[];
    expiresAt?: Date;
}) {
    if (!data.title || !data.message) {
        return { success: false, error: 'Title and message are required' };
    }

    const broadcast = await mockPrisma.broadcast.create({
        data: {
            ...data,
            createdAt: new Date(),
            isActive: true,
        },
    });

    return { success: true, data: broadcast };
}

async function getBroadcasts(options: {
    isActive?: boolean;
    limit?: number;
}) {
    const where: Record<string, unknown> = {};
    if (options.isActive !== undefined) where.isActive = options.isActive;

    const broadcasts = await mockPrisma.broadcast.findMany({
        where,
        take: options.limit || 10,
        orderBy: { createdAt: 'desc' },
    });

    return { success: true, data: broadcasts };
}

async function updateBroadcast(id: string, data: { isActive?: boolean; expiresAt?: Date }) {
    const broadcast = await mockPrisma.broadcast.findUnique({
        where: { id },
    });

    if (!broadcast) {
        return { success: false, error: 'Broadcast not found' };
    }

    const updated = await mockPrisma.broadcast.update({
        where: { id },
        data,
    });

    return { success: true, data: updated };
}

async function deleteBroadcast(id: string) {
    const broadcast = await mockPrisma.broadcast.findUnique({
        where: { id },
    });

    if (!broadcast) {
        return { success: false, error: 'Broadcast not found' };
    }

    await mockPrisma.broadcast.delete({
        where: { id },
    });

    return { success: true };
}

describe('Notification Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPrisma.notification.findMany.mockResolvedValue(mockNotifications);
        mockPrisma.notification.count.mockResolvedValue(mockNotifications.length);
    });

    // ========================================
    // Get Notifications Tests
    // ========================================
    describe('getNotifications', () => {
        it('should get all notifications', async () => {
            const result = await getNotifications({});

            expect(result.success).toBe(true);
            expect(result.data.notifications).toEqual(mockNotifications);
            expect(mockPrisma.notification.findMany).toHaveBeenCalledWith({
                where: {},
                take: 10,
                skip: 0,
                orderBy: { createdAt: 'desc' },
            });
        });

        it('should filter by userId', async () => {
            await getNotifications({ userId: 'user-1' });

            expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { userId: 'user-1' },
                })
            );
        });

        it('should filter by type', async () => {
            await getNotifications({ type: 'LICENSE_REQUEST' });

            expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { type: 'LICENSE_REQUEST' },
                })
            );
        });

        it('should filter by read status', async () => {
            await getNotifications({ isRead: false });

            expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { isRead: false },
                })
            );
        });

        it('should apply pagination', async () => {
            await getNotifications({ limit: 5, offset: 10 });

            expect(mockPrisma.notification.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 5,
                    skip: 10,
                })
            );
        });

        it('should return total count', async () => {
            mockPrisma.notification.count.mockResolvedValueOnce(100);

            const result = await getNotifications({});

            expect(result.data.total).toBe(100);
        });
    });

    // ========================================
    // Mark as Read Tests
    // ========================================
    describe('markAsRead', () => {
        beforeEach(() => {
            mockPrisma.notification.findUnique.mockResolvedValue(mockNotifications[0]);
            mockPrisma.notification.update.mockResolvedValue({
                ...mockNotifications[0],
                isRead: true,
            });
        });

        it('should mark notification as read', async () => {
            const result = await markAsRead('notif-1');

            expect(result.success).toBe(true);
            expect(mockPrisma.notification.update).toHaveBeenCalledWith({
                where: { id: 'notif-1' },
                data: { isRead: true },
            });
        });

        it('should return error if not found', async () => {
            mockPrisma.notification.findUnique.mockResolvedValueOnce(null);

            const result = await markAsRead('invalid-id');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Notification not found');
        });
    });

    // ========================================
    // Mark All as Read Tests
    // ========================================
    describe('markAllAsRead', () => {
        it('should mark all notifications as read for user', async () => {
            mockPrisma.notification.updateMany.mockResolvedValueOnce({ count: 5 });

            const result = await markAllAsRead('user-1');

            expect(result.success).toBe(true);
            expect(mockPrisma.notification.updateMany).toHaveBeenCalledWith({
                where: { userId: 'user-1', isRead: false },
                data: { isRead: true },
            });
        });
    });

    // ========================================
    // Delete Notification Tests
    // ========================================
    describe('deleteNotification', () => {
        beforeEach(() => {
            mockPrisma.notification.findUnique.mockResolvedValue(mockNotifications[0]);
            mockPrisma.notification.delete.mockResolvedValue(mockNotifications[0]);
        });

        it('should delete notification', async () => {
            const result = await deleteNotification('notif-1');

            expect(result.success).toBe(true);
            expect(mockPrisma.notification.delete).toHaveBeenCalledWith({
                where: { id: 'notif-1' },
            });
        });

        it('should return error if not found', async () => {
            mockPrisma.notification.findUnique.mockResolvedValueOnce(null);

            const result = await deleteNotification('invalid-id');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Notification not found');
        });
    });
});

describe('Broadcast Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPrisma.broadcast.findMany.mockResolvedValue(mockBroadcasts);
    });

    // ========================================
    // Create Broadcast Tests
    // ========================================
    describe('createBroadcast', () => {
        it('should create a broadcast', async () => {
            const newBroadcast = {
                title: 'System Maintenance',
                message: 'System will be down for maintenance',
                type: 'MAINTENANCE',
            };

            mockPrisma.broadcast.create.mockResolvedValueOnce({
                id: 'broadcast-new',
                ...newBroadcast,
                isActive: true,
                createdAt: new Date(),
            });

            const result = await createBroadcast(newBroadcast);

            expect(result.success).toBe(true);
            expect(mockPrisma.broadcast.create).toHaveBeenCalled();
        });

        it('should create with target roles', async () => {
            const newBroadcast = {
                title: 'Admin Notice',
                message: 'Important update for admins',
                type: 'NOTICE',
                targetRoles: ['ADMIN', 'EDITOR'],
            };

            mockPrisma.broadcast.create.mockResolvedValueOnce({
                id: 'broadcast-new',
                ...newBroadcast,
                isActive: true,
            });

            const result = await createBroadcast(newBroadcast);

            expect(result.success).toBe(true);
            expect(mockPrisma.broadcast.create).toHaveBeenCalledWith({
                data: expect.objectContaining({
                    targetRoles: ['ADMIN', 'EDITOR'],
                }),
            });
        });

        it('should require title', async () => {
            const result = await createBroadcast({
                title: '',
                message: 'Some message',
                type: 'INFO',
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Title and message are required');
        });

        it('should require message', async () => {
            const result = await createBroadcast({
                title: 'Some title',
                message: '',
                type: 'INFO',
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Title and message are required');
        });
    });

    // ========================================
    // Get Broadcasts Tests
    // ========================================
    describe('getBroadcasts', () => {
        it('should get all broadcasts', async () => {
            const result = await getBroadcasts({});

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockBroadcasts);
        });

        it('should filter by active status', async () => {
            await getBroadcasts({ isActive: true });

            expect(mockPrisma.broadcast.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { isActive: true },
                })
            );
        });

        it('should apply limit', async () => {
            await getBroadcasts({ limit: 5 });

            expect(mockPrisma.broadcast.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    take: 5,
                })
            );
        });
    });

    // ========================================
    // Update Broadcast Tests
    // ========================================
    describe('updateBroadcast', () => {
        beforeEach(() => {
            mockPrisma.broadcast.findUnique.mockResolvedValue(mockBroadcasts[0]);
            mockPrisma.broadcast.update.mockResolvedValue({
                ...mockBroadcasts[0],
                isActive: false,
            });
        });

        it('should deactivate broadcast', async () => {
            const result = await updateBroadcast('broadcast-1', { isActive: false });

            expect(result.success).toBe(true);
            expect(mockPrisma.broadcast.update).toHaveBeenCalledWith({
                where: { id: 'broadcast-1' },
                data: { isActive: false },
            });
        });

        it('should update expiry date', async () => {
            const expiresAt = new Date('2025-12-31');
            await updateBroadcast('broadcast-1', { expiresAt });

            expect(mockPrisma.broadcast.update).toHaveBeenCalledWith({
                where: { id: 'broadcast-1' },
                data: { expiresAt },
            });
        });

        it('should return error if not found', async () => {
            mockPrisma.broadcast.findUnique.mockResolvedValueOnce(null);

            const result = await updateBroadcast('invalid-id', { isActive: false });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Broadcast not found');
        });
    });

    // ========================================
    // Delete Broadcast Tests
    // ========================================
    describe('deleteBroadcast', () => {
        beforeEach(() => {
            mockPrisma.broadcast.findUnique.mockResolvedValue(mockBroadcasts[0]);
            mockPrisma.broadcast.delete.mockResolvedValue(mockBroadcasts[0]);
        });

        it('should delete broadcast', async () => {
            const result = await deleteBroadcast('broadcast-1');

            expect(result.success).toBe(true);
            expect(mockPrisma.broadcast.delete).toHaveBeenCalledWith({
                where: { id: 'broadcast-1' },
            });
        });

        it('should return error if not found', async () => {
            mockPrisma.broadcast.findUnique.mockResolvedValueOnce(null);

            const result = await deleteBroadcast('invalid-id');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Broadcast not found');
        });
    });
});
