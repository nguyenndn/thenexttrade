import { prisma } from "@/lib/prisma";
import { PendingApprovalsWidget } from "@/components/admin/widgets/PendingApprovalsWidget";

export async function PendingApprovalsSuspense() {
    try {
        const vipRequests = await prisma.vipRequest.findMany({
            where: { status: "PENDING" },
            take: 5,
            orderBy: { createdAt: "desc" },
            include: {
                user: { select: { name: true, image: true, email: true } },
            },
        });

        const combined = [
            ...vipRequests.map((r) => ({
                id: r.id,
                type: "VIP_REQUEST" as const,
                title: "VIP Request",
                broker: r.broker,
                account: r.accountNumber,
                createdAt: r.createdAt,
                user: r.user,
                href: `/admin/ib/pipeline?id=${r.id}`,
            })),
        ];

        const sorted = combined
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
            .slice(0, 5);

        return <PendingApprovalsWidget approvals={sorted} />;
    } catch (error) {
        console.error("Error fetching pending approvals:", error);
        return <PendingApprovalsWidget approvals={[]} />;
    }
}
