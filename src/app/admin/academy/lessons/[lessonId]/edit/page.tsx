import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { LessonEditForm } from "@/components/admin/academy/LessonEditForm";
import { requireAdminPageAccess } from "@/lib/admin/auth.server";

export const dynamic = "force-dynamic";

export default async function LessonEditPage({
    params,
}: {
    params: Promise<{ lessonId: string }>;
}) {
    const { lessonId } = await params;
    await requireAdminPageAccess();

    const lesson = await prisma.lesson.findFirst({
        where: {
            OR: [
                { id: lessonId },
                { slug: lessonId },
            ],
        },
        include: {
            module: {
                select: {
                    id: true,
                    title: true,
                    levelId: true,
                    level: { select: { id: true, title: true } },
                },
            },
        },
    });

    if (!lesson) return notFound();

    // Fetch all levels with modules for the module dropdown
    const levels = await prisma.level.findMany({
        orderBy: { order: "asc" },
        include: {
            modules: {
                orderBy: { order: "asc" },
                select: { id: true, title: true },
            },
        },
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
                rawContent: lesson.rawContent || "",
                tone: lesson.tone || "",
                sourceUrls: lesson.sourceUrls || [],
                metaDescription: lesson.metaDescription || "",
                status: lesson.status,
            }}
            modules={levels.flatMap((l) =>
                l.modules.map((m) => ({
                    id: m.id,
                    title: m.title,
                    levelTitle: l.title,
                }))
            )}
            backHref={`/admin/academy/${lesson.module.levelId}`}
        />
    );
}
