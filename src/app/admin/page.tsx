import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { Suspense } from "react";
import { AdminDashboardClient } from "@/components/admin/dashboard/AdminDashboardClient";
import { AnimatedSection } from "@/components/admin/dashboard/AnimatedSection";
import { UserGrowthChart } from "@/components/admin/charts/UserGrowthChart";
import { ContentDistributionChart } from "@/components/admin/charts/ContentDistributionChart";
import { QuickActionsWidget } from "@/components/admin/widgets/QuickActionsWidget";
import { PendingApprovalsSuspense } from "@/components/admin/dashboard/PendingApprovalsSuspense";
import { RecentIBLeadsSuspense } from "@/components/admin/dashboard/RecentIBLeadsSuspense";
import { RecentTradesSuspense } from "@/components/admin/dashboard/RecentTradesSuspense";
import { LeaderboardWidget } from "@/components/dashboard/LeaderboardWidget";

export const dynamic = "force-dynamic";

function toDailySparkline(items: { createdAt: Date }[], days = 7): number[] {
    const result = Array(days).fill(0);
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    items.forEach((item) => {
        const daysAgo = Math.floor(
            (now.getTime() - item.createdAt.getTime()) / 86400000
        );
        if (daysAgo >= 0 && daysAgo < days) result[days - 1 - daysAgo]++;
    });
    return result;
}

function calcTrend(current: number, previous: number): number | null {
    if (previous === 0) return current > 0 ? 100 : null;
    return Math.round(((current - previous) / previous) * 100);
}

const getStats = unstable_cache(
    async () => {
        const now = new Date();
        const thirtyDaysAgo = new Date(now);
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const sixtyDaysAgo = new Date(now);
        sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
        const sevenDaysAgo = new Date(now);
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const [
            usersCount,
            tradingAccountsCount,
            vipRequestsCount,
            ibLeadsCount,
            proEntitlementsCount,
            lessonsCount,
            tradingVolumeData,
            rawUserGrowth,
            categoriesDistribution,
            // Trend: previous period counts
            prevUsersCount,
            prevTradingAccountsCount,
            prevVipRequestsCount,
            // Trend: recent period counts
            recentTradingAccountsCount,
            recentVipRequestsCount,
            // Sparkline: 7-day raw data
            rawTradingAccounts7d,
            rawVipRequests7d,
        ] = await Promise.all([
            // Totals
            prisma.user.count(),
            prisma.tradingAccount.count(),
            prisma.vipRequest.count(),
            prisma.ibLead.count(),
            prisma.proEntitlement.count({ where: { status: "ACTIVE" } }),
            prisma.lesson.count(),
            prisma.journalEntry.aggregate({ _sum: { lotSize: true } }),
            prisma.user.findMany({
                where: { createdAt: { gte: thirtyDaysAgo } },
                select: { createdAt: true },
            }),
            prisma.category.findMany({
                include: { _count: { select: { articles: true } } },
            }),
            // Previous 30-day period
            prisma.user.count({
                where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
            }),
            prisma.tradingAccount.count({
                where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
            }),
            prisma.vipRequest.count({
                where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } },
            }),
            // Recent 30-day period
            prisma.tradingAccount.count({
                where: { createdAt: { gte: thirtyDaysAgo } },
            }),
            prisma.vipRequest.count({
                where: { createdAt: { gte: thirtyDaysAgo } },
            }),
            // 7-day sparkline raw
            prisma.tradingAccount.findMany({
                where: { createdAt: { gte: sevenDaysAgo } },
                select: { createdAt: true },
            }),
            prisma.vipRequest.findMany({
                where: { createdAt: { gte: sevenDaysAgo } },
                select: { createdAt: true },
            }),
        ]);

        // User Growth Chart (30 days)
        const userGrowthMap = new Map<string, number>();
        rawUserGrowth.forEach((user) => {
            const date = user.createdAt.toISOString().split("T")[0];
            userGrowthMap.set(date, (userGrowthMap.get(date) || 0) + 1);
        });

        const userGrowthChart = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split("T")[0];
            userGrowthChart.push({
                date: dateStr,
                count: userGrowthMap.get(dateStr) || 0,
            });
        }

        // Content Distribution
        const contentDistribution = categoriesDistribution
            .map((cat) => ({ name: cat.name, value: cat._count.articles }))
            .filter((item) => item.value > 0);

        // Sparklines
        const userSparkline = userGrowthChart.slice(-7).map((d) => d.count);
        const tradingAccountSparkline = toDailySparkline(rawTradingAccounts7d);
        const vipRequestSparkline = toDailySparkline(rawVipRequests7d);

        // Trends
        const recentUsersCount = rawUserGrowth.length;

        return {
            users: {
                total: usersCount,
                sparkline: userSparkline,
                trendPercent: calcTrend(recentUsersCount, prevUsersCount),
            },
            tradingAccounts: {
                total: tradingAccountsCount,
                sparkline: tradingAccountSparkline,
                trendPercent: calcTrend(
                    recentTradingAccountsCount,
                    prevTradingAccountsCount
                ),
            },
            vipRequests: {
                total: vipRequestsCount,
                sparkline: vipRequestSparkline,
                trendPercent: calcTrend(
                    recentVipRequestsCount,
                    prevVipRequestsCount
                ),
            },
            ibLeadsCount,
            proEntitlementsCount,
            lessonsCount,
            tradingVolume: tradingVolumeData._sum.lotSize || 0,
            userGrowthChart,
            contentDistribution,
        };
    },
    ["admin-dashboard-crm-stats-v1"],
    { revalidate: 300, tags: ["admin-stats"] }
);

export default async function AdminDashboard() {
    const stats = await getStats();

    return (
        <div className="space-y-6 pb-10">
            {/* Zone 1: Welcome + Hero Stats + Compact Stats */}
            <AdminDashboardClient
                users={{
                    value: stats.users.total,
                    sparkline: stats.users.sparkline,
                    trendPercent: stats.users.trendPercent,
                }}
                tradingAccounts={{
                    value: stats.tradingAccounts.total,
                    sparkline: stats.tradingAccounts.sparkline,
                    trendPercent: stats.tradingAccounts.trendPercent,
                }}
                vipRequests={{
                    value: stats.vipRequests.total,
                    sparkline: stats.vipRequests.sparkline,
                    trendPercent: stats.vipRequests.trendPercent,
                }}
                ibLeadsCount={stats.ibLeadsCount}
                proEntitlementsCount={stats.proEntitlementsCount}
                lessonsCount={stats.lessonsCount}
                tradingVolume={stats.tradingVolume}
            />

            {/* Zone 2: Quick Actions (horizontal) */}
            <AnimatedSection delay={0.5}>
                <QuickActionsWidget />
            </AnimatedSection>

            {/* Zone 3: Charts */}
            <AnimatedSection delay={0.6}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                        <UserGrowthChart data={stats.userGrowthChart} />
                    </div>
                    <ContentDistributionChart
                        data={stats.contentDistribution}
                    />
                </div>
            </AnimatedSection>

            {/* Zone 4: Activity Widgets */}
            <AnimatedSection delay={0.8}>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                    <Suspense fallback={<WidgetSkeleton />}>
                        <PendingApprovalsSuspense />
                    </Suspense>
                    <Suspense fallback={<WidgetSkeleton />}>
                        <RecentIBLeadsSuspense />
                    </Suspense>
                    <Suspense fallback={<WidgetSkeleton />}>
                        <RecentTradesSuspense />
                    </Suspense>
                    <Suspense fallback={<WidgetSkeleton />}>
                        <LeaderboardWidget />
                    </Suspense>
                </div>
            </AnimatedSection>
        </div>
    );
}

function WidgetSkeleton() {
    return (
        <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm h-full min-h-[350px] flex items-center justify-center animate-pulse">
            <div className="w-full space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-white/5 rounded-lg w-1/3 mx-auto mb-8" />
                {[1, 2, 3, 4, 5].map((i) => (
                    <div key={i} className="flex gap-4 items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/5" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-white/5 rounded-lg w-2/3" />
                            <div className="h-3 bg-gray-200 dark:bg-white/5 rounded-lg w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
