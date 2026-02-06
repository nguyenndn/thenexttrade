
import { prisma } from "@/lib/prisma";
import { CourseBuilder } from "@/components/admin/academy/CourseBuilder";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function CourseBuilderPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const level = await prisma.level.findUnique({
        where: { id },
        include: {
            modules: {
                orderBy: { order: "asc" },
                include: {
                    lessons: {
                        orderBy: { order: "asc" },
                        select: { id: true, title: true, videoUrl: true, duration: true, order: true }
                    },
                    quiz: {
                        select: { id: true }
                    }
                }
            }
        },
    });

    if (!level) {
        return notFound();
    }

    return <CourseBuilder level={level} />;
}
