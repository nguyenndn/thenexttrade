import { Metadata } from "next";
import Link from "next/link";
import { Bot } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { AccountStatus } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { EADashboardClient } from "@/components/admin/trading-systems/EADashboardClient";
import { requireAdminPageAccess } from "@/lib/admin/auth.server";

export const metadata: Metadata = {
    title: "Trading Systems | Admin",
    description: "Manage EA licenses and products",
};

export const dynamic = "force-dynamic";

// Helper: get daily counts for last N days
async function getDailyCountsForDays(
    model: "eALicense" | "eADownload" | "eAProduct",
    days: number,
    where?: Record<string, unknown>
) {
    const now = new Date();
    const promises = [];

    for (let i = days - 1; i >= 0; i--) {
        const dayStart = new Date(now);
        dayStart.setDate(now.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        promises.push(
            (prisma[model] as any).count({
                where: {
                    ...where,
                    createdAt: { gte: dayStart, lte: dayEnd },
                },
            })
        );
    }

    return Promise.all(promises);
}

// Helper: calculate trend percent (last 30d vs previous 30d)
async function getTrendPercent(
    model: "eALicense" | "eADownload" | "eAProduct",
    where?: Record<string, unknown>
) {
    const now = new Date();
    const d30 = new Date(now);
    d30.setDate(now.getDate() - 30);
    const d60 = new Date(now);
    d60.setDate(now.getDate() - 60);

    const [current, previous] = await Promise.all([
        (prisma[model] as any).count({
            where: { ...where, createdAt: { gte: d30 } },
        }),
        (prisma[model] as any).count({
            where: { ...where, createdAt: { gte: d60, lt: d30 } },
        }),
    ]);

    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
}

async function getHeroStats() {
    try {
        const [
            pendingCount,
            activeCount,
            productsCount,
            downloadsCount,
            pendingSparkline,
            activeSparkline,
            productsSparkline,
            downloadsSparkline,
            pendingTrend,
            activeTrend,
            productsTrend,
            downloadsTrend,
        ] = await Promise.all([
            // Current totals
            prisma.eALicense.count({
                where: { status: AccountStatus.PENDING },
            }),
            prisma.eALicense.count({
                where: { status: AccountStatus.APPROVED },
            }),
            prisma.eAProduct.count({ where: { isActive: true } }),
            prisma.eADownload.count(),
            // Sparklines (7 days)
            getDailyCountsForDays("eALicense", 7, {
                status: AccountStatus.PENDING,
            }),
            getDailyCountsForDays("eALicense", 7, {
                status: AccountStatus.APPROVED,
            }),
            getDailyCountsForDays("eAProduct", 7, { isActive: true }),
            getDailyCountsForDays("eADownload", 7),
            // Trends (30d vs 30d)
            getTrendPercent("eALicense", { status: AccountStatus.PENDING }),
            getTrendPercent("eALicense", { status: AccountStatus.APPROVED }),
            getTrendPercent("eAProduct", { isActive: true }),
            getTrendPercent("eADownload"),
        ]);

        return {
            pending: {
                value: pendingCount,
                sparkline: pendingSparkline,
                trendPercent: pendingTrend,
            },
            active: {
                value: activeCount,
                sparkline: activeSparkline,
                trendPercent: activeTrend,
            },
            products: {
                value: productsCount,
                sparkline: productsSparkline,
                trendPercent: productsTrend,
            },
            downloads: {
                value: downloadsCount,
                sparkline: downloadsSparkline,
                trendPercent: downloadsTrend,
            },
        };
    } catch (error) {
        console.error("Error fetching EA hero stats:", error);
        const empty = {
            value: 0,
            sparkline: [0, 0, 0, 0, 0, 0, 0],
            trendPercent: 0,
        };
        return {
            pending: empty,
            active: empty,
            products: empty,
            downloads: empty,
        };
    }
}

async function getRecentActivity() {
    try {
        const recentActions = await prisma.eALicense.findMany({
            where: {
                OR: [
                    {
                        status: AccountStatus.APPROVED,
                        approvedAt: { not: null },
                    },
                    {
                        status: AccountStatus.REJECTED,
                        rejectedAt: { not: null },
                    },
                ],
            },
            orderBy: { updatedAt: "desc" },
            take: 8,
            include: { user: { select: { name: true, email: true } } },
        });

        return recentActions.map((l) => ({
            id: l.id,
            action: l.status as "APPROVED" | "REJECTED",
            accountNumber: l.accountNumber,
            broker: l.broker,
            userName: l.user.name || l.user.email,
            timestamp: l.status === "APPROVED" ? l.approvedAt! : l.rejectedAt!,
        }));
    } catch (error) {
        console.error("Error fetching recent activity:", error);
        return [];
    }
}

async function getRecentPending() {
    try {
        return await prisma.eALicense.findMany({
            where: { status: AccountStatus.PENDING },
            orderBy: { createdAt: "desc" },
            take: 5,
            include: { user: { select: { email: true, name: true } } },
        });
    } catch (error) {
        console.error("Error fetching recent pending EA licenses:", error);
        return [];
    }
}

async function getLicensesByBroker() {
    try {
        return await prisma.eALicense.groupBy({
            by: ["broker"],
            where: { status: AccountStatus.APPROVED },
            _count: { id: true },
            orderBy: { _count: { id: "desc" } },
        });
    } catch (error) {
        console.error("Error fetching broker stats:", error);
        return [];
    }
}

export default async function EADashboardPage() {
    await requireAdminPageAccess();
    const [heroStats, recentActivity, recentPending, brokerStats] =
        await Promise.all([
            getHeroStats(),
            getRecentActivity(),
            getRecentPending(),
            getLicensesByBroker(),
        ]);

    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="Trading Systems"
                description="Overview of license requests, EA products and system performance."
            >
                <Link href="/admin/trading-systems/create">
                    <Button variant="primary" className="shadow-primary/30">
                        <Bot size={18} aria-hidden="true" /> New Product
                    </Button>
                </Link>
                <Link href="/admin/trading-systems/accounts/pending">
                    <Button variant="outline">Manage Requests</Button>
                </Link>
            </AdminPageHeader>

            <EADashboardClient
                pending={heroStats.pending}
                active={heroStats.active}
                products={heroStats.products}
                downloads={heroStats.downloads}
                recentActivity={recentActivity}
                recentPending={recentPending}
                brokerStats={brokerStats}
            />
        </div>
    );
}
