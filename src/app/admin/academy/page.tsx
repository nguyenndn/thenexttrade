import { prisma } from "@/lib/prisma";
import { AcademyDashboard } from "@/components/admin/academy/AcademyDashboard";
import { isAcademyEnabled } from "./actions";

export const dynamic = "force-dynamic";

export default async function AcademyPage() {
    const [levels, academyEnabled] = await Promise.all([
        prisma.level.findMany({
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
        }),
        isAcademyEnabled(),
    ]);

    return (
        <div className="pb-10">
            <AcademyDashboard
                initialLevels={levels}
                initialAcademyEnabled={academyEnabled}
            />
        </div>
    );
}

