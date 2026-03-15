import { Suspense } from "react";
import { prisma } from "@/lib/prisma";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { AdminDashboardClient } from "@/components/admin/dashboard/AdminDashboardClient";
import { AnimatedSection } from "@/components/admin/dashboard/AnimatedSection";
import { RecentTradesSuspense } from "@/components/admin/dashboard/RecentTradesSuspense";
import { PopularArticlesSuspense } from "@/components/admin/dashboard/PopularArticlesSuspense";
import { TopLearnersSuspense } from "@/components/admin/dashboard/TopLearnersSuspense";
import { UserGrowthChart } from "@/components/admin/charts/UserGrowthChart";
import { QuickActionsWidget } from "@/components/admin/widgets/QuickActionsWidget";

export const dynamic = "force-dynamic";

function WidgetSkeleton({ h = "h-[380px]" }: { h?: string }) {
    return (
        <div className={`${h} bg-white dark:bg-[#0B0E14] border border-gray-200 dark:border-white/10 rounded-xl animate-pulse`} />
    );
}

export default async function AdminDashboard() {
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

    const [
        usersTotal,
        usersPrev,
        articlesTotal,
        articlesPrev,
        tradesTotal,
        tradesPrev,
        viewsAgg,
        lessonsCount,
        quizzesCount,
        commentsCount,
        tradingVolumeAgg,
        usersLast7,
        articlesLast7,
        tradesLast7,
        viewsLast7,
        userGrowthData,
    ] = await Promise.all([
        /* hero counts */
        prisma.user.count(),
        prisma.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
        prisma.article.count({ where: { status: "PUBLISHED" } }),
        prisma.article.count({ where: { status: "PUBLISHED", createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
        prisma.journalEntry.count(),
        prisma.journalEntry.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
        prisma.article.aggregate({ _sum: { views: true } }),

        /* secondary counts */
        prisma.userProgress.count({ where: { isCompleted: true } }),
        prisma.quiz.count(),
        prisma.comment.count(),
        prisma.journalEntry.aggregate({ _sum: { lotSize: true } }),

        /* sparkline data (last 7 days) */
        prisma.user.findMany({
            where: { createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
            select: { createdAt: true },
        }),
        prisma.article.findMany({
            where: { status: "PUBLISHED", createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
            select: { createdAt: true },
        }),
        prisma.journalEntry.findMany({
            where: { createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
            select: { createdAt: true },
        }),
        prisma.article.findMany({
            where: { createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } },
            select: { createdAt: true, views: true },
        }),

        /* chart data */
        prisma.user.findMany({
            where: { createdAt: { gte: thirtyDaysAgo } },
            select: { createdAt: true },
        }),
    ]);

    /* Helper: bucket items into 7 daily bins */
    function sparkline(items: { createdAt: Date }[]): number[] {
        const bins = Array(7).fill(0);
        items.forEach((item) => {
            const daysAgo = Math.floor(
                (now.getTime() - item.createdAt.getTime()) / (24 * 60 * 60 * 1000)
            );
            if (daysAgo >= 0 && daysAgo < 7) bins[6 - daysAgo]++;
        });
        return bins;
    }

    function viewSparkline(items: { createdAt: Date; views: number }[]): number[] {
        const bins = Array(7).fill(0);
        items.forEach((item) => {
            const daysAgo = Math.floor(
                (now.getTime() - item.createdAt.getTime()) / (24 * 60 * 60 * 1000)
            );
            if (daysAgo >= 0 && daysAgo < 7) bins[6 - daysAgo] += item.views;
        });
        return bins;
    }

    function trendPct(current: number, prev: number): number | null {
        if (prev === 0) return current > 0 ? 100 : null;
        return Math.round(((current - prev) / prev) * 100);
    }

    const viewsTotal = viewsAgg._sum.views ?? 0;
    const tradingVolume = tradingVolumeAgg._sum?.lotSize ?? 0;

    /* Growth chart data */
    const growthMap = new Map<string, number>();
    userGrowthData.forEach((u) => {
        const d = u.createdAt.toISOString().split("T")[0];
        growthMap.set(d, (growthMap.get(d) || 0) + 1);
    });
    const growthChartData = Array.from(growthMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    return (
        <div className="space-y-4 pb-10">
            <AdminPageHeader
                title="Dashboard Overview"
                description="Welcome back to the Admin Dashboard."
            />

            {/* Zone A: Hero Stats + Secondary Strip */}
            <AdminDashboardClient
                users={{
                    value: usersTotal,
                    sparkline: sparkline(usersLast7),
                    trendPercent: trendPct(
                        usersTotal,
                        usersPrev
                    ),
                }}
                articles={{
                    value: articlesTotal,
                    sparkline: sparkline(articlesLast7),
                    trendPercent: trendPct(
                        articlesTotal,
                        articlesPrev
                    ),
                }}
                trades={{
                    value: tradesTotal,
                    sparkline: sparkline(tradesLast7),
                    trendPercent: trendPct(
                        tradesTotal,
                        tradesPrev
                    ),
                }}
                views={{
                    value: viewsTotal,
                    sparkline: viewSparkline(viewsLast7),
                    trendPercent: null,
                }}
                lessonsCount={lessonsCount}
                quizzesCount={quizzesCount}
                commentsCount={commentsCount}
                tradingVolume={tradingVolume}
            />

            {/* Zone B: Charts + QuickActions */}
            <AnimatedSection delay={0.6} className="grid grid-cols-1 xl:grid-cols-3 gap-4">
                <div className="xl:col-span-2 h-[400px]">
                    <UserGrowthChart data={growthChartData} />
                </div>
                <QuickActionsWidget />
            </AnimatedSection>

            {/* Zone C: Bottom Widgets */}
            <AnimatedSection delay={0.8} className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <Suspense fallback={<WidgetSkeleton />}>
                    <RecentTradesSuspense />
                </Suspense>
                <Suspense fallback={<WidgetSkeleton />}>
                    <TopLearnersSuspense />
                </Suspense>
                <Suspense fallback={<WidgetSkeleton />}>
                    <PopularArticlesSuspense />
                </Suspense>
            </AnimatedSection>
        </div>
    );
}
