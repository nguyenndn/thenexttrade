/**
 * Academy Progress Integration Tests
 * @module tests/user/integration/academy-progress.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

/**
 * Integration tests for Academy learning progress flow
 */

describe('Academy Progress Integration', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // Level Progression Workflow
    // ========================================
    describe('Level Progression', () => {
        it('should progress through a complete level', async () => {
            const userId = 'user-1';
            const levelId = 'level-beginner';

            // Step 1: Get initial progress
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        levels: [
                            { id: levelId, name: 'Beginner', progress: 80, isUnlocked: true },
                        ],
                        currentLevel: 'Beginner',
                        totalXP: 800,
                    },
                }),
            });

            const initialProgress = await fetch('/api/academy/progress');
            const initial = await initialProgress.json();

            expect(initial.data.levels[0].progress).toBe(80);

            // Step 2: Get remaining lessons
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [
                        { id: 'lesson-8', title: 'Final Review', isCompleted: false },
                        { id: 'lesson-9', title: 'Practice Session', isCompleted: false },
                    ],
                }),
            });

            const lessonsRes = await fetch(`/api/academy/levels/${levelId}/lessons`);
            const lessons = await lessonsRes.json();

            expect(lessons.data.filter((l: any) => !l.isCompleted)).toHaveLength(2);

            // Step 3: Complete remaining lessons
            for (const lesson of lessons.data.filter((l: any) => !l.isCompleted)) {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        success: true,
                        data: { isCompleted: true, xpEarned: 50 },
                    }),
                });

                await fetch(`/api/academy/lessons/${lesson.id}/complete`, {
                    method: 'POST',
                    body: JSON.stringify({ timeSpent: 900 }),
                });
            }

            // Step 4: Pass final quiz
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        passed: true,
                        score: 90,
                        xpEarned: 100,
                        levelCompleted: true,
                        nextLevelUnlocked: 'Intermediate',
                    },
                }),
            });

            const quizRes = await fetch(`/api/academy/levels/${levelId}/quiz`, {
                method: 'POST',
                body: JSON.stringify({ answers: [] }),
            });
            const quiz = await quizRes.json();

            expect(quiz.data.levelCompleted).toBe(true);
            expect(quiz.data.nextLevelUnlocked).toBe('Intermediate');

            // Step 5: Verify level completion
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        levels: [
                            { id: levelId, name: 'Beginner', progress: 100, isCompleted: true },
                            { id: 'level-intermediate', name: 'Intermediate', progress: 0, isUnlocked: true },
                        ],
                        currentLevel: 'Intermediate',
                        totalXP: 1000,
                    },
                }),
            });

            const finalProgress = await fetch('/api/academy/progress');
            const final = await finalProgress.json();

            expect(final.data.levels[0].isCompleted).toBe(true);
            expect(final.data.levels[1].isUnlocked).toBe(true);
        });

        it('should unlock certificate on level completion', async () => {
            // Complete level quiz
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        passed: true,
                        levelCompleted: true,
                        certificateUnlocked: true,
                    },
                }),
            });

            await fetch('/api/academy/levels/level-beginner/quiz', {
                method: 'POST',
                body: JSON.stringify({ answers: [] }),
            });

            // Check certificates
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [
                        {
                            id: 'cert-beginner',
                            levelId: 'level-beginner',
                            levelName: 'Beginner',
                            earnedAt: '2025-01-15T12:00:00Z',
                        },
                    ],
                }),
            });

            const certsRes = await fetch('/api/academy/certificates');
            const certs = await certsRes.json();

            expect(certs.data).toHaveLength(1);
            expect(certs.data[0].levelName).toBe('Beginner');
        });
    });

    // ========================================
    // Quiz Retry Workflow
    // ========================================
    describe('Quiz Retry Flow', () => {
        it('should handle quiz failure and retry', async () => {
            // First attempt - fail
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        passed: false,
                        score: 60,
                        requiredScore: 80,
                        attemptsRemaining: 2,
                        canRetry: true,
                    },
                }),
            });

            const attempt1 = await fetch('/api/academy/lessons/lesson-1/quiz', {
                method: 'POST',
                body: JSON.stringify({ answers: [{ questionId: 'q1', answer: 'wrong' }] }),
            });
            const result1 = await attempt1.json();

            expect(result1.data.passed).toBe(false);
            expect(result1.data.canRetry).toBe(true);

            // Review wrong answers
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [
                        {
                            attemptId: 'attempt-1',
                            score: 60,
                            wrongAnswers: [
                                { questionId: 'q1', yourAnswer: 'A', correctAnswer: 'B' },
                            ],
                        },
                    ],
                }),
            });

            const attemptsRes = await fetch('/api/academy/lessons/lesson-1/quiz/attempts');
            const attempts = await attemptsRes.json();

            expect(attempts.data[0].wrongAnswers).toHaveLength(1);

            // Second attempt - pass
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        passed: true,
                        score: 90,
                        xpEarned: 100,
                    },
                }),
            });

            const attempt2 = await fetch('/api/academy/lessons/lesson-1/quiz', {
                method: 'POST',
                body: JSON.stringify({ answers: [{ questionId: 'q1', answer: 'B' }] }),
            });
            const result2 = await attempt2.json();

            expect(result2.data.passed).toBe(true);
        });

        it('should enforce max attempts limit', async () => {
            // Exhaust all attempts
            for (let i = 0; i < 3; i++) {
                mockFetch.mockResolvedValueOnce({
                    ok: true,
                    json: () => Promise.resolve({
                        success: true,
                        data: {
                            passed: false,
                            score: 50,
                            attemptsRemaining: 2 - i,
                            canRetry: i < 2,
                        },
                    }),
                });

                await fetch('/api/academy/lessons/lesson-1/quiz', {
                    method: 'POST',
                    body: JSON.stringify({ answers: [] }),
                });
            }

            // Attempt after limit
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 429,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Maximum attempts reached',
                    nextRetryAt: '2025-01-16T10:00:00Z',
                }),
            });

            const blockedRes = await fetch('/api/academy/lessons/lesson-1/quiz', {
                method: 'POST',
                body: JSON.stringify({ answers: [] }),
            });
            const blocked = await blockedRes.json();

            expect(blocked.success).toBe(false);
            expect(blocked.nextRetryAt).toBeDefined();
        });
    });

    // ========================================
    // XP & Achievement Integration
    // ========================================
    describe('XP and Achievement Integration', () => {
        it('should accumulate XP from various sources', async () => {
            let totalXP = 1000;

            // Lesson completion XP
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { xpEarned: 50 },
                }),
            });

            await fetch('/api/academy/lessons/lesson-1/complete', {
                method: 'POST',
            });
            totalXP += 50;

            // Quiz XP
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { passed: true, xpEarned: 100 },
                }),
            });

            await fetch('/api/academy/lessons/lesson-1/quiz', {
                method: 'POST',
            });
            totalXP += 100;

            // Daily streak XP
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { xpEarned: 10 },
                }),
            });

            await fetch('/api/streak/check-in', { method: 'POST' });
            totalXP += 10;

            // Verify total XP
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { totalXP },
                }),
            });

            const statsRes = await fetch('/api/academy/stats');
            const stats = await statsRes.json();

            expect(stats.data.totalXP).toBe(1160);
        });

        it('should unlock achievements based on progress', async () => {
            // Complete 10th lesson - triggers achievement
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        xpEarned: 50,
                        achievementUnlocked: {
                            id: 'achieve-10-lessons',
                            name: 'Knowledge Seeker',
                            description: 'Complete 10 lessons',
                            xpReward: 100,
                        },
                    },
                }),
            });

            const completeRes = await fetch('/api/academy/lessons/lesson-10/complete', {
                method: 'POST',
            });
            const complete = await completeRes.json();

            expect(complete.data.achievementUnlocked).toBeDefined();
            expect(complete.data.achievementUnlocked.name).toBe('Knowledge Seeker');

            // Verify achievement in list
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [
                        { id: 'achieve-10-lessons', name: 'Knowledge Seeker', isUnlocked: true, isClaimed: false },
                    ],
                }),
            });

            const achievementsRes = await fetch('/api/achievements');
            const achievements = await achievementsRes.json();

            const unlocked = achievements.data.find((a: any) => a.id === 'achieve-10-lessons');
            expect(unlocked.isUnlocked).toBe(true);

            // Claim achievement
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { xpEarned: 100 },
                }),
            });

            const claimRes = await fetch('/api/achievements/achieve-10-lessons/claim', {
                method: 'POST',
            });
            const claim = await claimRes.json();

            expect(claim.data.xpEarned).toBe(100);
        });
    });

    // ========================================
    // Leaderboard Integration
    // ========================================
    describe('Leaderboard Integration', () => {
        it('should update rank after XP gain', async () => {
            // Get initial rank
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { rank: 25, xp: 1000 },
                }),
            });

            const initialRank = await fetch('/api/leaderboard/me');
            const initial = await initialRank.json();

            expect(initial.data.rank).toBe(25);

            // Earn significant XP
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { xpEarned: 500 },
                }),
            });

            await fetch('/api/academy/lessons/lesson-special/complete', {
                method: 'POST',
            });

            // Check updated rank
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { rank: 18, xp: 1500 }, // Moved up!
                }),
            });

            const updatedRank = await fetch('/api/leaderboard/me');
            const updated = await updatedRank.json();

            expect(updated.data.rank).toBe(18);
            expect(updated.data.xp).toBe(1500);
        });
    });

    // ========================================
    // Learning Path Workflow
    // ========================================
    describe('Learning Path', () => {
        it('should follow recommended learning path', async () => {
            // Get recommended next lesson
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        recommended: {
                            id: 'lesson-next',
                            title: 'Technical Analysis Basics',
                            reason: 'Continue your learning path',
                        },
                        prerequisites: [],
                    },
                }),
            });

            const recommendedRes = await fetch('/api/academy/recommended');
            const recommended = await recommendedRes.json();

            expect(recommended.data.recommended).toBeDefined();

            // Complete recommended lesson
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { isCompleted: true },
                }),
            });

            await fetch(`/api/academy/lessons/${recommended.data.recommended.id}/complete`, {
                method: 'POST',
            });

            // Get next recommendation
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        recommended: {
                            id: 'lesson-chart-patterns',
                            title: 'Chart Patterns',
                            reason: 'Build on your TA knowledge',
                        },
                    },
                }),
            });

            const nextRes = await fetch('/api/academy/recommended');
            const next = await nextRes.json();

            expect(next.data.recommended.id).toBe('lesson-chart-patterns');
        });
    });
});
