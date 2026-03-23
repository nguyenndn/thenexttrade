import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { Suspense } from "react";
import { AdminDashboardClient } from "@/components/admin/dashboard/AdminDashboardClient";
import { AnimatedSection } from "@/components/admin/dashboard/AnimatedSection";
import { UserGrowthChart } from "@/components/admin/charts/UserGrowthChart";
import { ContentDistributionChart } from "@/components/admin/charts/ContentDistributionChart";
import { QuickActionsWidget } from "@/components/admin/widgets/QuickActionsWidget";
import { TopLearnersSuspense } from "@/components/admin/dashboard/TopLearnersSuspense";
import { RecentTradesSuspense } from "@/components/admin/dashboard/RecentTradesSuspense";
import { PopularArticlesSuspense } from "@/components/admin/dashboard/PopularArticlesSuspense";
import { LeaderboardWidget } from "@/components/dashboard/LeaderboardWidget";

export const dynamic = 'force-dynamic';

function toDailySparkline(items: { createdAt: Date }[], days = 7): number[] {
    const result = Array(days).fill(0);
    const now = new Date();
    now.setHours(23, 59, 59, 999);
    items.forEach(item => {
        const daysAgo = Math.floor((now.getTime() - item.createdAt.getTime()) / 86400000);
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
            articlesCount,
            lessonsCount,
            quizzesCount,
            journalCount,
            commentsCount,
            tradingVolumeData,
            totalViewsData,
            rawUserGrowth,
            categoriesDistribution,
            // Trend: previous period counts
            prevUsersCount,
            prevArticlesCount,
            prevTradesCount,
            // Trend: recent period counts
            recentArticlesCount,
            recentTradesCount,
            // Sparkline: 7-day raw data
            rawArticles7d,
            rawTrades7d,
        ] = await Promise.all([
            prisma.user.count(),
            prisma.article.count(),
            prisma.lesson.count(),
            prisma.quiz.count(),
            prisma.journalEntry.count(),
            prisma.comment.count(),
            prisma.journalEntry.aggregate({ _sum: { lotSize: true } }),
            prisma.article.aggregate({ _sum: { views: true } }),
            prisma.user.findMany({
                where: { createdAt: { gte: thirtyDaysAgo } },
                select: { createdAt: true }
            }),
            prisma.category.findMany({
                include: { _count: { select: { articles: true } } }
            }),
            // Previous 30-day period
            prisma.user.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
            prisma.article.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
            prisma.journalEntry.count({ where: { createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } }),
            // Recent 30-day period
            prisma.article.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
            prisma.journalEntry.count({ where: { createdAt: { gte: thirtyDaysAgo } } }),
            // 7-day sparkline raw
            prisma.article.findMany({ where: { createdAt: { gte: sevenDaysAgo } }, select: { createdAt: true } }),
            prisma.journalEntry.findMany({ where: { createdAt: { gte: sevenDaysAgo } }, select: { createdAt: true } }),
        ]);

        // User Growth Chart (30 days)
        const userGrowthMap = new Map<string, number>();
        rawUserGrowth.forEach(user => {
            const date = user.createdAt.toISOString().split('T')[0];
            userGrowthMap.set(date, (userGrowthMap.get(date) || 0) + 1);
        });

        const userGrowthChart = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            userGrowthChart.push({ date: dateStr, count: userGrowthMap.get(dateStr) || 0 });
        }

        // Content Distribution
        const contentDistribution = categoriesDistribution
            .map(cat => ({ name: cat.name, value: cat._count.articles }))
            .filter(item => item.value > 0);

        // Sparklines
        const userSparkline = userGrowthChart.slice(-7).map(d => d.count);
        const articleSparkline = toDailySparkline(rawArticles7d);
        const tradeSparkline = toDailySparkline(rawTrades7d);

        // Trends
        const recentUsersCount = rawUserGrowth.length;

        return {
            users: { total: usersCount, sparkline: userSparkline, trendPercent: calcTrend(recentUsersCount, prevUsersCount) },
            articles: { total: articlesCount, sparkline: articleSparkline, trendPercent: calcTrend(recentArticlesCount, prevArticlesCount) },
            trades: { total: journalCount, sparkline: tradeSparkline, trendPercent: calcTrend(recentTradesCount, prevTradesCount) },
            views: { total: totalViewsData._sum.views || 0, sparkline: [] as number[], trendPercent: null },
            lessonsCount,
            quizzesCount,
            commentsCount,
            tradingVolume: tradingVolumeData._sum.lotSize || 0,
            userGrowthChart,
            contentDistribution,
        };
    },
    ['admin-dashboard-stats-v2'],
    { revalidate: 300, tags: ['admin-stats'] }
);

export default async function AdminDashboard() {
    const stats = await getStats();

    return (
        <div className="space-y-6 pb-10">
            {/* Zone 1: Welcome + Hero Stats + Compact Stats */}
            <AdminDashboardClient
                users={{ value: stats.users.total, sparkline: stats.users.sparkline, trendPercent: stats.users.trendPercent }}
                articles={{ value: stats.articles.total, sparkline: stats.articles.sparkline, trendPercent: stats.articles.trendPercent }}
                trades={{ value: stats.trades.total, sparkline: stats.trades.sparkline, trendPercent: stats.trades.trendPercent }}
                views={{ value: stats.views.total, sparkline: stats.views.sparkline, trendPercent: stats.views.trendPercent }}
                lessonsCount={stats.lessonsCount}
                quizzesCount={stats.quizzesCount}
                commentsCount={stats.commentsCount}
                tradingVolume={stats.tradingVolume}
            />

            {/* Zone 2: Charts */}
            <AnimatedSection delay={0.6}>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2">
                        <UserGrowthChart data={stats.userGrowthChart} />
                    </div>
                    <div className="flex flex-col gap-4">
                        <QuickActionsWidget />
                        <ContentDistributionChart data={stats.contentDistribution} />
                    </div>
                </div>
            </AnimatedSection>

            {/* Zone 3: Activity Widgets */}
            <AnimatedSection delay={0.8}>
                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-4 gap-4">
                    <Suspense fallback={<WidgetSkeleton />}>
                        <RecentTradesSuspense />
                    </Suspense>
                    <Suspense fallback={<WidgetSkeleton />}>
                        <TopLearnersSuspense />
                    </Suspense>
                    <Suspense fallback={<WidgetSkeleton />}>
                        <PopularArticlesSuspense />
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
        <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm h-full min-h-[350px] flex items-center justify-center animate-pulse">
            <div className="w-full space-y-4">
                <div className="h-6 bg-gray-200 dark:bg-white/5 rounded w-1/3 mx-auto mb-8" />
                {[1, 2, 3, 4, 5].map(i => (
                    <div key={i} className="flex gap-4 items-center">
                        <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-white/5" />
                        <div className="flex-1 space-y-2">
                            <div className="h-4 bg-gray-200 dark:bg-white/5 rounded w-2/3" />
                            <div className="h-3 bg-gray-200 dark:bg-white/5 rounded w-1/2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
