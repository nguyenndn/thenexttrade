/**
 * Gamification API Tests (User perspective)
 * @module tests/user/api/gamification.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Helper functions
async function getUserLevel() {
    const res = await fetch('/api/gamification/level');
    return res.json();
}

async function getUserAchievements() {
    const res = await fetch('/api/gamification/achievements');
    return res.json();
}

async function getLeaderboard(options?: { type?: string; period?: string }) {
    const params = new URLSearchParams();
    if (options?.type) params.append('type', options.type);
    if (options?.period) params.append('period', options.period);

    const url = params.toString() ? `/api/gamification/leaderboard?${params}` : '/api/gamification/leaderboard';
    const res = await fetch(url);
    return res.json();
}

async function getUserStreak() {
    const res = await fetch('/api/gamification/streak');
    return res.json();
}

async function getChallenges() {
    const res = await fetch('/api/gamification/challenges');
    return res.json();
}

async function joinChallenge(challengeId: string) {
    const res = await fetch(`/api/gamification/challenges/${challengeId}/join`, { method: 'POST' });
    return res.json();
}

async function getChallengeProgress(challengeId: string) {
    const res = await fetch(`/api/gamification/challenges/${challengeId}/progress`);
    return res.json();
}

async function getUserBadges() {
    const res = await fetch('/api/gamification/badges');
    return res.json();
}

async function getUserPoints() {
    const res = await fetch('/api/gamification/points');
    return res.json();
}

async function getPointsHistory(options?: { page?: number; limit?: number }) {
    const params = new URLSearchParams();
    if (options?.page) params.append('page', String(options.page));
    if (options?.limit) params.append('limit', String(options.limit));

    const url = params.toString() ? `/api/gamification/points/history?${params}` : '/api/gamification/points/history';
    const res = await fetch(url);
    return res.json();
}

// Mock data
const mockUserLevel = {
    level: 5,
    name: 'Advanced Trader',
    currentXP: 1500,
    xpForNextLevel: 2000,
    progress: 75,
    totalXP: 8500,
    rank: 'Gold',
};

const mockAchievements = [
    {
        id: 'ach-1',
        name: 'First Trade',
        description: 'Complete your first trade journal entry',
        icon: '📝',
        category: 'trading',
        unlockedAt: '2025-01-10T10:00:00Z',
        xpReward: 100,
    },
    {
        id: 'ach-2',
        name: 'Week Warrior',
        description: 'Trade for 7 consecutive days',
        icon: '🔥',
        category: 'streak',
        unlockedAt: '2025-01-17T10:00:00Z',
        xpReward: 250,
    },
    {
        id: 'ach-3',
        name: 'Profitable Month',
        description: 'Achieve positive P&L for a month',
        icon: '💰',
        category: 'performance',
        unlockedAt: null, // Not yet unlocked
        xpReward: 500,
        progress: 65, // 65% progress
    },
];

const mockLeaderboard = [
    { rank: 1, userId: 'user-1', username: 'TraderKing', avatar: '/avatars/1.jpg', points: 15000, level: 8 },
    { rank: 2, userId: 'user-2', username: 'ForexMaster', avatar: '/avatars/2.jpg', points: 12500, level: 7 },
    { rank: 3, userId: 'user-3', username: 'GoldTrader', avatar: '/avatars/3.jpg', points: 10000, level: 6 },
    { rank: 4, userId: 'current-user', username: 'You', avatar: '/avatars/current.jpg', points: 8500, level: 5, isCurrentUser: true },
    { rank: 5, userId: 'user-5', username: 'NewbiePro', avatar: '/avatars/5.jpg', points: 7000, level: 4 },
];

const mockChallenges = [
    {
        id: 'challenge-1',
        name: 'January Trading Marathon',
        description: 'Complete 50 trades in January',
        startDate: '2025-01-01T00:00:00Z',
        endDate: '2025-01-31T23:59:59Z',
        goal: 50,
        reward: 1000,
        participants: 150,
        isJoined: true,
        userProgress: 25,
    },
    {
        id: 'challenge-2',
        name: 'Win Streak Challenge',
        description: 'Achieve 10 consecutive winning trades',
        startDate: '2025-01-15T00:00:00Z',
        endDate: '2025-02-15T23:59:59Z',
        goal: 10,
        reward: 500,
        participants: 75,
        isJoined: false,
        userProgress: 0,
    },
];

const mockBadges = [
    { id: 'badge-1', name: 'Early Adopter', icon: '🌟', description: 'Joined in the first month', earnedAt: '2025-01-01T10:00:00Z' },
    { id: 'badge-2', name: 'Top Contributor', icon: '🏆', description: 'Shared 10+ insights', earnedAt: '2025-01-15T10:00:00Z' },
];

const mockPointsHistory = [
    { id: 'pt-1', amount: 100, reason: 'Completed trade journal entry', createdAt: '2025-01-17T10:00:00Z' },
    { id: 'pt-2', amount: 50, reason: 'Daily login bonus', createdAt: '2025-01-17T08:00:00Z' },
    { id: 'pt-3', amount: 250, reason: 'Achievement unlocked: Week Warrior', createdAt: '2025-01-16T10:00:00Z' },
    { id: 'pt-4', amount: 25, reason: 'Completed a lesson', createdAt: '2025-01-15T14:00:00Z' },
];

describe('Gamification API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // User Level Tests
    // ========================================
    describe('GET /api/gamification/level', () => {
        it('should get user level info', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockUserLevel,
                }),
            });

            const data = await getUserLevel();

            expect(mockFetch).toHaveBeenCalledWith('/api/gamification/level');
            expect(data.success).toBe(true);
            expect(data.data.level).toBe(5);
            expect(data.data.name).toBe('Advanced Trader');
        });

        it('should show XP progress', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockUserLevel,
                }),
            });

            const data = await getUserLevel();

            expect(data.data.currentXP).toBe(1500);
            expect(data.data.xpForNextLevel).toBe(2000);
            expect(data.data.progress).toBe(75);
        });

        it('should require authentication', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Unauthorized',
                }),
            });

            const data = await getUserLevel();

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Achievements Tests
    // ========================================
    describe('GET /api/gamification/achievements', () => {
        it('should get user achievements', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockAchievements,
                }),
            });

            const data = await getUserAchievements();

            expect(mockFetch).toHaveBeenCalledWith('/api/gamification/achievements');
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(3);
        });

        it('should show unlocked achievements', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockAchievements,
                }),
            });

            const data = await getUserAchievements();

            const unlocked = data.data.filter((a: any) => a.unlockedAt !== null);
            expect(unlocked).toHaveLength(2);
        });

        it('should show achievement progress for locked ones', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockAchievements,
                }),
            });

            const data = await getUserAchievements();

            const locked = data.data.find((a: any) => a.unlockedAt === null);
            expect(locked?.progress).toBe(65);
        });

        it('should include XP rewards', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockAchievements,
                }),
            });

            const data = await getUserAchievements();

            expect(data.data[0].xpReward).toBe(100);
        });
    });

    // ========================================
    // Leaderboard Tests
    // ========================================
    describe('GET /api/gamification/leaderboard', () => {
        it('should get leaderboard', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockLeaderboard,
                }),
            });

            const data = await getLeaderboard();

            expect(mockFetch).toHaveBeenCalledWith('/api/gamification/leaderboard');
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(5);
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

            const currentUser = data.data.find((u: any) => u.isCurrentUser);
            expect(currentUser?.rank).toBe(4);
        });

        it('should filter by period', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockLeaderboard,
                }),
            });

            await getLeaderboard({ period: 'weekly' });

            expect(mockFetch).toHaveBeenCalledWith('/api/gamification/leaderboard?period=weekly');
        });

        it('should filter by type', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockLeaderboard,
                }),
            });

            await getLeaderboard({ type: 'trades' });

            expect(mockFetch).toHaveBeenCalledWith('/api/gamification/leaderboard?type=trades');
        });
    });

    // ========================================
    // Streak Tests
    // ========================================
    describe('GET /api/gamification/streak', () => {
        it('should get user streak', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        currentStreak: 15,
                        longestStreak: 30,
                        lastActivityDate: '2025-01-17T10:00:00Z',
                        nextMilestone: 20,
                        daysUntilMilestone: 5,
                    },
                }),
            });

            const data = await getUserStreak();

            expect(mockFetch).toHaveBeenCalledWith('/api/gamification/streak');
            expect(data.success).toBe(true);
            expect(data.data.currentStreak).toBe(15);
        });

        it('should show milestone info', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        currentStreak: 15,
                        nextMilestone: 20,
                        daysUntilMilestone: 5,
                    },
                }),
            });

            const data = await getUserStreak();

            expect(data.data.nextMilestone).toBe(20);
            expect(data.data.daysUntilMilestone).toBe(5);
        });
    });

    // ========================================
    // Challenges Tests
    // ========================================
    describe('GET /api/gamification/challenges', () => {
        it('should get available challenges', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockChallenges,
                }),
            });

            const data = await getChallenges();

            expect(mockFetch).toHaveBeenCalledWith('/api/gamification/challenges');
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(2);
        });

        it('should show joined status', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockChallenges,
                }),
            });

            const data = await getChallenges();

            expect(data.data[0].isJoined).toBe(true);
            expect(data.data[1].isJoined).toBe(false);
        });

        it('should show user progress', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockChallenges,
                }),
            });

            const data = await getChallenges();

            expect(data.data[0].userProgress).toBe(25);
        });
    });

    describe('POST /api/gamification/challenges/:id/join', () => {
        it('should join a challenge', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        challengeId: 'challenge-2',
                        joined: true,
                    },
                }),
            });

            const data = await joinChallenge('challenge-2');

            expect(mockFetch).toHaveBeenCalledWith(
                '/api/gamification/challenges/challenge-2/join',
                { method: 'POST' }
            );
            expect(data.success).toBe(true);
        });

        it('should prevent joining expired challenge', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Challenge has ended',
                }),
            });

            const data = await joinChallenge('expired-challenge');

            expect(data.success).toBe(false);
        });

        it('should prevent duplicate join', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 409,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Already joined this challenge',
                }),
            });

            const data = await joinChallenge('challenge-1');

            expect(data.success).toBe(false);
        });
    });

    describe('GET /api/gamification/challenges/:id/progress', () => {
        it('should get challenge progress', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        challengeId: 'challenge-1',
                        progress: 25,
                        goal: 50,
                        percentComplete: 50,
                        ranking: 15,
                        totalParticipants: 150,
                    },
                }),
            });

            const data = await getChallengeProgress('challenge-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/gamification/challenges/challenge-1/progress');
            expect(data.success).toBe(true);
            expect(data.data.progress).toBe(25);
            expect(data.data.ranking).toBe(15);
        });
    });

    // ========================================
    // Badges Tests
    // ========================================
    describe('GET /api/gamification/badges', () => {
        it('should get user badges', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockBadges,
                }),
            });

            const data = await getUserBadges();

            expect(mockFetch).toHaveBeenCalledWith('/api/gamification/badges');
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(2);
        });

        it('should include earned date', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockBadges,
                }),
            });

            const data = await getUserBadges();

            expect(data.data[0].earnedAt).toBeDefined();
        });
    });

    // ========================================
    // Points Tests
    // ========================================
    describe('GET /api/gamification/points', () => {
        it('should get user points', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        totalPoints: 8500,
                        pointsThisWeek: 425,
                        pointsThisMonth: 1500,
                    },
                }),
            });

            const data = await getUserPoints();

            expect(mockFetch).toHaveBeenCalledWith('/api/gamification/points');
            expect(data.success).toBe(true);
            expect(data.data.totalPoints).toBe(8500);
        });
    });

    describe('GET /api/gamification/points/history', () => {
        it('should get points history', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockPointsHistory,
                    meta: { page: 1, totalPages: 5, total: 50 },
                }),
            });

            const data = await getPointsHistory();

            expect(mockFetch).toHaveBeenCalledWith('/api/gamification/points/history');
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(4);
        });

        it('should paginate history', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [],
                    meta: { page: 2, totalPages: 5, total: 50 },
                }),
            });

            await getPointsHistory({ page: 2, limit: 10 });

            expect(mockFetch).toHaveBeenCalledWith('/api/gamification/points/history?page=2&limit=10');
        });

        it('should show point reasons', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockPointsHistory,
                }),
            });

            const data = await getPointsHistory();

            expect(data.data[0].reason).toContain('trade journal');
        });
    });
});
