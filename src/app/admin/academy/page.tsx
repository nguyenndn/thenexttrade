
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
                select: { id: true }
            }
        },
    });

    return (
        <div className="pb-10">
            <AcademyDashboard initialLevels={levels} />
        </div>
    );
}
