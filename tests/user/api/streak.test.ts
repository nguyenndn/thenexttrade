/**
 * Streak & Gamification API Tests
 * @module tests/user/api/streak.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockStreak, mockAchievements, mockLeaderboard } from '../__mocks__/data';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// API helper functions
async function getStreak() {
    const response = await fetch('/api/streak');
    return response.json();
}

async function checkIn() {
    const response = await fetch('/api/streak/check-in', {
        method: 'POST',
    });
    return response.json();
}

async function getStreakHistory(period?: string) {
    const query = period ? `?period=${period}` : '';
    const response = await fetch(`/api/streak/history${query}`);
    return response.json();
}

async function getAchievements() {
    const response = await fetch('/api/achievements');
    return response.json();
}

async function getAchievementById(id: string) {
    const response = await fetch(`/api/achievements/${id}`);
    return response.json();
}

async function claimAchievement(id: string) {
    const response = await fetch(`/api/achievements/${id}/claim`, {
        method: 'POST',
    });
    return response.json();
}

async function getLeaderboard(type?: string, period?: string) {
    const params = new URLSearchParams();
    if (type) params.append('type', type);
    if (period) params.append('period', period);
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await fetch(`/api/leaderboard${query}`);
    return response.json();
}

async function getMyRank(type?: string) {
    const query = type ? `?type=${type}` : '';
    const response = await fetch(`/api/leaderboard/me${query}`);
    return response.json();
}

async function getXPHistory(period?: string) {
    const query = period ? `?period=${period}` : '';
    const response = await fetch(`/api/xp/history${query}`);
    return response.json();
}

async function getBadges() {
    const response = await fetch('/api/badges');
    return response.json();
}

async function equipBadge(badgeId: string, slot: number) {
    const response = await fetch('/api/badges/equip', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ badgeId, slot }),
    });
    return response.json();
}

describe('Streak API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // Get Streak Tests
    // ========================================
    describe('GET /api/streak', () => {
        it('should get current streak', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockStreak,
                }),
            });

            const data = await getStreak();

            expect(mockFetch).toHaveBeenCalledWith('/api/streak');
            expect(data.success).toBe(true);
            expect(data.data.currentStreak).toBe(15);
        });

        it('should show streak status', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockStreak,
                }),
            });

            const data = await getStreak();

            expect(data.data.lastCheckIn).toBeDefined();
        });

        it('should show next milestone', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockStreak,
                }),
            });

            const data = await getStreak();

            expect(data.data.nextMilestone).toBe(20);
        });
    });

    // ========================================
    // Check-in Tests
    // ========================================
    describe('POST /api/streak/check-in', () => {
        it('should complete daily check-in', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        currentStreak: 8,
                        xpEarned: 10,
                        bonusXP: 0,
                        checkedInAt: '2025-01-15T10:00:00Z',
                    },
                }),
            });

            const data = await checkIn();

            expect(mockFetch).toHaveBeenCalledWith('/api/streak/check-in', {
                method: 'POST',
            });
            expect(data.success).toBe(true);
            expect(data.data.currentStreak).toBe(8);
        });

        it('should give bonus on milestone', async () => {
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

            const data = await checkIn();

            expect(data.data.bonusXP).toBe(200);
            expect(data.data.milestone).toBe(true);
        });

        it('should prevent multiple check-ins per day', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Already checked in today',
                    nextCheckInAt: '2025-01-16T00:00:00Z',
                }),
            });

            const data = await checkIn();

            expect(data.success).toBe(false);
            expect(data.nextCheckInAt).toBeDefined();
        });

        it('should reset streak after missing day', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        currentStreak: 1,
                        previousStreak: 15,
                        streakReset: true,
                        xpEarned: 10,
                    },
                }),
            });

            const data = await checkIn();

            expect(data.data.streakReset).toBe(true);
            expect(data.data.previousStreak).toBe(15);
            expect(data.data.currentStreak).toBe(1);
        });
    });

    // ========================================
    // Streak History Tests
    // ========================================
    describe('GET /api/streak/history', () => {
        it('should get streak history', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        checkIns: [
                            { date: '2025-01-15', checkedIn: true },
                            { date: '2025-01-14', checkedIn: true },
                            { date: '2025-01-13', checkedIn: true },
                        ],
                        totalCheckIns: 30,
                    },
                }),
            });

            const data = await getStreakHistory();

            expect(data.success).toBe(true);
            expect(data.data.checkIns).toHaveLength(3);
        });

        it('should filter by period', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { checkIns: [], totalCheckIns: 7 },
                }),
            });

            await getStreakHistory('week');

            expect(mockFetch).toHaveBeenCalledWith('/api/streak/history?period=week');
        });
    });
});

describe('Achievements API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // List Achievements Tests
    // ========================================
    describe('GET /api/achievements', () => {
        it('should get all achievements', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockAchievements,
                }),
            });

            const data = await getAchievements();

            expect(mockFetch).toHaveBeenCalledWith('/api/achievements');
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(4);
        });

        it('should show unlock status', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockAchievements,
                }),
            });

            const data = await getAchievements();

            const unlocked = data.data.filter((a: any) => a.isUnlocked);
            const locked = data.data.filter((a: any) => !a.isUnlocked);
            expect(unlocked.length).toBeGreaterThan(0);
            expect(locked.length).toBeGreaterThan(0);
        });

        it('should show progress for locked achievements', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockAchievements,
                }),
            });

            const data = await getAchievements();

            const locked = data.data.find((a: any) => !a.isUnlocked);
            expect(locked.progress).toBeDefined();
            expect(locked.isUnlocked).toBe(false);
        });
    });

    // ========================================
    // Get Achievement Details Tests
    // ========================================
    describe('GET /api/achievements/:id', () => {
        it('should get achievement by id', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockAchievements[0],
                }),
            });

            const data = await getAchievementById('achieve-1');

            expect(data.success).toBe(true);
            expect(data.data.name).toBe('First Trade');
        });
    });

    // ========================================
    // Claim Achievement Tests
    // ========================================
    describe('POST /api/achievements/:id/claim', () => {
        it('should claim unlocked achievement', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        achievement: mockAchievements[1],
                        xpEarned: 100,
                        badgeEarned: {
                            id: 'badge-1',
                            name: 'Academy Graduate',
                            icon: '🎓',
                        },
                    },
                }),
            });

            const data = await claimAchievement('achieve-2');

            expect(data.success).toBe(true);
            expect(data.data.xpEarned).toBe(100);
        });

        it('should not claim locked achievement', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Achievement is not unlocked yet',
                }),
            });

            const data = await claimAchievement('achieve-4');

            expect(data.success).toBe(false);
        });

        it('should not claim already claimed achievement', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Achievement already claimed',
                }),
            });

            const data = await claimAchievement('achieve-1');

            expect(data.success).toBe(false);
        });
    });
});

describe('Leaderboard API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // Get Leaderboard Tests
    // ========================================
    describe('GET /api/leaderboard', () => {
        it('should get leaderboard', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockLeaderboard,
                }),
            });

            const data = await getLeaderboard();

            expect(mockFetch).toHaveBeenCalledWith('/api/leaderboard');
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(4);
        });

        it('should filter by type (xp, streak, trades)', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockLeaderboard,
                }),
            });

            await getLeaderboard('streak');

            expect(mockFetch).toHaveBeenCalledWith('/api/leaderboard?type=streak');
        });

        it('should filter by period', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockLeaderboard,
                }),
            });

            await getLeaderboard('xp', 'week');

            expect(mockFetch).toHaveBeenCalledWith('/api/leaderboard?type=xp&period=week');
        });

        it('should highlight current user', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockLeaderboard,
                }),
            });

            const data = await getLeaderboard();

            const currentUser = data.data.find((e: any) => e.userId === 'user-1');
            expect(currentUser).toBeDefined();
        });
    });

    // ========================================
    // Get My Rank Tests
    // ========================================
    describe('GET /api/leaderboard/me', () => {
        it('should get my rank', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        rank: 15,
                        totalUsers: 100,
                        xp: 1250,
                        percentile: 85,
                    },
                }),
            });

            const data = await getMyRank();

            expect(data.success).toBe(true);
            expect(data.data.rank).toBe(15);
            expect(data.data.percentile).toBe(85);
        });

        it('should get rank by type', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { rank: 8, streak: 7 },
                }),
            });

            await getMyRank('streak');

            expect(mockFetch).toHaveBeenCalledWith('/api/leaderboard/me?type=streak');
        });
    });
});

describe('XP API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // XP History Tests
    // ========================================
    describe('GET /api/xp/history', () => {
        it('should get XP history', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        totalXP: 1250,
                        history: [
                            {
                                id: 'xp-1',
                                amount: 50,
                                reason: 'Completed lesson',
                                source: 'ACADEMY',
                                createdAt: '2025-01-15T10:00:00Z',
                            },
                            {
                                id: 'xp-2',
                                amount: 100,
                                reason: 'Passed quiz',
                                source: 'QUIZ',
                                createdAt: '2025-01-15T09:00:00Z',
                            },
                            {
                                id: 'xp-3',
                                amount: 10,
                                reason: 'Daily check-in',
                                source: 'STREAK',
                                createdAt: '2025-01-15T08:00:00Z',
                            },
                        ],
                    },
                }),
            });

            const data = await getXPHistory();

            expect(data.success).toBe(true);
            expect(data.data.history).toHaveLength(3);
        });

        it('should filter by period', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { totalXP: 200, history: [] },
                }),
            });

            await getXPHistory('week');

            expect(mockFetch).toHaveBeenCalledWith('/api/xp/history?period=week');
        });
    });
});

describe('Badges API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // Get Badges Tests
    // ========================================
    describe('GET /api/badges', () => {
        it('should get user badges', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        earned: [
                            { id: 'badge-1', name: 'Early Adopter', icon: '🌟', earnedAt: '2025-01-01' },
                            { id: 'badge-2', name: 'Academy Graduate', icon: '🎓', earnedAt: '2025-01-10' },
                        ],
                        equipped: [
                            { slot: 1, badge: { id: 'badge-1', name: 'Early Adopter', icon: '🌟' } },
                            { slot: 2, badge: null },
                            { slot: 3, badge: null },
                        ],
                        available: [
                            { id: 'badge-3', name: 'Streak Master', icon: '🔥', requirement: '30 day streak' },
                        ],
                    },
                }),
            });

            const data = await getBadges();

            expect(data.success).toBe(true);
            expect(data.data.earned).toHaveLength(2);
        });
    });

    // ========================================
    // Equip Badge Tests
    // ========================================
    describe('POST /api/badges/equip', () => {
        it('should equip badge to slot', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        slot: 2,
                        badge: { id: 'badge-2', name: 'Academy Graduate', icon: '🎓' },
                    },
                }),
            });

            const data = await equipBadge('badge-2', 2);

            expect(mockFetch).toHaveBeenCalledWith('/api/badges/equip', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ badgeId: 'badge-2', slot: 2 }),
            });
            expect(data.success).toBe(true);
        });

        it('should not equip unearned badge', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'You have not earned this badge yet',
                }),
            });

            const data = await equipBadge('badge-3', 1);

            expect(data.success).toBe(false);
        });
    });
});
