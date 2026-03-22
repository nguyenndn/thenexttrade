import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth-cache';
import { z } from 'zod';

const ActionSchema = z.object({
    action: z.enum(['next', 'reset', 'module'])
});

/**
 * DEV-ONLY: Quick test endpoint for academy gamification.
 * POST /api/academy/test-progress
 * Body: { action: "next" | "reset" | "module" }
 * - "next" → marks the next uncompleted lesson as completed
 * - "reset" → removes all progress
 * - "module" → completes all lessons in the current module
 * Blocked in production.
 */
export async function POST(req: NextRequest) {
    if (process.env.NODE_ENV === 'production') {
        return NextResponse.json({ error: 'Not available' }, { status: 404 });
    }

    const user = await getAuthUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) {
        return NextResponse.json({ error: 'Invalid action. Must be: next, reset, or module' }, { status: 400 });
    }

    const { action } = parsed.data;

    if (action === 'reset') {
        await prisma.userProgress.deleteMany({ where: { userId: user.id } });
        return NextResponse.json({ message: 'Progress reset', completed: 0 });
    }

    // Shared: fetch all lessons in order with user progress
    const lessons = await prisma.lesson.findMany({
        orderBy: [
            { module: { level: { order: 'asc' } } },
            { module: { order: 'asc' } },
            { order: 'asc' }
        ],
        select: {
            id: true,
            title: true,
            moduleId: true,
            module: { select: { id: true, title: true, level: { select: { id: true, title: true, order: true } } } },
            progress: {
                where: { userId: user.id },
                select: { isCompleted: true }
            }
        }
    });

    if (action === 'next') {
        const nextLesson = lessons.find(l => !l.progress.some(p => p.isCompleted));
        if (!nextLesson) {
            return NextResponse.json({ message: 'All lessons completed!', completed: lessons.length });
        }

        await prisma.userProgress.upsert({
            where: { userId_lessonId: { userId: user.id, lessonId: nextLesson.id } },
            create: { userId: user.id, lessonId: nextLesson.id, isCompleted: true, completedAt: new Date() },
            update: { isCompleted: true, completedAt: new Date() }
        });

        const completedCount = lessons.filter(l => l.progress.some(p => p.isCompleted)).length + 1;

        return NextResponse.json({
            message: `Completed: ${nextLesson.title}`,
            lesson: nextLesson.title,
            level: nextLesson.module.level.order,
            module: nextLesson.module.title,
            completed: completedCount,
            total: lessons.length
        });
    }

    if (action === 'module') {
        const nextLesson = lessons.find(l => !l.progress.some(p => p.isCompleted));
        if (!nextLesson) {
            return NextResponse.json({ message: 'All lessons completed!', completed: lessons.length });
        }

        const currentModuleId = nextLesson.moduleId;
        const moduleLessons = lessons.filter(l => l.moduleId === currentModuleId && !l.progress.some(p => p.isCompleted));

        // Batch upsert in a transaction instead of N+1 loop
        const now = new Date();
        await prisma.$transaction(
            moduleLessons.map(lesson =>
                prisma.userProgress.upsert({
                    where: { userId_lessonId: { userId: user.id, lessonId: lesson.id } },
                    create: { userId: user.id, lessonId: lesson.id, isCompleted: true, completedAt: now },
                    update: { isCompleted: true, completedAt: now }
                })
            )
        );

        // Check if the entire level is now completed
        const levelId = nextLesson.module.level.id;
        const levelLessons = lessons.filter(l => l.module.level.id === levelId);
        const allCompleted = await prisma.userProgress.count({
            where: { userId: user.id, isCompleted: true, lessonId: { in: levelLessons.map(l => l.id) } }
        });
        const levelComplete = allCompleted >= levelLessons.length;

        const completedCount = lessons.filter(l => l.progress.some(p => p.isCompleted)).length + moduleLessons.length;

        return NextResponse.json({
            message: `Module completed: ${nextLesson.module.title}`,
            module: nextLesson.module.title,
            level: nextLesson.module.level.order,
            levelTitle: nextLesson.module.level.title,
            levelComplete,
            lessonsMarked: moduleLessons.length,
            completed: completedCount,
            total: lessons.length
        });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
}

