import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import LessonView from "@/components/dashboard/academy/LessonView";

export const dynamic = 'force-dynamic';

export default async function DashboardLessonPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const user = await getAuthUser();

    if (!user) {
        redirect("/auth/login");
    }

    const lesson = await prisma.lesson.findUnique({
        where: { slug },
        include: {
            module: {
                include: {
                    level: true,
                    quiz: true,
                    lessons: {
                        orderBy: { order: "asc" },
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            duration: true,
                            progress: {
                                where: { userId: user.id },
                                select: { isCompleted: true }
                            }
                        }
                    }
                }
            }
        }
    });

    if (!lesson) return notFound();

    const courseLessons = lesson.module.lessons;
    const currentIndex = courseLessons.findIndex(l => l.id === lesson.id);
    const nextLesson = courseLessons[currentIndex + 1];
    const prevLesson = courseLessons[currentIndex - 1];
    const quiz = lesson.module.quiz;
    const isLastLesson = !nextLesson;

    return (
        <LessonView
            lesson={lesson}
            courseLessons={courseLessons}
            nextLesson={nextLesson}
            prevLesson={prevLesson}
            quiz={quiz}
            isLastLesson={isLastLesson}
            userId={user.id}
        />
    );
}
