import { prisma } from "@/lib/prisma";
import { AcademyDashboard } from "@/components/admin/academy/AcademyDashboard";

export const dynamic = "force-dynamic";

export default async function AcademyPage() {
    const levels = await prisma.level.findMany({
        orderBy: { order: "asc" },
        include: {
            _count: {
                select: { modules: true },
            },
            modules: {
                orderBy: { order: "asc" },
                include: {
                    _count: {
                        select: { lessons: true },
                    },
                    quiz: {
                        select: { id: true },
                    },
                    lessons: {
                        orderBy: { order: "asc" },
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            order: true,
                            status: true,
                            duration: true,
                        },
                    },
                },
            },
        },
    });

    return (
        <div className="pb-10">
            <AcademyDashboard initialLevels={levels} />
        </div>
    );
}

