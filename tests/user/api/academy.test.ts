/**
 * Academy API Tests (User Progress)
 * @module tests/user/api/academy.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockAcademyLevels, mockLessons, mockQuizAttempts, mockUser } from '../__mocks__/data';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// API helper functions
async function getAcademyProgress() {
    const response = await fetch('/api/academy/progress');
    return response.json();
}

async function getLevelDetails(levelId: string) {
    const response = await fetch(`/api/academy/levels/${levelId}`);
    return response.json();
}

async function getLessons(levelId: string) {
    const response = await fetch(`/api/academy/levels/${levelId}/lessons`);
    return response.json();
}

async function getLessonById(lessonId: string) {
    const response = await fetch(`/api/academy/lessons/${lessonId}`);
    return response.json();
}

async function startLesson(lessonId: string) {
    const response = await fetch(`/api/academy/lessons/${lessonId}/start`, {
        method: 'POST',
    });
    return response.json();
}

async function completeLesson(lessonId: string, data: { timeSpent: number }) {
    const response = await fetch(`/api/academy/lessons/${lessonId}/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

async function getQuiz(lessonId: string) {
    const response = await fetch(`/api/academy/lessons/${lessonId}/quiz`);
    return response.json();
}

async function submitQuiz(lessonId: string, answers: { questionId: string; answer: string }[]) {
    const response = await fetch(`/api/academy/lessons/${lessonId}/quiz`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers }),
    });
    return response.json();
}

async function getQuizAttempts(lessonId: string) {
    const response = await fetch(`/api/academy/lessons/${lessonId}/quiz/attempts`);
    return response.json();
}

async function getCertificates() {
    const response = await fetch('/api/academy/certificates');
    return response.json();
}

async function downloadCertificate(levelId: string) {
    const response = await fetch(`/api/academy/certificates/${levelId}/download`);
    return response.blob();
}

async function getLearningStats() {
    const response = await fetch('/api/academy/stats');
    return response.json();
}

describe('Academy API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // Progress Tests
    // ========================================
    describe('GET /api/academy/progress', () => {
        it('should get user academy progress', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        levels: mockAcademyLevels,
                        currentLevel: 'Beginner',
                        totalXP: 1250,
                        nextLevelXP: 2000,
                    },
                }),
            });

            const data = await getAcademyProgress();

            expect(mockFetch).toHaveBeenCalledWith('/api/academy/progress');
            expect(data.success).toBe(true);
            expect(data.data.levels).toHaveLength(3);
        });

        it('should show completed levels', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { levels: mockAcademyLevels },
                }),
            });

            const data = await getAcademyProgress();

            const beginner = data.data.levels.find((l: any) => l.name === 'Beginner');
            expect(beginner.isCompleted).toBe(true);
            expect(beginner.progress).toBe(100);
        });

        it('should show current level progress', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { levels: mockAcademyLevels },
                }),
            });

            const data = await getAcademyProgress();

            const intermediate = data.data.levels.find((l: any) => l.name === 'Intermediate');
            expect(intermediate.isUnlocked).toBe(true);
            expect(intermediate.progress).toBe(80);
        });
    });

    // ========================================
    // Level Details Tests
    // ========================================
    describe('GET /api/academy/levels/:id', () => {
        it('should get level details', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockAcademyLevels[0],
                }),
            });

            const data = await getLevelDetails('level-1');

            expect(data.success).toBe(true);
            expect(data.data.name).toBe('Beginner');
        });

        it('should return 403 for locked level', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 403,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Level is locked. Complete previous level first.',
                }),
            });

            const data = await getLevelDetails('level-3');

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Lessons Tests
    // ========================================
    describe('GET /api/academy/levels/:id/lessons', () => {
        it('should get lessons for a level', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockLessons,
                }),
            });

            const data = await getLessons('level-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/academy/levels/level-1/lessons');
            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(3);
        });

        it('should show lesson completion status', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockLessons,
                }),
            });

            const data = await getLessons('level-1');

            const completedLesson = data.data.find((l: any) => l.isCompleted);
            expect(completedLesson).toBeDefined();
            expect(completedLesson.completedAt).toBeDefined();
        });
    });

    describe('GET /api/academy/lessons/:id', () => {
        it('should get lesson by id', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockLessons[0],
                }),
            });

            const data = await getLessonById('lesson-1');

            expect(data.success).toBe(true);
            expect(data.data.title).toBe('What is Forex?');
        });
    });

    describe('POST /api/academy/lessons/:id/start', () => {
        it('should start a lesson', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        ...mockLessons[1],
                        startedAt: '2025-01-15T10:00:00Z',
                    },
                }),
            });

            const data = await startLesson('lesson-2');

            expect(mockFetch).toHaveBeenCalledWith('/api/academy/lessons/lesson-2/start', {
                method: 'POST',
            });
            expect(data.success).toBe(true);
            expect(data.data.startedAt).toBeDefined();
        });
    });

    describe('POST /api/academy/lessons/:id/complete', () => {
        it('should complete a lesson', async () => {
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

            const data = await completeLesson('lesson-2', { timeSpent: 1800 });

            expect(data.success).toBe(true);
            expect(data.data.xpEarned).toBe(50);
        });

        it('should require quiz completion first', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Please complete the quiz first',
                }),
            });

            const data = await completeLesson('lesson-2', { timeSpent: 1800 });

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Quiz Tests
    // ========================================
    describe('GET /api/academy/lessons/:id/quiz', () => {
        it('should get quiz questions', async () => {
            const mockQuiz = {
                id: 'quiz-1',
                lessonId: 'lesson-1',
                questions: [
                    {
                        id: 'q1',
                        question: 'What is a pip?',
                        options: ['0.01%', '0.0001', '1%', '0.001'],
                        type: 'MULTIPLE_CHOICE',
                    },
                    {
                        id: 'q2',
                        question: 'True or False: EUR/USD is a major pair',
                        options: ['True', 'False'],
                        type: 'TRUE_FALSE',
                    },
                ],
                passingScore: 80,
            };

            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockQuiz,
                }),
            });

            const data = await getQuiz('lesson-1');

            expect(data.success).toBe(true);
            expect(data.data.questions).toHaveLength(2);
            expect(data.data.passingScore).toBe(80);
        });
    });

    describe('POST /api/academy/lessons/:id/quiz', () => {
        it('should submit quiz and pass', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        passed: true,
                        score: 90,
                        correctAnswers: 9,
                        totalQuestions: 10,
                        xpEarned: 100,
                    },
                }),
            });

            const data = await submitQuiz('lesson-1', [
                { questionId: 'q1', answer: '0.0001' },
                { questionId: 'q2', answer: 'True' },
            ]);

            expect(data.success).toBe(true);
            expect(data.data.passed).toBe(true);
            expect(data.data.xpEarned).toBe(100);
        });

        it('should submit quiz and fail', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        passed: false,
                        score: 50,
                        correctAnswers: 5,
                        totalQuestions: 10,
                        xpEarned: 0,
                        canRetry: true,
                        nextRetryAt: null,
                    },
                }),
            });

            const data = await submitQuiz('lesson-1', [
                { questionId: 'q1', answer: '0.01%' },
            ]);

            expect(data.data.passed).toBe(false);
            expect(data.data.canRetry).toBe(true);
        });

        it('should limit quiz attempts', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 429,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Maximum attempts reached. Please wait 24 hours.',
                    nextRetryAt: '2025-01-16T10:00:00Z',
                }),
            });

            const data = await submitQuiz('lesson-1', []);

            expect(data.success).toBe(false);
            expect(data.nextRetryAt).toBeDefined();
        });
    });

    describe('GET /api/academy/lessons/:id/quiz/attempts', () => {
        it('should get quiz attempts history', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockQuizAttempts,
                }),
            });

            const data = await getQuizAttempts('lesson-1');

            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(2);
        });
    });

    // ========================================
    // Certificates Tests
    // ========================================
    describe('GET /api/academy/certificates', () => {
        it('should get earned certificates', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [
                        {
                            id: 'cert-1',
                            levelId: 'level-1',
                            levelName: 'Beginner',
                            earnedAt: '2025-01-01T12:00:00Z',
                            certificateUrl: '/certificates/cert-1.pdf',
                        },
                    ],
                }),
            });

            const data = await getCertificates();

            expect(data.success).toBe(true);
            expect(data.data).toHaveLength(1);
        });
    });

    describe('GET /api/academy/certificates/:id/download', () => {
        it('should download certificate PDF', async () => {
            const mockBlob = new Blob(['PDF content'], { type: 'application/pdf' });
            mockFetch.mockResolvedValueOnce({
                ok: true,
                blob: () => Promise.resolve(mockBlob),
            });

            const blob = await downloadCertificate('level-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/academy/certificates/level-1/download');
            expect(blob).toBeInstanceOf(Blob);
        });
    });

    // ========================================
    // Learning Stats Tests
    // ========================================
    describe('GET /api/academy/stats', () => {
        it('should get learning statistics', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: {
                        totalXP: 1250,
                        lessonsCompleted: 8,
                        totalLessons: 20,
                        quizzesPassed: 6,
                        averageQuizScore: 85,
                        timeSpent: 7200, // seconds
                        currentStreak: 5,
                        longestStreak: 12,
                    },
                }),
            });

            const data = await getLearningStats();

            expect(data.success).toBe(true);
            expect(data.data.totalXP).toBe(1250);
            expect(data.data.lessonsCompleted).toBe(8);
        });
    });
});
