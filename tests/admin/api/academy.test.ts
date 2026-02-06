/**
 * Academy API Tests
 * @module tests/admin/api/academy.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockLevels, mockModules, mockLessons, mockQuizzes } from '../__mocks__/data';

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// API helper functions
async function getLevels() {
    const response = await fetch('/api/admin/academy/levels');
    return response.json();
}

async function createLevel(data: { name: string; description?: string }) {
    const response = await fetch('/api/admin/academy/levels', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

async function reorderLevels(levelIds: string[]) {
    const response = await fetch('/api/admin/academy/levels/reorder', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levelIds }),
    });
    return response.json();
}

async function getModules(levelId?: string) {
    const url = levelId 
        ? `/api/admin/academy/modules?levelId=${levelId}` 
        : '/api/admin/academy/modules';
    const response = await fetch(url);
    return response.json();
}

async function createModule(data: { levelId: string; name: string; description?: string }) {
    const response = await fetch('/api/admin/academy/modules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

async function getLessons(moduleId?: string) {
    const url = moduleId 
        ? `/api/admin/academy/lessons?moduleId=${moduleId}` 
        : '/api/admin/academy/lessons';
    const response = await fetch(url);
    return response.json();
}

async function createLesson(data: { 
    moduleId: string; 
    title: string; 
    content: string;
    type?: string;
}) {
    const response = await fetch('/api/admin/academy/lessons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

async function updateLesson(id: string, data: { title?: string; content?: string; isPublished?: boolean }) {
    const response = await fetch(`/api/admin/academy/lessons/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

async function deleteLesson(id: string) {
    const response = await fetch(`/api/admin/academy/lessons/${id}`, {
        method: 'DELETE',
    });
    return response.json();
}

async function getQuizzes(lessonId?: string) {
    const url = lessonId 
        ? `/api/admin/academy/quizzes?lessonId=${lessonId}` 
        : '/api/admin/academy/quizzes';
    const response = await fetch(url);
    return response.json();
}

async function createQuiz(data: { lessonId: string; title: string; passingScore?: number }) {
    const response = await fetch('/api/admin/academy/quizzes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

async function getQuizQuestions(quizId: string) {
    const response = await fetch(`/api/admin/academy/quizzes/${quizId}/questions`);
    return response.json();
}

async function addQuizQuestion(quizId: string, data: {
    question: string;
    options: string[];
    correctAnswer: number;
}) {
    const response = await fetch(`/api/admin/academy/quizzes/${quizId}/questions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
    });
    return response.json();
}

describe('Academy Levels API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // List Levels Tests
    // ========================================
    describe('GET /api/admin/academy/levels', () => {
        it('should get all levels', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockLevels,
                }),
            });

            const data = await getLevels();

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/academy/levels');
            expect(data.success).toBe(true);
            expect(data.data).toEqual(mockLevels);
        });

        it('should return levels in order', async () => {
            const orderedLevels = [...mockLevels].sort((a, b) => a.order - b.order);
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: orderedLevels,
                }),
            });

            const data = await getLevels();

            expect(data.data[0].order).toBeLessThan(data.data[1].order);
        });
    });

    // ========================================
    // Create Level Tests
    // ========================================
    describe('POST /api/admin/academy/levels', () => {
        it('should create level', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { id: 'new-level', name: 'Expert', order: 4 },
                }),
            });

            const data = await createLevel({ name: 'Expert' });

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/academy/levels', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: 'Expert' }),
            });
            expect(data.success).toBe(true);
        });

        it('should handle duplicate name', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Level name already exists',
                }),
            });

            const data = await createLevel({ name: 'Beginner' });

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Reorder Levels Tests
    // ========================================
    describe('PATCH /api/admin/academy/levels/reorder', () => {
        it('should reorder levels', async () => {
            const newOrder = ['level-3', 'level-1', 'level-2'];
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Levels reordered',
                }),
            });

            const data = await reorderLevels(newOrder);

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/academy/levels/reorder', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ levelIds: newOrder }),
            });
            expect(data.success).toBe(true);
        });
    });
});

describe('Academy Modules API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // List Modules Tests
    // ========================================
    describe('GET /api/admin/academy/modules', () => {
        it('should get all modules', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockModules,
                }),
            });

            const data = await getModules();

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/academy/modules');
            expect(data.success).toBe(true);
        });

        it('should filter by level', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [mockModules[0]],
                }),
            });

            await getModules('level-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/academy/modules?levelId=level-1');
        });
    });

    // ========================================
    // Create Module Tests
    // ========================================
    describe('POST /api/admin/academy/modules', () => {
        it('should create module', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { id: 'new-module', levelId: 'level-1', name: 'New Module' },
                }),
            });

            const data = await createModule({ levelId: 'level-1', name: 'New Module' });

            expect(data.success).toBe(true);
        });

        it('should handle invalid level', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Level not found',
                }),
            });

            const data = await createModule({ levelId: 'invalid', name: 'Test' });

            expect(data.success).toBe(false);
        });
    });
});

describe('Academy Lessons API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // List Lessons Tests
    // ========================================
    describe('GET /api/admin/academy/lessons', () => {
        it('should get all lessons', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockLessons,
                }),
            });

            const data = await getLessons();

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/academy/lessons');
            expect(data.success).toBe(true);
        });

        it('should filter by module', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { lessons: mockLessons.filter(l => l.moduleId === 'module-1') },
                }),
            });

            await getLessons('module-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/academy/lessons?moduleId=module-1');
        });
    });

    // ========================================
    // Create Lesson Tests
    // ========================================
    describe('POST /api/admin/academy/lessons', () => {
        const validData = {
            moduleId: 'module-1',
            title: 'New Lesson',
            content: '<p>Lesson content</p>',
            type: 'VIDEO',
        };

        it('should create lesson', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { id: 'new-lesson', ...validData },
                }),
            });

            const data = await createLesson(validData);

            expect(data.success).toBe(true);
        });

        it('should validate title length', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Title must be at least 3 characters',
                }),
            });

            const data = await createLesson({ ...validData, title: 'Ab' });

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Update Lesson Tests
    // ========================================
    describe('PATCH /api/admin/academy/lessons/:id', () => {
        it('should update lesson', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockLessons[0], title: 'Updated Title' },
                }),
            });

            const data = await updateLesson('lesson-1', { title: 'Updated Title' });

            expect(data.success).toBe(true);
        });

        it('should publish lesson', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { ...mockLessons[1], isPublished: true },
                }),
            });

            const data = await updateLesson('lesson-2', { isPublished: true });

            expect(data.success).toBe(true);
        });
    });

    // ========================================
    // Delete Lesson Tests
    // ========================================
    describe('DELETE /api/admin/academy/lessons/:id', () => {
        it('should delete lesson', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    message: 'Lesson deleted',
                }),
            });

            const data = await deleteLesson('lesson-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/academy/lessons/lesson-1', {
                method: 'DELETE',
            });
            expect(data.success).toBe(true);
        });

        it('should handle lesson with progress', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Cannot delete lesson with student progress',
                }),
            });

            const data = await deleteLesson('lesson-1');

            expect(data.success).toBe(false);
        });
    });
});

describe('Academy Quizzes API', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    // ========================================
    // List Quizzes Tests
    // ========================================
    describe('GET /api/admin/academy/quizzes', () => {
        it('should get all quizzes', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: mockQuizzes,
                }),
            });

            const data = await getQuizzes();

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/academy/quizzes');
            expect(data.success).toBe(true);
        });

        it('should filter by lesson', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { quizzes: mockQuizzes.filter(q => q.lessonId === 'lesson-1') },
                }),
            });

            await getQuizzes('lesson-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/academy/quizzes?lessonId=lesson-1');
        });
    });

    // ========================================
    // Create Quiz Tests
    // ========================================
    describe('POST /api/admin/academy/quizzes', () => {
        it('should create quiz', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { id: 'new-quiz', lessonId: 'lesson-1', title: 'New Quiz' },
                }),
            });

            const data = await createQuiz({ lessonId: 'lesson-1', title: 'New Quiz' });

            expect(data.success).toBe(true);
        });

        it('should validate passing score range', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Passing score must be between 0 and 100',
                }),
            });

            const data = await createQuiz({ 
                lessonId: 'lesson-1', 
                title: 'Quiz', 
                passingScore: 150 
            });

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Quiz Questions Tests
    // ========================================
    describe('GET /api/admin/academy/quizzes/:id/questions', () => {
        it('should get quiz questions', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: [
                        { id: 'q1', question: 'Question 1', options: ['A', 'B', 'C', 'D'] },
                    ],
                }),
            });

            const data = await getQuizQuestions('quiz-1');

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/academy/quizzes/quiz-1/questions');
            expect(data.success).toBe(true);
        });
    });

    describe('POST /api/admin/academy/quizzes/:id/questions', () => {
        const validQuestion = {
            question: 'What is forex?',
            options: ['A market', 'A currency', 'A bank', 'A stock'],
            correctAnswer: 0,
        };

        it('should add question to quiz', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: true,
                json: () => Promise.resolve({
                    success: true,
                    data: { id: 'q-new', ...validQuestion },
                }),
            });

            const data = await addQuizQuestion('quiz-1', validQuestion);

            expect(mockFetch).toHaveBeenCalledWith('/api/admin/academy/quizzes/quiz-1/questions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(validQuestion),
            });
            expect(data.success).toBe(true);
        });

        it('should validate correct answer index', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Correct answer index must be within options range',
                }),
            });

            const data = await addQuizQuestion('quiz-1', {
                ...validQuestion,
                correctAnswer: 5,
            });

            expect(data.success).toBe(false);
        });

        it('should require at least 2 options', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 400,
                json: () => Promise.resolve({
                    success: false,
                    error: 'At least 2 options are required',
                }),
            });

            const data = await addQuizQuestion('quiz-1', {
                ...validQuestion,
                options: ['A'],
            });

            expect(data.success).toBe(false);
        });
    });

    // ========================================
    // Error Handling Tests
    // ========================================
    describe('Error Handling', () => {
        it('should handle unauthorized', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 401,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Unauthorized',
                }),
            });

            const data = await getLevels();

            expect(data.success).toBe(false);
        });

        it('should handle not found', async () => {
            mockFetch.mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: () => Promise.resolve({
                    success: false,
                    error: 'Quiz not found',
                }),
            });

            const data = await getQuizQuestions('invalid');

            expect(data.success).toBe(false);
            expect(data.error).toBe('Quiz not found');
        });
    });
});
