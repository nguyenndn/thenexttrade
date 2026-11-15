import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import LessonClientView from "@/components/academy/LessonClientView";

export const dynamic = "force-dynamic";

export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const lesson = await prisma.lesson.findUnique({
        where: { slug },
        select: {
            title: true,
            status: true,
            metaDescription: true,
            module: { select: { title: true } },
        },
    });

    const isPublished = lesson?.status === "published";

    return {
        title:
            lesson && isPublished
                ? `${lesson.title} | Academy`
                : "Lesson Not Found",
        description:
            lesson && isPublished
                ? lesson.metaDescription ||
                  `${lesson.title} - ${lesson.module.title}`
                : undefined,
    };
}

export default async function DashboardLessonPage({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
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
                        level: {
                            include: {
                                modules: {
                                    orderBy: { order: "asc" },
                                    include: {
                                        lessons: {
                                            where: { status: "published" },
                                            orderBy: { order: "asc" },
                                            select: {
                                                id: true,
                                                title: true,
                                                slug: true,
                                                duration: true,
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        quiz: true,
                        lessons: {
                            where: { status: "published" },
                            orderBy: { order: "asc" },
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                duration: true,
                            },
                        },
                    },
                },
            },
        }),
        prisma.userProgress.findMany({
            where: { userId: user.id, isCompleted: true },
            select: { lessonId: true },
        }),
    ]);

    if (!lesson || lesson.status !== "published") return notFound();

    const courseLessons = lesson.module.lessons;
    const quiz = lesson.module.quiz;

    // Cross-module navigation
    const allLessonsInLevel = lesson.module.level.modules.flatMap(
        (m) => m.lessons
    );
    const globalIndex = allLessonsInLevel.findIndex((l) => l.id === lesson.id);
    const nextLesson = allLessonsInLevel[globalIndex + 1] ?? null;
    const prevLesson = allLessonsInLevel[globalIndex - 1] ?? null;
    const isLastLesson = !nextLesson;
    const isLastLessonInModule =
        courseLessons.length > 0 &&
        courseLessons[courseLessons.length - 1]?.id === lesson.id;

    // Pass completed lesson IDs so client can show progress
    const completedLessonIds = userProgress.map((p) => p.lessonId);
    const completedSet = new Set(completedLessonIds);

    const isAdmin =
        user.profile?.role === "ADMIN" ||
        (
            await prisma.profile.findUnique({
                where: { userId: user.id },
                select: { role: true },
            })
        )?.role === "ADMIN";

    // Server-side cross-level + intra-level sequential lock (unless Admin)
    if (!isAdmin) {
        if (lesson.module.level.order > 1) {
            const priorLevelLessons = await prisma.lesson.findMany({
                where: {
                    status: "published",
                    module: {
                        level: { order: { lt: lesson.module.level.order } },
                    },
                },
                select: { id: true },
            });
            const allPriorLevelsCompleted = priorLevelLessons.every((l) =>
                completedSet.has(l.id)
            );
            if (!allPriorLevelsCompleted) {
                redirect("/dashboard/academy?locked=1");
            }
        }

        if (globalIndex > 0) {
            const previousLessons = allLessonsInLevel.slice(0, globalIndex);
            const allPreviousCompleted = previousLessons.every((l) =>
                completedSet.has(l.id)
            );
            if (!allPreviousCompleted) {
                redirect("/dashboard/academy?locked=1");
            }
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
            isLastLessonInModule={isLastLessonInModule}
            isDashboard
            completedLessonIds={completedLessonIds}
        />
    );
}
