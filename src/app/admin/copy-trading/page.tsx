import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Download } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CopyTradingAdminClient } from "@/components/admin/copy-trading/CopyTradingAdminClient";
import { CopyTradingFeatureToggle } from "@/components/admin/copy-trading/CopyTradingFeatureToggle";

export const dynamic = "force-dynamic";

interface PageProps {
    searchParams: Promise<{
        page?: string;
        q?: string;
        status?: string;
    }>;
}

export default async function AdminCopyTradingPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const page = parseInt(params.page || "1");
    const limit = 20;
    const skip = (page - 1) * limit;
    const status = params.status as "PENDING" | "APPROVED" | "REJECTED" | undefined;
    const q = params.q || "";

    const where: any = {};
    if (status) where.status = status;
    if (q) {
        where.OR = [
            { fullName: { contains: q, mode: "insensitive" } },
            { email: { contains: q, mode: "insensitive" } },
            { mt5AccountNumber: { contains: q, mode: "insensitive" } },
            { brokerName: { contains: q, mode: "insensitive" } },
        ];
    }

    const [registrations, total, pendingCount, stats] = await Promise.all([
        prisma.copyTradingRegistration.findMany({
            where,
            orderBy: { createdAt: "desc" },
            skip,
            take: limit,
            include: {
                user: { select: { name: true, email: true, image: true } },
            },
        }),
        prisma.copyTradingRegistration.count({ where }),
        prisma.copyTradingRegistration.count({ where: { status: "PENDING" } }),
        Promise.all([
            prisma.copyTradingRegistration.count(),
            prisma.copyTradingRegistration.count({ where: { status: "APPROVED" } }),
            prisma.copyTradingRegistration.aggregate({
                _sum: { tradingCapital: true },
                where: { status: "APPROVED" },
            }),
        ]),
    ]);

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="Copy Trading Management"
                description="Manage registrations, connected accounts, and PVSR performance."
            >
                <Button variant="outline" className="flex items-center gap-2 text-sm font-bold">
                    <Download size={14} /> Export CSV
                </Button>
            </AdminPageHeader>

            {/* Feature Visibility Toggle */}
            <CopyTradingFeatureToggle />

            <CopyTradingAdminClient
                initialRegistrations={registrations as any}
                pagination={{ currentPage: page, totalPages, total }}
                pendingCount={pendingCount}
                stats={{
                    totalRegistrations: stats[0],
                    approvedCount: stats[1],
                    totalCapital: stats[2]._sum.tradingCapital || 0,
                }}
            />
        </div>
    );
}
