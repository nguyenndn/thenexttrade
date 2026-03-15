import { prisma } from "@/lib/prisma";
import { unstable_cache } from "next/cache";
import { Suspense } from "react";
import { Users, FileText, GraduationCap, BrainCircuit, Activity, BarChart3, MessageSquare, Eye } from "lucide-react";
import { StatCard } from "@/components/admin/widgets/StatCard";
import { UserGrowthChart } from "@/components/admin/charts/UserGrowthChart";
import { ContentDistributionChart } from "@/components/admin/charts/ContentDistributionChart";
import { QuickActionsWidget } from "@/components/admin/widgets/QuickActionsWidget";
import { TopLearnersSuspense } from "@/components/admin/dashboard/TopLearnersSuspense";
import { RecentTradesSuspense } from "@/components/admin/dashboard/RecentTradesSuspense";
import { PopularArticlesSuspense } from "@/components/admin/dashboard/PopularArticlesSuspense";

export const dynamic = 'force-dynamic';

const getStats = unstable_cache(
    async () => {
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

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
            categoriesDistribution
        ] = await Promise.all([
            prisma.user.count(),
            prisma.article.count(),
            prisma.lesson.count(),
            prisma.quiz.count(),
            prisma.journalEntry.count(),
            prisma.comment.count(),
            prisma.journalEntry.aggregate({ _sum: { lotSize: true } }),
            prisma.article.aggregate({ _sum: { views: true } }),
            // Use 'findMany' with minimal select for growth chart (Efficient for <10k users)
            // For larger datasets, consider using a raw query for date grouping.
            prisma.user.findMany({
                where: { createdAt: { gte: thirtyDaysAgo } },
                select: { createdAt: true }
            }),
            prisma.category.findMany({
                include: {
                    _count: { select: { articles: true } }
                }
            })
        ]);

        // Process User Growth Data
        const userGrowthMap = new Map<string, number>();
        rawUserGrowth.forEach(user => {
            const date = user.createdAt.toISOString().split('T')[0];
            userGrowthMap.set(date, (userGrowthMap.get(date) || 0) + 1);
        });

        // Fill in missing days
        const userGrowthChart = [];
        for (let i = 29; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            userGrowthChart.push({
                date: dateStr,
                count: userGrowthMap.get(dateStr) || 0
            });
        }

        // Process Content Distribution
        const contentDistribution = categoriesDistribution.map(cat => ({
            name: cat.name,
            value: cat._count.articles
        })).filter(item => item.value > 0);

        return {
            usersCount,
            articlesCount,
            lessonsCount,
            quizzesCount,
            journalCount,
            commentsCount,
            tradingVolume: tradingVolumeData._sum.lotSize || 0,
            userGrowthChart,
            contentDistribution,
            totalViews: totalViewsData._sum.views || 0
        };
    },
    ['admin-dashboard-stats'],
    {
        revalidate: 300, // Optimize: Cache for 5 minutes instead of 60s
        tags: ['admin-stats']
    }
);

export default async function AdminDashboard() {
    const stats = await getStats();

    return (
        <div className="space-y-4 pb-10">
            {/* Dashboard Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-4">
                <div className="flex flex-col gap-2">
                    <h1 className="sr-only">Dashboard Overview</h1>
                <p className="text-base text-primary font-bold">
                        Welcome back! Here's what's happening in your platform today.
                    </p>
                </div>
            </div>

            {/* Core Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Users"
                    value={stats.usersCount.toLocaleString()}
                    change="+12%"
                    trend="up"
                    icon={Users}
                    color="blue"
                />
                <StatCard
                    title="Published Articles"
                    value={stats.articlesCount.toLocaleString()}
                    change="+5%"
                    trend="up"
                    icon={FileText}
                    color="emerald"
                />
                <StatCard
                    title="Academy Lessons"
                    value={stats.lessonsCount.toLocaleString()}
                    change="New content"
                    trend="neutral"
                    icon={GraduationCap}
                    color="violet"
                />
                <StatCard
                    title="Active Quizzes"
                    value={stats.quizzesCount.toLocaleString()}
                    change="+2 features"
                    trend="up"
                    icon={BrainCircuit}
                    color="amber"
                />
            </div>

            {/* Secondary Stats Grid (Trading Focus) */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Trading Logs"
                    value={stats.journalCount.toLocaleString()}
                    change="Active traders"
                    trend="up"
                    icon={Activity}
                    color="cyan"
                />
                <StatCard
                    title="Volume Traded"
                    value={`${stats.tradingVolume.toFixed(2)} Lots`}
                    change="Platform wide"
                    trend="neutral"
                    icon={BarChart3}
                    color="indigo"
                />
                <StatCard
                    title="Total Comments"
                    value={stats.commentsCount.toLocaleString()}
                    icon={MessageSquare}
                    color="rose"
                    trend="up"
                    change="Community interaction"
                />
                <StatCard
                    title="Total Views"
                    value={stats.totalViews.toLocaleString()}
                    change="Across all articles"
                    trend="up"
                    icon={Eye}
                    color="green"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="lg:col-span-2">
                    <UserGrowthChart data={stats.userGrowthChart} />
                </div>
                <div className="flex flex-col gap-6">
                    <QuickActionsWidget />
                    <ContentDistributionChart data={stats.contentDistribution} />
                </div>
            </div>

            {/* Detailed Widgets Grid with Suspense Component Streaming */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                <div className="h-[400px]">
                    <Suspense fallback={<WidgetSkeleton />}>
                        <RecentTradesSuspense />
                    </Suspense>
                </div>
                <div className="h-[400px]">
                    <Suspense fallback={<WidgetSkeleton />}>
                        <TopLearnersSuspense />
                    </Suspense>
                </div>
                <div className="h-[400px]">
                    <Suspense fallback={<WidgetSkeleton />}>
                        <PopularArticlesSuspense />
                    </Suspense>
                </div>
            </div>
        </div>
    );
}

function WidgetSkeleton() {
    return (
        <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm h-full flex items-center justify-center animate-pulse">
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
