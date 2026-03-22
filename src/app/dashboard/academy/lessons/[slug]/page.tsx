import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import LessonClientView from "@/components/academy/LessonClientView";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const lesson = await prisma.lesson.findUnique({
        where: { slug },
        select: { title: true, module: { select: { title: true } } }
    });

    return {
        title: lesson ? `${lesson.title} | Academy` : "Lesson Not Found",
        description: lesson ? `${lesson.title} - ${lesson.module.title}` : undefined,
    };
}

export default async function DashboardLessonPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const user = await getAuthUser();

    if (!user) {
        redirect("/auth/login");
    }

    // Fetch lesson with module context + user progress
    const [lesson, userProgress] = await Promise.all([
        prisma.lesson.findUnique({
            where: { slug },
            include: {
                module: {
                    include: {
                        level: true,
                        quiz: true,
                        lessons: {
                            orderBy: { order: "asc" },
                            select: { id: true, title: true, slug: true, duration: true }
                        }
                    }
                }
            }
        }),
        prisma.userProgress.findMany({
            where: { userId: user.id, isCompleted: true },
            select: { lessonId: true }
        })
    ]);

    if (!lesson) return notFound();

    const courseLessons = lesson.module.lessons;
    const currentIndex = courseLessons.findIndex(l => l.id === lesson.id);
    const nextLesson = courseLessons[currentIndex + 1];
    const prevLesson = courseLessons[currentIndex - 1];
    const quiz = lesson.module.quiz;
    const isLastLesson = !nextLesson;

    // Pass completed lesson IDs so client can show progress
    const completedLessonIds = userProgress.map(p => p.lessonId);
    const completedSet = new Set(completedLessonIds);

    // Server-side sequential lock: all previous lessons must be completed
    if (currentIndex > 0) {
        const previousLessons = courseLessons.slice(0, currentIndex);
        const allPreviousCompleted = previousLessons.every(l => completedSet.has(l.id));
        if (!allPreviousCompleted) {
            redirect("/dashboard/academy?locked=1");
        }
    }

    return (
        <LessonClientView
            lesson={lesson}
            courseLessons={courseLessons}
            nextLesson={nextLesson}
            prevLesson={prevLesson}
            quiz={quiz}
            isLastLesson={isLastLesson}
            isDashboard
            completedLessonIds={completedLessonIds}
        />
    );
}
