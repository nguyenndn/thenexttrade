import { prisma } from "@/lib/prisma";
import { Users, FileText, Activity, Layers } from "lucide-react";
import { StatsWidget } from "@/components/admin/widgets/StatsWidget";
import { RecentTradesWidget } from "@/components/admin/widgets/RecentTradesWidget";
import { PopularArticlesWidget } from "@/components/admin/widgets/PopularArticlesWidget";
import { TopLearnersWidget } from "@/components/admin/widgets/TopLearnersWidget";
import { UserGrowthChart } from "@/components/admin/charts/UserGrowthChart";
import { PendingActionsWidget } from "@/components/admin/widgets/PendingActionsWidget";
import { RecentSignupsWidget } from "@/components/admin/widgets/RecentSignupsWidget";

export const dynamic = 'force-dynamic';

export default async function AdminDashboard() {
    // 1. Get current date for charts/stats
    const now = new Date();
    const thirtyDaysAgo = new Date(now.setDate(now.getDate() - 30));

    // Parallel data fetching for performance
    const [
        usersCount,
        articlesCount,
        totalViewsData,
        tradesCount,
        recentTrades,
        popularArticles,
        topLearners,
        recentSignups,
        pendingArticles,
        userGrowthData
    ] = await Promise.all([
        // 1. Stats
        prisma.user.count(),
        prisma.article.count({ where: { status: 'PUBLISHED' } }),
        prisma.article.aggregate({ _sum: { views: true } }),
        prisma.journalEntry.count(),
        
        // 2. Recent Trades
        prisma.journalEntry.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            include: {
                user: {
                    select: { name: true, image: true }
                }
            }
        }),
        
        // 3. Popular Articles
        prisma.article.findMany({
            where: { status: 'PUBLISHED' },
            take: 5,
            orderBy: { views: 'desc' },
            select: {
                id: true,
                title: true,
                views: true,
                createdAt: true,
                author: {
                    select: { name: true }
                }
            }
        }),
        
        // 4. Top Learners (Users with most completed lessons)
        prisma.user.findMany({
            take: 5,
            orderBy: {
                progress: {
                    _count: 'desc'
                }
            },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                _count: {
                    select: { progress: { where: { isCompleted: true } } }
                }
            }
        }),

        // 5. Recent Signups
        prisma.user.findMany({
            take: 5,
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                name: true,
                email: true,
                image: true,
                createdAt: true
            }
        }),

        // 6. Pending Actions (Articles)
        prisma.article.findMany({
            where: { status: 'PENDING' },
            take: 5,
            orderBy: { updatedAt: 'desc' },
            select: {
                id: true,
                title: true,
                createdAt: true,
                author: { select: { name: true } }
            }
        }),

        // 7. User Growth Data (Group by date - simplified for this example)
        // Note: In real production, use raw SQL for aggregation or a dedicated analytics service
        prisma.user.findMany({
            where: {
                createdAt: {
                    gte: thirtyDaysAgo
                }
            },
            select: {
                createdAt: true
            }
        })
    ]);

    // Process User Growth Data
    const growthMap = new Map<string, number>();
    userGrowthData.forEach(user => {
        const dateStr = user.createdAt.toISOString().split('T')[0];
        growthMap.set(dateStr, (growthMap.get(dateStr) || 0) + 1);
    });
    
    // Sort and format for chart
    const growthChartData = Array.from(growthMap.entries())
        .map(([date, count]) => ({ date, count }))
        .sort((a, b) => a.date.localeCompare(b.date));

    // Fill missing dates with 0 (Optional but better for charts) - Skipping for brevity

    // Format data for widgets
    const formattedTopLearners = topLearners.map(user => ({
        ...user,
        progressCount: user._count.progress
    }));

    const formattedPendingItems = pendingArticles.map(article => ({
        id: article.id,
        title: article.title,
        type: "ARTICLE" as const,
        createdAt: article.createdAt,
        author: article.author.name || "Unknown"
    }));

    return (
        <div className="p-6 space-y-4">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <h1 className="text-xl font-bold text-gray-900 dark:text-white">Dashboard Overview</h1>
                    <p className="text-gray-500 dark:text-gray-400">Welcome back to the Admin Dashboard</p>
                </div>
            </div>

            {/* 1. Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <StatsWidget
                    title="Total Users"
                    value={usersCount}
                    icon={Users}
                    color="blue"
                    trend={{ value: 12, label: "this month", isPositive: true }}
                />
                <StatsWidget
                    title="Published Articles"
                    value={articlesCount}
                    icon={FileText}
                    color="green"
                    trend={{ value: 5, label: "this week", isPositive: true }}
                />
                <StatsWidget
                    title="Total Views"
                    value={totalViewsData._sum.views || 0}
                    icon={Activity}
                    color="purple"
                    trend={{ value: 8, label: "vs last week", isPositive: true }}
                />
                <StatsWidget
                    title="Journal Entries"
                    value={tradesCount}
                    icon={Layers}
                    color="orange"
                    trend={{ value: 2, label: "today", isPositive: false }}
                />
            </div>

            {/* 2. Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column (2/3) */}
                <div className="xl:col-span-2 space-y-6">
                    {/* Growth Chart */}
                    <div className="h-[400px]">
                        <UserGrowthChart data={growthChartData} />
                    </div>

                    {/* Pending Actions & Recent Trades */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
                        <PendingActionsWidget items={formattedPendingItems} />
                        <RecentTradesWidget trades={recentTrades as any} />
                    </div>
                </div>

                {/* Right Column (1/3) */}
                <div className="space-y-6">
                    <div className="h-[400px]">
                        <RecentSignupsWidget users={recentSignups} />
                    </div>
                    <div className="h-[400px]">
                        <PopularArticlesWidget articles={popularArticles as any} />
                    </div>
                    {/* Top Learners moved to bottom or specific report page if too crowded */}
                </div>
            </div>
        </div>
    );
}

