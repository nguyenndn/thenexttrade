import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { LevelDetailView } from "@/components/admin/academy/LevelDetailView";

export const dynamic = "force-dynamic";

export default async function LevelDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    const level = await prisma.level.findUnique({
        where: { id },
        include: {
            modules: {
                orderBy: { order: "asc" },
                include: {
                    lessons: {
                        orderBy: { order: "asc" },
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            order: true,
                            duration: true,
                            content: false,
                        },
                    },
                    _count: {
                        select: { lessons: true },
                    },
                },
            },
        },
    });

    if (!level) return notFound();

    return <LevelDetailView level={level} />;
}
