/**
 * Notifications API Tests
 * @module tests/user/api/notifications.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockNotifications } from '../__mocks__/data';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// API helper functions
async function getNotifications(params?: {
    page?: number;
    limit?: number;
    unreadOnly?: boolean;
    type?: string;
}) {
    const query = new URLSearchParams();
    if (params?.page) query.append('page', params.page.toString());
    if (params?.limit) query.append('limit', params.limit.toString());
    if (params?.unreadOnly) query.append('unreadOnly', 'true');
    if (params?.type) query.append('type', params.type);
    const queryString = query.toString() ? `?${query.toString()}` : '';
    const response = await fetch(`/api/notifications${queryString}`);
    return response.json();
}

async function getNotificationById(id: string) {
    const response = await fetch(`/api/notifications/${id}`);
    return response.json();
}

async function markAsRead(id: string) {
    const response = await fetch(`/api/notifications/${id}/read`, {
        method: 'POST',
    });
    return response.json();
}

async function markAllAsRead() {
    const response = await fetch('/api/notifications/read-all', {
        method: 'POST',
    });
    return response.json();
}

async function deleteNotification(id: string) {
    const response = await fetch(`/api/notifications/${id}`, {
        method: 'DELETE',
    });
    return response.json();
}

async function clearAllNotifications() {
    const response = await fetch('/api/notifications/clear-all', {
        method: 'DELETE',
    });
    return response.json();
}

async function getUnreadCount() {
    const response = await fetch('/api/notifications/unread-count');
    return response.json();
}

async function getNotificationSettings() {
    const response = await fetch('/api/notifications/settings');
    return response.json();
}

async function updateNotificationSettings(settings: {
    email?: {
        achievements?: boolean;
        streakReminders?: boolean;
        newArticles?: boolean;
        systemUpdates?: boolean;
        marketing?: boolean;
    };
    push?: {
        achievements?: boolean;
        streakReminders?: boolean;
        newArticles?: boolean;
        systemUpdates?: boolean;
    };
    inApp?: {
        achievements?: boolean;
        streakReminders?: boolean;
        newArticles?: boolean;
        systemUpdates?: boolean;
    };
}) {
    const response = await fetch('/api/notifications/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
    });
    return response.json();
}

async function subscribeToPush(subscription: {
    endpoint: string;
    keys: {
        p256dh: string;
        auth: string;
    };
}) {
    const response = await fetch('/api/notifications/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(subscription),
    });
    return response.json();
}

async function unsubscribeFromPush() {
    const response = await fetch('/api/notifications/push/unsubscribe', {
        method: 'POST',
    });
    return response.json();
}

describe('Notifications API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // List Notifications Tests
    // ========================================
    describe('GET /api/notifications', () => {
        it('should get all notifications', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockNotifications,
                    pagination: {
                        page: 1,
                        limit: 20,
                        total: 4,
                        totalPages: 1,
                    },
                }),
            });

            const data = await getNotifications();

            expect(mockFetch).toHaveBeenCalledWith('/api/notifications');
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(4);
        });

        it('should filter unread only', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockNotifications.filter((n: any) => !n.isRead),
                }),
            });

            await getNotifications({ unreadOnly: true });

            expect(mockFetch).toHaveBeenCalledWith('/api/notifications?unreadOnly=true');
        });

        it('should filter by type', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockNotifications.filter((n: any) => n.type === 'ACHIEVEMENT'),
                }),
            });

            await getNotifications({ type: 'ACHIEVEMENT' });

            expect(mockFetch).toHaveBeenCalledWith('/api/notifications?type=ACHIEVEMENT');
        });

        it('should paginate results', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockNotifications.slice(0, 2),
                    pagination: { page: 1, limit: 2, total: 4, totalPages: 2 },
                }),
            });

            await getNotifications({ page: 1, limit: 2 });

            expect(mockFetch).toHaveBeenCalledWith('/api/notifications?page=1&limit=2');
        });
    });

    // ========================================
    // Get Single Notification Tests
    // ========================================
    describe('GET /api/notifications/:id', () => {
        it('should get notification by id', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockNotifications[0],
                }),
            });

            const data = await getNotificationById('notif-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/notifications/notif-1');
            expect(data.success).toBe(true);
        });

        it('should return 404 for non-existent notification', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Notification not found',
                }),
            });

            const data = await getNotificationById('non-existent');

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Mark as Read Tests
    // ========================================
    describe('POST /api/notifications/:id/read', () => {
        it('should mark notification as read', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockNotifications[1], isRead: true, readAt: '2025-01-15T10:00:00Z' },
                }),
            });

            const data = await markAsRead('notif-2');

            expect(mockFetch).toHaveBeenCalledWith('/api/notifications/notif-2/read', {
                method: 'POST',
            });
            expect(data.success).toBe(true);
            expect(data.data.isRead).toBe(true);
        });

        it('should handle already read notification', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockNotifications[0], isRead: true },
                    message: 'Already marked as read',
                }),
            });

            const data = await markAsRead('notif-1');

            expect(data.success).toBe(true);
        });
    });

    describe('POST /api/notifications/read-all', () => {
        it('should mark all notifications as read', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'All notifications marked as read',
                    count: 3,
                }),
            });

            const data = await markAllAsRead();

            expect(mockFetch).toHaveBeenCalledWith('/api/notifications/read-all', {
                method: 'POST',
            });
            expect(data.success).toBe(true);
            expect(data.count).toBe(3);
        });
    });

    // ========================================
    // Delete Notification Tests
    // ========================================
    describe('DELETE /api/notifications/:id', () => {
        it('should delete notification', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Notification deleted',
                }),
            });

            const data = await deleteNotification('notif-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/notifications/notif-1', {
                method: 'DELETE',
            });
            expect(data.success).toBe(true);
        });
    });

    describe('DELETE /api/notifications/clear-all', () => {
        it('should clear all notifications', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'All notifications cleared',
                    count: 4,
                }),
            });

            const data = await clearAllNotifications();

            expect(mockFetch).toHaveBeenCalledWith('/api/notifications/clear-all', {
                method: 'DELETE',
            });
            expect(data.success).toBe(true);
        });
    });

    // ========================================
    // Unread Count Tests
    // ========================================
    describe('GET /api/notifications/unread-count', () => {
        it('should get unread count', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { count: 3 },
                }),
            });

            const data = await getUnreadCount();

            expect(data.success).toBe(true);
            expect(data.data.count).toBe(3);
        });
    });

    // ========================================
    // Notification Settings Tests
    // ========================================
    describe('GET /api/notifications/settings', () => {
        it('should get notification settings', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        email: {
                            achievements: true,
                            streakReminders: true,
                            newArticles: true,
                            systemUpdates: true,
                            marketing: false,
                        },
                        push: {
                            achievements: true,
                            streakReminders: true,
                            newArticles: false,
                            systemUpdates: true,
                        },
                        inApp: {
                            achievements: true,
                            streakReminders: true,
                            newArticles: true,
                            systemUpdates: true,
                        },
                    },
                }),
            });

            const data = await getNotificationSettings();

            expect(data.success).toBe(true);
            expect(data.data.email).toBeDefined();
            expect(data.data.push).toBeDefined();
        });
    });

    describe('PATCH /api/notifications/settings', () => {
        it('should update email notification settings', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        email: { marketing: true },
                    },
                }),
            });

            const data = await updateNotificationSettings({
                email: { marketing: true },
            });

            expect(mockFetch).toHaveBeenCalledWith('/api/notifications/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: { marketing: true } }),
            });
            expect(data.success).toBe(true);
        });

        it('should update push notification settings', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        push: { newArticles: true },
                    },
                }),
            });

            const data = await updateNotificationSettings({
                push: { newArticles: true },
            });

            expect(data.success).toBe(true);
        });

        it('should update multiple settings at once', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        email: { marketing: false },
                        push: { streakReminders: false },
                    },
                }),
            });

            const data = await updateNotificationSettings({
                email: { marketing: false },
                push: { streakReminders: false },
            });

            expect(data.success).toBe(true);
        });
    });

    // ========================================
    // Push Subscription Tests
    // ========================================
    describe('POST /api/notifications/push/subscribe', () => {
        it('should subscribe to push notifications', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Successfully subscribed to push notifications',
                }),
            });

            const subscription = {
                endpoint: 'https://fcm.googleapis.com/fcm/send/...',
                keys: {
                    p256dh: 'BNcRd...',
                    auth: 'tBHI...',
                },
            };

            const data = await subscribeToPush(subscription);

            expect(mockFetch).toHaveBeenCalledWith('/api/notifications/push/subscribe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(subscription),
            });
            expect(data.success).toBe(true);
        });
    });

    describe('POST /api/notifications/push/unsubscribe', () => {
        it('should unsubscribe from push notifications', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Successfully unsubscribed from push notifications',
                }),
            });

            const data = await unsubscribeFromPush();

            expect(mockFetch).toHaveBeenCalledWith('/api/notifications/push/unsubscribe', {
                method: 'POST',
            });
            expect(data.success).toBe(true);
        });
    });
});
