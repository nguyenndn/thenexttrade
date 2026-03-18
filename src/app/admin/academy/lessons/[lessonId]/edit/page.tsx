import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { LessonEditForm } from "@/components/admin/academy/LessonEditForm";

export default async function LessonEditPage({
    params,
}: {
    params: Promise<{ lessonId: string }>;
}) {
    const { lessonId } = await params;

    const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        include: {
            module: {
                select: { id: true, title: true, levelId: true, level: { select: { id: true, title: true } } }
            }
        }
    });

    if (!lesson) return notFound();

    // Fetch all levels with modules for the module dropdown
    const levels = await prisma.level.findMany({
        orderBy: { order: "asc" },
        include: {
            modules: {
                orderBy: { order: "asc" },
                select: { id: true, title: true }
            }
        }
    });

    return (
        <LessonEditForm
            lesson={{
                id: lesson.id,
                title: lesson.title,
                slug: lesson.slug,
                content: lesson.content || "",
                videoUrl: lesson.videoUrl || "",
                duration: lesson.duration || 10,
                moduleId: lesson.moduleId,
                order: lesson.order,
            }}
            modules={levels.flatMap(l =>
                l.modules.map(m => ({ id: m.id, title: m.title, levelTitle: l.title }))
            )}
            backHref={`/admin/academy/${lesson.module.levelId}`}
        />
    );
}
