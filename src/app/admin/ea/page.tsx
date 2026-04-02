import { Metadata } from "next";
import Link from "next/link";
import {
    Clock,
    CheckCircle,
    Bot,
    ArrowRight,
    Briefcase,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { AccountStatus } from "@prisma/client";
import { Button } from "@/components/ui/Button";
import { BrokerLogo } from "@/components/ui/BrokerLogo";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AnimatedSection } from "@/components/admin/dashboard/AnimatedSection";
import { EADashboardClient } from "@/components/admin/ea/EADashboardClient";

export const metadata: Metadata = {
    title: "EA Management | Admin",
    description: "Manage EA licenses and products",
};

// ── Helper: get daily counts for last N days ──
async function getDailyCountsForDays(
    model: "eALicense" | "eADownload" | "eAProduct",
    days: number,
    where?: Record<string, unknown>,
) {
    const counts: number[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const dayStart = new Date(now);
        dayStart.setDate(now.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const count = await (prisma[model] as any).count({
            where: {
                ...where,
                createdAt: { gte: dayStart, lte: dayEnd },
            },
        });
        counts.push(count);
    }

    return counts;
}

// ── Helper: calculate trend percent (last 30d vs previous 30d) ──
async function getTrendPercent(
    model: "eALicense" | "eADownload" | "eAProduct",
    where?: Record<string, unknown>,
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
            pendingCount, activeCount, productsCount, downloadsCount,
            pendingSparkline, activeSparkline, productsSparkline, downloadsSparkline,
            pendingTrend, activeTrend, productsTrend, downloadsTrend,
        ] = await Promise.all([
            // Current totals
            prisma.eALicense.count({ where: { status: AccountStatus.PENDING } }),
            prisma.eALicense.count({ where: { status: AccountStatus.APPROVED } }),
            prisma.eAProduct.count({ where: { isActive: true } }),
            prisma.eADownload.count(),
            // Sparklines (7 days)
            getDailyCountsForDays("eALicense", 7, { status: AccountStatus.PENDING }),
            getDailyCountsForDays("eALicense", 7, { status: AccountStatus.APPROVED }),
            getDailyCountsForDays("eAProduct", 7, { isActive: true }),
            getDailyCountsForDays("eADownload", 7),
            // Trends (30d vs 30d)
            getTrendPercent("eALicense", { status: AccountStatus.PENDING }),
            getTrendPercent("eALicense", { status: AccountStatus.APPROVED }),
            getTrendPercent("eAProduct", { isActive: true }),
            getTrendPercent("eADownload"),
        ]);

        return {
            pending: { value: pendingCount, sparkline: pendingSparkline, trendPercent: pendingTrend },
            active: { value: activeCount, sparkline: activeSparkline, trendPercent: activeTrend },
            products: { value: productsCount, sparkline: productsSparkline, trendPercent: productsTrend },
            downloads: { value: downloadsCount, sparkline: downloadsSparkline, trendPercent: downloadsTrend },
        };
    } catch (error) {
        console.error("Error fetching EA hero stats:", error);
        const empty = { value: 0, sparkline: [0, 0, 0, 0, 0, 0, 0], trendPercent: 0 };
        return { pending: empty, active: empty, products: empty, downloads: empty };
    }
}

async function getRecentActivity() {
    try {
        const recentActions = await prisma.eALicense.findMany({
            where: {
                OR: [
                    { status: AccountStatus.APPROVED, approvedAt: { not: null } },
                    { status: AccountStatus.REJECTED, rejectedAt: { not: null } },
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
    const [heroStats, recentActivity, recentPending, brokerStats] = await Promise.all([
        getHeroStats(),
        getRecentActivity(),
        getRecentPending(),
        getLicensesByBroker(),
    ]);

    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="EA Management"
                description="Overview of license requests and products."
            >
                <Link href="/admin/ea/products/create">
                    <Button variant="primary" className="shadow-primary/30">
                        <Bot size={18} aria-hidden="true" /> New Product
                    </Button>
                </Link>
                <Link href="/admin/ea/accounts/pending">
                    <Button variant="outline">
                        Manage Requests
                    </Button>
                </Link>
            </AdminPageHeader>

            {/* ── Zone A + B + C: Client Animated Section ── */}
            <EADashboardClient
                pending={heroStats.pending}
                active={heroStats.active}
                products={heroStats.products}
                downloads={heroStats.downloads}
                recentActivity={recentActivity}
            />

            {/* ── Zone D: Server-rendered Widgets ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* Pending Requests */}
                <AnimatedSection delay={0.7}>
                    <div className="bg-white dark:bg-[#0B0E14] rounded-xl p-6 border border-gray-200 dark:border-white/10 shadow-sm h-full flex flex-col">
                        <div className="flex items-center justify-between mb-5">
                            <h2 className="text-sm font-bold text-gray-700 dark:text-white uppercase tracking-wider flex items-center gap-2">
                                <Clock className="text-amber-500" size={18} />
                                Pending Requests
                            </h2>
                            <Link
                                href="/admin/ea/accounts/pending"
                                className="text-xs font-bold text-primary hover:text-primary/80 flex items-center gap-1 transition-colors"
                            >
                                View All <ArrowRight size={14} />
                            </Link>
                        </div>

                        <div className="space-y-3 flex-1">
                            {recentPending.length === 0 ? (
                                <div className="text-center py-12 text-gray-600 dark:text-gray-300">
                                    <CheckCircle size={36} className="mx-auto mb-3 text-gray-300 dark:text-gray-600" aria-hidden="true" />
                                    <p className="text-sm">No pending requests</p>
                                </div>
                            ) : (
                                recentPending.map((license) => (
                                    <div
                                        key={license.id}
                                        className="flex items-center justify-between p-3.5 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:shadow-md transition-shadow group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <BrokerLogo broker={license.broker} size={48} />
                                            <div>
                                                <p className="font-bold text-sm text-gray-700 dark:text-white font-mono">
                                                    {license.accountNumber}
                                                </p>
                                                <p className="text-xs text-gray-600 dark:text-gray-300">
                                                    {license.user.name || license.user.email}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-xs text-gray-500 block mb-1">
                                                {formatDistanceToNow(license.createdAt, { addSuffix: true, locale: enUS })}
                                            </span>
                                            <StatusBadge status={license.status} />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </AnimatedSection>

                {/* Active Licenses by Broker */}
                <AnimatedSection delay={0.8}>
                    <div className="bg-white dark:bg-[#0B0E14] rounded-xl p-6 border border-gray-200 dark:border-white/10 shadow-sm h-full">
                        <h2 className="text-sm font-bold text-gray-700 dark:text-white uppercase tracking-wider flex items-center gap-2 mb-5">
                            <Briefcase className="text-primary" size={18} />
                            Active by Broker
                        </h2>

                        <div className="space-y-4">
                            {brokerStats.length === 0 ? (
                                <p className="text-sm text-gray-600 text-center py-8">No active licenses found.</p>
                            ) : (
                                brokerStats.map((stat) => {
                                    const maxCount = brokerStats[0]._count.id || 1;
                                    const percentage = (stat._count.id / maxCount) * 100;

                                    return (
                                        <div key={stat.broker} className="space-y-2 group">
                                            <div className="flex justify-between items-center text-sm">
                                                <div className="flex items-center gap-3">
                                                    <BrokerLogo broker={stat.broker} size={36} />
                                                    <span className="font-bold text-gray-700 dark:text-white capitalize group-hover:text-primary transition-colors">
                                                        {stat.broker.toLowerCase()}
                                                    </span>
                                                </div>
                                                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase inline-flex items-center gap-1.5 select-none bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-800/50">
                                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                                                    {stat._count.id} ACTIVE
                                                </span>
                                            </div>
                                            <div className="h-1.5 w-full bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-primary rounded-full transition-all duration-1000"
                                                    style={{ width: `${percentage}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </AnimatedSection>
            </div>
        </div>
    );
}
