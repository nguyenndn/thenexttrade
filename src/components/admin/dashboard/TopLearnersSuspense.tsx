import { prisma } from "@/lib/prisma";
import { TopLearnersWidget } from "@/components/admin/widgets/TopLearnersWidget";

export async function TopLearnersSuspense() {
    try {
        const rawTopUsers = await prisma.user.findMany({
            take: 5,
            orderBy: { progress: { _count: 'desc' } },
            include: {
                _count: { select: { progress: true } }
            }
        });

        const topLearners = rawTopUsers.map(user => ({
            id: user.id,
            name: user.name,
            image: user.image,
            email: user.email,
            progressCount: user._count.progress
        }));

        return <TopLearnersWidget users={topLearners} />;
    } catch {
        return <TopLearnersWidget users={[]} />;
    }
}
