import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { PublicLessonView } from "@/components/academy/PublicLessonView";
import { LessonLockedView } from "@/components/academy/LessonLockedView";
import type { Metadata } from "next";

// SSG for public lessons
export async function generateStaticParams() {
    const lessons = await prisma.lesson.findMany({
        where: {
            module: {
                level: { accessLevel: "PUBLIC" }
            },
            status: "published"
        },
        select: { slug: true },
    });
    return lessons.map((l) => ({ slug: l.slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
    const { slug } = await params;
    const lesson = await prisma.lesson.findUnique({
        where: { slug },
        select: {
            title: true,
            content: true,
            metaDescription: true,
            module: {
                select: {
                    title: true,
                    level: { select: { title: true, order: true } }
                }
            }
        }
    });

    if (!lesson) {
        return { title: "Lesson Not Found | TheNextTrade Academy" };
    }

    const description = lesson.metaDescription
        || `${lesson.title} — ${lesson.module.level.title}. Learn forex trading step by step with TheNextTrade Academy.`;

    return {
        title: `${lesson.title} | TheNextTrade Academy`,
        description,
        alternates: {
            canonical: `/academy/lesson/${slug}`,
        },
        openGraph: {
            title: lesson.title,
            description,
            type: "article",
            section: lesson.module.level.title,
            images: [{ url: "/images/og-academy.png", width: 1200, height: 630, alt: lesson.title }],
        },
        twitter: {
            card: "summary_large_image",
            title: lesson.title,
            description,
            images: ["/images/og-academy.png"],
        },
    };
}

export default async function PublicLessonPage({ params }: { params: Promise<{ slug: string }> }) {
    const { slug } = await params;
    const user = await getAuthUser();

    // Authenticated users always use the dashboard view
    if (user) {
        redirect(`/dashboard/academy/lessons/${slug}`);
    }

    // Fetch lesson with full context for cross-module navigation
    const lesson = await prisma.lesson.findUnique({
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
                                        select: { id: true, title: true, slug: true, duration: true }
                                    }
                                }
                            }
                        }
                    },
                    lessons: {
                        where: { status: "published" },
                        orderBy: { order: "asc" },
                        select: { id: true, title: true, slug: true, duration: true }
                    }
                }
            }
        }
    });

    if (!lesson) return notFound();

    const level = lesson.module.level;
    const courseLessons = lesson.module.lessons;

    // Build cross-module flat list for prev/next across modules
    const allLessonsInLevel = level.modules.flatMap(m => m.lessons);
    const globalIndex = allLessonsInLevel.findIndex(l => l.id === lesson.id);
    const nextLesson = allLessonsInLevel[globalIndex + 1] || null;
    const prevLesson = allLessonsInLevel[globalIndex - 1] || null;

    // Level-based access control
    if (level.accessLevel === "PUBLIC") {
        return (
            <PublicLessonView
                lesson={lesson}
                level={level}
                courseLessons={courseLessons}
                nextLesson={nextLesson}
                prevLesson={prevLesson}
            />
        );
    }

    // Member-only level — show locked preview
    return (
        <LessonLockedView
            lessonTitle={lesson.title}
            levelTitle={level.title}
            levelOrder={level.order}
            moduleTitle={lesson.module.title}
        />
    );
}
