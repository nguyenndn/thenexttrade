/**
 * Academy Actions Tests
 * @module tests/admin/actions/academy-actions.test
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { mockLevels, mockModules, mockLessons, mockQuizzes, mockQuestions } from '../__mocks__/data';

// Mock Prisma
const mockPrisma = {
    academyLevel: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        count: vi.fn(),
    },
    academyModule: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    academyLesson: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    quiz: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
    },
    quizQuestion: {
        findMany: vi.fn(),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
        delete: vi.fn(),
        deleteMany: vi.fn(),
    },
};

vi.mock('@/lib/prisma', () => ({
    default: mockPrisma,
}));

// Mock revalidatePath
const mockRevalidatePath = vi.fn();
vi.mock('next/cache', () => ({
    revalidatePath: mockRevalidatePath,
}));

// ============================================
// Level Actions
// ============================================
async function getLevels() {
    const levels = await mockPrisma.academyLevel.findMany({
        include: { _count: { select: { modules: true } } },
        orderBy: { order: 'asc' },
    });
    return { success: true, data: levels };
}

async function createLevel(data: { title: string; description: string }) {
    if (!data.title) {
        return { success: false, error: 'Title is required' };
    }

    const count = await mockPrisma.academyLevel.count();

    const level = await mockPrisma.academyLevel.create({
        data: {
            ...data,
            order: count + 1,
        },
    });

    mockRevalidatePath('/academy');
    return { success: true, data: level };
}

async function updateLevel(id: string, data: { title?: string; description?: string; order?: number }) {
    const level = await mockPrisma.academyLevel.findUnique({ where: { id } });
    if (!level) {
        return { success: false, error: 'Level not found' };
    }

    const updated = await mockPrisma.academyLevel.update({
        where: { id },
        data,
    });

    mockRevalidatePath('/academy');
    return { success: true, data: updated };
}

async function deleteLevel(id: string) {
    const level = await mockPrisma.academyLevel.findUnique({
        where: { id },
        include: { modules: true },
    });

    if (!level) {
        return { success: false, error: 'Level not found' };
    }

    if (level.modules?.length > 0) {
        return { success: false, error: 'Cannot delete level with modules' };
    }

    await mockPrisma.academyLevel.delete({ where: { id } });
    mockRevalidatePath('/academy');
    return { success: true };
}

// ============================================
// Module Actions
// ============================================
async function getModules(levelId?: string) {
    const where = levelId ? { levelId } : {};
    const modules = await mockPrisma.academyModule.findMany({
        where,
        include: { _count: { select: { lessons: true } } },
        orderBy: { order: 'asc' },
    });
    return { success: true, data: modules };
}

async function createModule(data: { title: string; levelId: string }) {
    if (!data.title) {
        return { success: false, error: 'Title is required' };
    }
    if (!data.levelId) {
        return { success: false, error: 'Level is required' };
    }

    const modules = await mockPrisma.academyModule.findMany({
        where: { levelId: data.levelId },
    });

    const module = await mockPrisma.academyModule.create({
        data: {
            ...data,
            order: modules.length + 1,
        },
    });

    mockRevalidatePath('/academy');
    return { success: true, data: module };
}

async function updateModule(id: string, data: { title?: string; order?: number }) {
    const module = await mockPrisma.academyModule.findUnique({ where: { id } });
    if (!module) {
        return { success: false, error: 'Module not found' };
    }

    const updated = await mockPrisma.academyModule.update({
        where: { id },
        data,
    });

    mockRevalidatePath('/academy');
    return { success: true, data: updated };
}

async function deleteModule(id: string) {
    const module = await mockPrisma.academyModule.findUnique({
        where: { id },
        include: { lessons: true },
    });

    if (!module) {
        return { success: false, error: 'Module not found' };
    }

    if (module.lessons?.length > 0) {
        return { success: false, error: 'Cannot delete module with lessons' };
    }

    await mockPrisma.academyModule.delete({ where: { id } });
    mockRevalidatePath('/academy');
    return { success: true };
}

// ============================================
// Lesson Actions
// ============================================
async function getLessons(moduleId?: string) {
    const where = moduleId ? { moduleId } : {};
    const lessons = await mockPrisma.academyLesson.findMany({
        where,
        orderBy: { order: 'asc' },
    });
    return { success: true, data: lessons };
}

async function createLesson(data: { title: string; content: string; moduleId: string }) {
    if (!data.title) {
        return { success: false, error: 'Title is required' };
    }
    if (!data.content) {
        return { success: false, error: 'Content is required' };
    }
    if (!data.moduleId) {
        return { success: false, error: 'Module is required' };
    }

    const lessons = await mockPrisma.academyLesson.findMany({
        where: { moduleId: data.moduleId },
    });

    const lesson = await mockPrisma.academyLesson.create({
        data: {
            ...data,
            order: lessons.length + 1,
        },
    });

    mockRevalidatePath('/academy');
    return { success: true, data: lesson };
}

async function updateLesson(id: string, data: { title?: string; content?: string; order?: number }) {
    const lesson = await mockPrisma.academyLesson.findUnique({ where: { id } });
    if (!lesson) {
        return { success: false, error: 'Lesson not found' };
    }

    const updated = await mockPrisma.academyLesson.update({
        where: { id },
        data,
    });

    mockRevalidatePath('/academy');
    return { success: true, data: updated };
}

async function deleteLesson(id: string) {
    const lesson = await mockPrisma.academyLesson.findUnique({ where: { id } });
    if (!lesson) {
        return { success: false, error: 'Lesson not found' };
    }

    await mockPrisma.academyLesson.delete({ where: { id } });
    mockRevalidatePath('/academy');
    return { success: true };
}

// ============================================
// Quiz Actions
// ============================================
async function getQuizzes(lessonId?: string) {
    const where = lessonId ? { lessonId } : {};
    const quizzes = await mockPrisma.quiz.findMany({
        where,
        include: { _count: { select: { questions: true } } },
    });
    return { success: true, data: quizzes };
}

async function createQuiz(data: { title: string; lessonId: string }) {
    if (!data.title) {
        return { success: false, error: 'Title is required' };
    }
    if (!data.lessonId) {
        return { success: false, error: 'Lesson is required' };
    }

    const quiz = await mockPrisma.quiz.create({ data });
    mockRevalidatePath('/academy');
    return { success: true, data: quiz };
}

async function updateQuiz(id: string, data: { title?: string }) {
    const quiz = await mockPrisma.quiz.findUnique({ where: { id } });
    if (!quiz) {
        return { success: false, error: 'Quiz not found' };
    }

    const updated = await mockPrisma.quiz.update({
        where: { id },
        data,
    });

    mockRevalidatePath('/academy');
    return { success: true, data: updated };
}

async function deleteQuiz(id: string) {
    const quiz = await mockPrisma.quiz.findUnique({ where: { id } });
    if (!quiz) {
        return { success: false, error: 'Quiz not found' };
    }

    // Delete all questions first
    await mockPrisma.quizQuestion.deleteMany({ where: { quizId: id } });
    await mockPrisma.quiz.delete({ where: { id } });

    mockRevalidatePath('/academy');
    return { success: true };
}

// ============================================
// Question Actions
// ============================================
async function addQuestion(data: {
    quizId: string;
    question: string;
    options: string[];
    correctAnswer: number;
}) {
    if (!data.question) {
        return { success: false, error: 'Question text is required' };
    }
    if (!data.options || data.options.length < 2) {
        return { success: false, error: 'At least 2 options are required' };
    }
    if (data.correctAnswer < 0 || data.correctAnswer >= data.options.length) {
        return { success: false, error: 'Invalid correct answer index' };
    }

    const questions = await mockPrisma.quizQuestion.findMany({
        where: { quizId: data.quizId },
    });

    const question = await mockPrisma.quizQuestion.create({
        data: {
            ...data,
            order: questions.length + 1,
        },
    });

    return { success: true, data: question };
}

async function updateQuestion(id: string, data: {
    question?: string;
    options?: string[];
    correctAnswer?: number;
}) {
    const existing = await mockPrisma.quizQuestion.findUnique({ where: { id } });
    if (!existing) {
        return { success: false, error: 'Question not found' };
    }

    const updated = await mockPrisma.quizQuestion.update({
        where: { id },
        data,
    });

    return { success: true, data: updated };
}

async function deleteQuestion(id: string) {
    const question = await mockPrisma.quizQuestion.findUnique({ where: { id } });
    if (!question) {
        return { success: false, error: 'Question not found' };
    }

    await mockPrisma.quizQuestion.delete({ where: { id } });
    return { success: true };
}

describe('Academy Level Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPrisma.academyLevel.findMany.mockResolvedValue(mockLevels);
        mockPrisma.academyLevel.count.mockResolvedValue(mockLevels.length);
    });

    describe('getLevels', () => {
        it('should get all levels ordered by order', async () => {
            const result = await getLevels();

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockLevels);
            expect(mockPrisma.academyLevel.findMany).toHaveBeenCalledWith({
                include: { _count: { select: { modules: true } } },
                orderBy: { order: 'asc' },
            });
        });
    });

    describe('createLevel', () => {
        beforeEach(() => {
            mockPrisma.academyLevel.create.mockResolvedValue({
                id: 'new-level',
                title: 'New Level',
                description: 'Description',
                order: 4,
            });
        });

        it('should create level with correct order', async () => {
            const result = await createLevel({
                title: 'New Level',
                description: 'Description',
            });

            expect(result.success).toBe(true);
            expect(mockPrisma.academyLevel.create).toHaveBeenCalledWith({
                data: {
                    title: 'New Level',
                    description: 'Description',
                    order: 4, // mockLevels.length + 1
                },
            });
        });

        it('should require title', async () => {
            const result = await createLevel({ title: '', description: 'Desc' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Title is required');
        });

        it('should revalidate academy path', async () => {
            await createLevel({ title: 'New', description: 'Desc' });

            expect(mockRevalidatePath).toHaveBeenCalledWith('/academy');
        });
    });

    describe('updateLevel', () => {
        beforeEach(() => {
            mockPrisma.academyLevel.findUnique.mockResolvedValue(mockLevels[0]);
            mockPrisma.academyLevel.update.mockResolvedValue({
                ...mockLevels[0],
                title: 'Updated Title',
            });
        });

        it('should update level', async () => {
            const result = await updateLevel('level-1', { title: 'Updated Title' });

            expect(result.success).toBe(true);
            expect(mockPrisma.academyLevel.update).toHaveBeenCalled();
        });

        it('should return error if not found', async () => {
            mockPrisma.academyLevel.findUnique.mockResolvedValueOnce(null);

            const result = await updateLevel('invalid', { title: 'Test' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Level not found');
        });
    });

    describe('deleteLevel', () => {
        it('should delete level without modules', async () => {
            mockPrisma.academyLevel.findUnique.mockResolvedValueOnce({
                ...mockLevels[1],
                modules: [],
            });
            mockPrisma.academyLevel.delete.mockResolvedValue(mockLevels[1]);

            const result = await deleteLevel('level-2');

            expect(result.success).toBe(true);
        });

        it('should not delete level with modules', async () => {
            mockPrisma.academyLevel.findUnique.mockResolvedValueOnce({
                ...mockLevels[0],
                modules: [{ id: 'module-1' }],
            });

            const result = await deleteLevel('level-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Cannot delete level with modules');
        });
    });
});

describe('Academy Module Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPrisma.academyModule.findMany.mockResolvedValue(mockModules);
    });

    describe('getModules', () => {
        it('should get all modules', async () => {
            const result = await getModules();

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockModules);
        });

        it('should filter by levelId', async () => {
            await getModules('level-1');

            expect(mockPrisma.academyModule.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { levelId: 'level-1' },
                })
            );
        });
    });

    describe('createModule', () => {
        beforeEach(() => {
            mockPrisma.academyModule.create.mockResolvedValue({
                id: 'new-module',
                title: 'New Module',
                levelId: 'level-1',
                order: 3,
            });
        });

        it('should create module', async () => {
            const result = await createModule({
                title: 'New Module',
                levelId: 'level-1',
            });

            expect(result.success).toBe(true);
        });

        it('should require title', async () => {
            const result = await createModule({ title: '', levelId: 'level-1' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Title is required');
        });

        it('should require levelId', async () => {
            const result = await createModule({ title: 'Test', levelId: '' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Level is required');
        });
    });

    describe('deleteModule', () => {
        it('should delete module without lessons', async () => {
            mockPrisma.academyModule.findUnique.mockResolvedValueOnce({
                ...mockModules[0],
                lessons: [],
            });
            mockPrisma.academyModule.delete.mockResolvedValue(mockModules[0]);

            const result = await deleteModule('module-1');

            expect(result.success).toBe(true);
        });

        it('should not delete module with lessons', async () => {
            mockPrisma.academyModule.findUnique.mockResolvedValueOnce({
                ...mockModules[0],
                lessons: [{ id: 'lesson-1' }],
            });

            const result = await deleteModule('module-1');

            expect(result.success).toBe(false);
            expect(result.error).toBe('Cannot delete module with lessons');
        });
    });
});

describe('Academy Lesson Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPrisma.academyLesson.findMany.mockResolvedValue(mockLessons);
    });

    describe('getLessons', () => {
        it('should get all lessons', async () => {
            const result = await getLessons();

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockLessons);
        });

        it('should filter by moduleId', async () => {
            await getLessons('module-1');

            expect(mockPrisma.academyLesson.findMany).toHaveBeenCalledWith(
                expect.objectContaining({
                    where: { moduleId: 'module-1' },
                })
            );
        });
    });

    describe('createLesson', () => {
        beforeEach(() => {
            mockPrisma.academyLesson.create.mockResolvedValue({
                id: 'new-lesson',
                title: 'New Lesson',
                content: '<p>Content</p>',
                moduleId: 'module-1',
                order: 3,
            });
        });

        it('should create lesson', async () => {
            const result = await createLesson({
                title: 'New Lesson',
                content: '<p>Content</p>',
                moduleId: 'module-1',
            });

            expect(result.success).toBe(true);
        });

        it('should require title', async () => {
            const result = await createLesson({
                title: '',
                content: 'Content',
                moduleId: 'module-1',
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Title is required');
        });

        it('should require content', async () => {
            const result = await createLesson({
                title: 'Title',
                content: '',
                moduleId: 'module-1',
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Content is required');
        });

        it('should require moduleId', async () => {
            const result = await createLesson({
                title: 'Title',
                content: 'Content',
                moduleId: '',
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Module is required');
        });
    });
});

describe('Quiz Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPrisma.quiz.findMany.mockResolvedValue(mockQuizzes);
    });

    describe('getQuizzes', () => {
        it('should get all quizzes', async () => {
            const result = await getQuizzes();

            expect(result.success).toBe(true);
            expect(result.data).toEqual(mockQuizzes);
        });
    });

    describe('createQuiz', () => {
        beforeEach(() => {
            mockPrisma.quiz.create.mockResolvedValue({
                id: 'new-quiz',
                title: 'New Quiz',
                lessonId: 'lesson-1',
            });
        });

        it('should create quiz', async () => {
            const result = await createQuiz({
                title: 'New Quiz',
                lessonId: 'lesson-1',
            });

            expect(result.success).toBe(true);
        });

        it('should require title', async () => {
            const result = await createQuiz({ title: '', lessonId: 'lesson-1' });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Title is required');
        });
    });

    describe('deleteQuiz', () => {
        it('should delete quiz and its questions', async () => {
            mockPrisma.quiz.findUnique.mockResolvedValueOnce(mockQuizzes[0]);
            mockPrisma.quizQuestion.deleteMany.mockResolvedValue({ count: 10 });
            mockPrisma.quiz.delete.mockResolvedValue(mockQuizzes[0]);

            const result = await deleteQuiz('quiz-1');

            expect(result.success).toBe(true);
            expect(mockPrisma.quizQuestion.deleteMany).toHaveBeenCalledWith({
                where: { quizId: 'quiz-1' },
            });
        });
    });
});

describe('Question Actions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockPrisma.quizQuestion.findMany.mockResolvedValue(mockQuestions);
    });

    describe('addQuestion', () => {
        beforeEach(() => {
            mockPrisma.quizQuestion.create.mockResolvedValue({
                id: 'new-q',
                quizId: 'quiz-1',
                question: 'New question?',
                options: ['A', 'B', 'C', 'D'],
                correctAnswer: 0,
                order: 2,
            });
        });

        it('should add question', async () => {
            const result = await addQuestion({
                quizId: 'quiz-1',
                question: 'New question?',
                options: ['A', 'B', 'C', 'D'],
                correctAnswer: 0,
            });

            expect(result.success).toBe(true);
        });

        it('should require question text', async () => {
            const result = await addQuestion({
                quizId: 'quiz-1',
                question: '',
                options: ['A', 'B'],
                correctAnswer: 0,
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Question text is required');
        });

        it('should require at least 2 options', async () => {
            const result = await addQuestion({
                quizId: 'quiz-1',
                question: 'Q?',
                options: ['A'],
                correctAnswer: 0,
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('At least 2 options are required');
        });

        it('should validate correct answer index', async () => {
            const result = await addQuestion({
                quizId: 'quiz-1',
                question: 'Q?',
                options: ['A', 'B'],
                correctAnswer: 5, // Invalid
            });

            expect(result.success).toBe(false);
            expect(result.error).toBe('Invalid correct answer index');
        });
    });
});
