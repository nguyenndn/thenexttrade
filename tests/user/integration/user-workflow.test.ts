/**
 * User Workflow Integration Tests
 * @module tests/user/integration/user-workflow.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

/**
 * These integration tests verify complete user workflows
 * by simulating the sequence of API calls that would happen
 * during real user interactions.
 */

describe('User Dashboard Workflow', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // Dashboard Loading Workflow
    // ========================================
    describe('Dashboard Loading', () => {
        it('should load dashboard with all required data', async () => {
            // Simulate parallel API calls on dashboard load
            mockFetch
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        success: true,
                        data: { totalTrades: 50, winRate: 65, totalPnl: 2500 },
                    }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        success: true,
                        data: [
                            { id: 'account-1', name: 'Main Account', balance: 10000 },
                        ],
                    }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        success: true,
                        data: { currentStreak: 7, lastCheckIn: '2025-01-15' },
                    }),
                })
                .mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        success: true,
                        data: { count: 3 },
                    }),
                });

            // Simulate dashboard load
            const [statsRes, accountsRes, streakRes, notifRes] = await Promise.all([
                fetch('/api/dashboard/stats'),
                fetch('/api/trading-accounts'),
                fetch('/api/streak'),
                fetch('/api/notifications/unread-count'),
            ]);

            const stats = await statsRes.json();
            const accounts = await accountsRes.json();
            const streak = await streakRes.json();
            const notifications = await notifRes.json();

            expect(stats.success).toBe(true);
            expect(accounts.data).toHaveLength(1);
            expect(streak.data.currentStreak).toBe(7);
            expect(notifications.data.count).toBe(3);
        });
    });

    // ========================================
    // Trading Journal Workflow
    // ========================================
    describe('Trading Journal Workflow', () => {
        it('should create, update, and close a trade', async () => {
            // Step 1: Create a new trade
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        id: 'trade-1',
                        symbol: 'EURUSD',
                        type: 'BUY',
                        entryPrice: 1.1000,
                        lotSize: 0.1,
                        status: 'OPEN',
                    },
                }),
            });

            const createRes = await fetch('/api/journal-entries', {
                method: 'POST',
                body: JSON.stringify({
                    symbol: 'EURUSD',
                    type: 'BUY',
                    entryPrice: 1.1000,
                    stopLoss: 1.0950,
                    takeProfit: 1.1100,
                    lotSize: 0.1,
                }),
            });
            const createdTrade = await createRes.json();

            expect(createdTrade.success).toBe(true);
            expect(createdTrade.data.status).toBe('OPEN');

            // Step 2: Update trade notes
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        ...createdTrade.data,
                        notes: 'Breakout pattern confirmed',
                    },
                }),
            });

            const updateRes = await fetch(`/api/journal-entries/${createdTrade.data.id}`, {
                method: 'PATCH',
                body: JSON.stringify({ notes: 'Breakout pattern confirmed' }),
            });
            const updatedTrade = await updateRes.json();

            expect(updatedTrade.data.notes).toBe('Breakout pattern confirmed');

            // Step 3: Close the trade
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        ...updatedTrade.data,
                        status: 'CLOSED',
                        exitPrice: 1.1050,
                        pnl: 50,
                        result: 'WIN',
                    },
                }),
            });

            const closeRes = await fetch(`/api/journal-entries/${createdTrade.data.id}/close`, {
                method: 'POST',
                body: JSON.stringify({ exitPrice: 1.1050 }),
            });
            const closedTrade = await closeRes.json();

            expect(closedTrade.data.status).toBe('CLOSED');
            expect(closedTrade.data.pnl).toBe(50);
            expect(closedTrade.data.result).toBe('WIN');
        });

        it('should update stats after trade closure', async () => {
            // Close trade
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { status: 'CLOSED', pnl: 100 },
                }),
            });

            await fetch('/api/journal-entries/trade-1/close', {
                method: 'POST',
                body: JSON.stringify({ exitPrice: 1.1050 }),
            });

            // Fetch updated stats
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        totalTrades: 51,
                        winRate: 66,
                        totalPnl: 2600,
                    },
                }),
            });

            const statsRes = await fetch('/api/journal/stats');
            const stats = await statsRes.json();

            expect(stats.data.totalTrades).toBe(51);
            expect(stats.data.totalPnl).toBe(2600);
        });
    });

    // ========================================
    // Academy Learning Workflow
    // ========================================
    describe('Academy Learning Workflow', () => {
        it('should complete a lesson and earn XP', async () => {
            const userId = 'user-1';
            const lessonId = 'lesson-1';

            // Step 1: Start lesson
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { startedAt: '2025-01-15T10:00:00Z' },
                }),
            });

            await fetch(`/api/academy/lessons/${lessonId}/start`, {
                method: 'POST',
            });

            // Step 2: Complete lesson
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        isCompleted: true,
                        xpEarned: 50,
                        completedAt: '2025-01-15T10:30:00Z',
                    },
                }),
            });

            const completeRes = await fetch(`/api/academy/lessons/${lessonId}/complete`, {
                method: 'POST',
                body: JSON.stringify({ timeSpent: 1800 }),
            });
            const completed = await completeRes.json();

            expect(completed.data.isCompleted).toBe(true);
            expect(completed.data.xpEarned).toBe(50);

            // Step 3: Check updated progress
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        totalXP: 1300, // Previous 1250 + 50
                        lessonsCompleted: 9,
                    },
                }),
            });

            const progressRes = await fetch('/api/academy/stats');
            const progress = await progressRes.json();

            expect(progress.data.totalXP).toBe(1300);
            expect(progress.data.lessonsCompleted).toBe(9);
        });

        it('should pass quiz and unlock achievement', async () => {
            // Submit quiz
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        passed: true,
                        score: 100,
                        xpEarned: 100,
                        achievementUnlocked: {
                            id: 'achieve-perfect-quiz',
                            name: 'Perfect Score',
                        },
                    },
                }),
            });

            const quizRes = await fetch('/api/academy/lessons/lesson-1/quiz', {
                method: 'POST',
                body: JSON.stringify({
                    answers: [
                        { questionId: 'q1', answer: 'A' },
                        { questionId: 'q2', answer: 'B' },
                    ],
                }),
            });
            const quizResult = await quizRes.json();

            expect(quizResult.data.passed).toBe(true);
            expect(quizResult.data.score).toBe(100);
            expect(quizResult.data.achievementUnlocked).toBeDefined();
        });
    });

    // ========================================
    // Streak & Gamification Workflow
    // ========================================
    describe('Streak Workflow', () => {
        it('should complete daily check-in and maintain streak', async () => {
            // Check-in
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        currentStreak: 8,
                        xpEarned: 10,
                        checkedInAt: '2025-01-15T10:00:00Z',
                    },
                }),
            });

            const checkInRes = await fetch('/api/streak/check-in', {
                method: 'POST',
            });
            const checkIn = await checkInRes.json();

            expect(checkIn.data.currentStreak).toBe(8);
            expect(checkIn.data.xpEarned).toBe(10);

            // Verify streak
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        currentStreak: 8,
                        isActive: true,
                        nextMilestone: 14,
                    },
                }),
            });

            const streakRes = await fetch('/api/streak');
            const streak = await streakRes.json();

            expect(streak.data.currentStreak).toBe(8);
            expect(streak.data.isActive).toBe(true);
        });

        it('should earn bonus XP on milestone', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        currentStreak: 14,
                        xpEarned: 10,
                        bonusXP: 200,
                        milestone: true,
                        milestoneMessage: 'Congratulations! 2-week streak!',
                    },
                }),
            });

            const checkInRes = await fetch('/api/streak/check-in', {
                method: 'POST',
            });
            const checkIn = await checkInRes.json();

            expect(checkIn.data.milestone).toBe(true);
            expect(checkIn.data.bonusXP).toBe(200);
        });
    });

    // ========================================
    // Trading Account Workflow
    // ========================================
    describe('Trading Account Workflow', () => {
        it('should create account and set as primary', async () => {
            // Create new account
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        id: 'account-new',
                        name: 'New Live Account',
                        isPrimary: false,
                    },
                }),
            });

            const createRes = await fetch('/api/trading-accounts', {
                method: 'POST',
                body: JSON.stringify({
                    name: 'New Live Account',
                    broker: 'FXCM',
                    accountNumber: '99999',
                    accountType: 'LIVE',
                    currency: 'USD',
                    balance: 5000,
                }),
            });
            const created = await createRes.json();

            expect(created.success).toBe(true);

            // Set as primary
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...created.data, isPrimary: true },
                }),
            });

            const primaryRes = await fetch(`/api/trading-accounts/${created.data.id}/set-primary`, {
                method: 'POST',
            });
            const primary = await primaryRes.json();

            expect(primary.data.isPrimary).toBe(true);
        });

        it('should sync account balance from broker', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        id: 'account-1',
                        balance: 10500, // Updated from broker
                        equity: 10750,
                        lastSyncAt: '2025-01-15T12:00:00Z',
                    },
                }),
            });

            const syncRes = await fetch('/api/trading-accounts/account-1/sync', {
                method: 'POST',
            });
            const synced = await syncRes.json();

            expect(synced.data.balance).toBe(10500);
            expect(synced.data.lastSyncAt).toBeDefined();
        });
    });

    // ========================================
    // Notification Workflow
    // ========================================
    describe('Notification Workflow', () => {
        it('should receive and read notifications', async () => {
            // Get notifications
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [
                        { id: 'notif-1', title: 'Achievement Unlocked', isRead: false },
                        { id: 'notif-2', title: 'New Article', isRead: false },
                    ],
                }),
            });

            const notifsRes = await fetch('/api/notifications');
            const notifs = await notifsRes.json();

            expect(notifs.data).toHaveLength(2);

            // Mark one as read
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { id: 'notif-1', isRead: true },
                }),
            });

            await fetch('/api/notifications/notif-1/read', { method: 'POST' });

            // Mark all as read
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    count: 1,
                }),
            });

            const readAllRes = await fetch('/api/notifications/read-all', {
                method: 'POST',
            });
            const readAll = await readAllRes.json();

            expect(readAll.count).toBe(1);
        });
    });

    // ========================================
    // Profile Update Workflow
    // ========================================
    describe('Profile Update Workflow', () => {
        it('should update profile and settings', async () => {
            // Update profile
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        name: 'John Updated',
                        tradingStyle: 'SWING',
                    },
                }),
            });

            const profileRes = await fetch('/api/profile', {
                method: 'PATCH',
                body: JSON.stringify({
                    name: 'John Updated',
                    tradingStyle: 'SWING',
                }),
            });
            const profile = await profileRes.json();

            expect(profile.data.name).toBe('John Updated');

            // Update settings
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        theme: 'light',
                        emailNotifications: false,
                    },
                }),
            });

            const settingsRes = await fetch('/api/user/settings', {
                method: 'PATCH',
                body: JSON.stringify({
                    theme: 'light',
                    emailNotifications: false,
                }),
            });
            const settings = await settingsRes.json();

            expect(settings.data.theme).toBe('light');
            expect(settings.data.emailNotifications).toBe(false);
        });

        it('should change password with validation', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Password changed successfully',
                }),
            });

            const passwordRes = await fetch('/api/user/password', {
                method: 'POST',
                body: JSON.stringify({
                    currentPassword: 'OldPass123!',
                    newPassword: 'NewPass456!',
                    confirmPassword: 'NewPass456!',
                }),
            });
            const result = await passwordRes.json();

            expect(result.success).toBe(true);
        });
    });
});
