import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import LessonClientView from "@/components/academy/LessonClientView";
import { JsonLd } from "@/components/seo/JsonLd";

export const dynamic = 'force-dynamic';

export default async function LessonPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const user = await getAuthUser();

    // Redirect to Dashboard if logged in
    if (user) {
        redirect(`/dashboard/academy/lessons/${slug}`);
    }

    const lesson = await prisma.lesson.findUnique({
        where: { slug },
        include: {
            module: {
                include: {
                    level: true,
                    quiz: true, // Include Quiz
                    lessons: {
                        orderBy: { order: "asc" },
                        select: { id: true, title: true, slug: true, duration: true }
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
        <>
            <JsonLd
                type="Article"
                data={{
                    headline: lesson.title,
                    description: lesson.module.description || `Lesson: ${lesson.title}`,
                    datePublished: lesson.createdAt.toISOString(),
                    dateModified: lesson.updatedAt.toISOString(),
                    author: { name: "TheNextTrade Academy" },
                    isPartOf: {
                        "@type": "Course",
                        name: "Zero to Funded Trader",
                        description: "Free comprehensive Forex trading course.",
                        url: `${process.env.NEXT_PUBLIC_APP_URL}/academy`
                    }
                }}
            />
            <LessonClientView
                lesson={lesson}
                courseLessons={courseLessons}
                nextLesson={nextLesson}
                prevLesson={prevLesson}
                quiz={quiz}
                isLastLesson={isLastLesson}
            />
        </>
    );
}
