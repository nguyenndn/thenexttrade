import { prisma } from "@/lib/prisma";
import { Users, FileText, GraduationCap, BrainCircuit, Activity, BarChart3, MessageSquare, Eye } from "lucide-react";
import { UserGrowthChart } from "@/components/admin/charts/UserGrowthChart";
import { ContentDistributionChart } from "@/components/admin/charts/ContentDistributionChart";
import { RecentTradesWidget } from "@/components/admin/widgets/RecentTradesWidget";
import { TopLearnersWidget } from "@/components/admin/widgets/TopLearnersWidget";
import { PopularArticlesWidget } from "@/components/admin/widgets/PopularArticlesWidget";
import { QuickActionsWidget } from "@/components/admin/widgets/QuickActionsWidget";

export const dynamic = 'force-dynamic';

interface StatCardProps {
    title: string;
    value: string;
    change?: string;
    icon: any;
    trend?: "up" | "down" | "neutral";
    color?: "blue" | "emerald" | "violet" | "amber" | "cyan" | "indigo" | "rose" | "green";
}

function StatCard({ title, value, change, icon: Icon, trend, color = "blue" }: StatCardProps) {
    const colorStyles = {
        blue: "bg-blue-50/50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 ring-1 ring-blue-500/20",
        emerald: "bg-emerald-50/50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 ring-1 ring-emerald-500/20",
        violet: "bg-violet-50/50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 ring-1 ring-violet-500/20",
        amber: "bg-amber-50/50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 ring-1 ring-amber-500/20",
        cyan: "bg-cyan-50/50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400 ring-1 ring-cyan-500/20",
        indigo: "bg-indigo-50/50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 ring-1 ring-indigo-500/20",
        rose: "bg-rose-50/50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 ring-1 ring-rose-500/20",
        green: "bg-green-50/50 text-green-600 dark:bg-green-500/10 dark:text-green-400 ring-1 ring-green-500/20",
    };

    return (
        <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{title}</p>
                    <h3 className="text-3xl font-black mt-2 text-gray-900 dark:text-white tracking-tight">{value}</h3>
                </div>
                <div className={`p-3.5 rounded-xl ${colorStyles[color]} transition-colors`}>
                    <Icon size={24} strokeWidth={2.5} />
                </div>
            </div>
            {change && (
                <div className="mt-4 flex items-center text-sm font-medium">
                    <span className={`px-2 py-0.5 rounded-md ${trend === "up" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : trend === "down" ? "bg-red-50 text-red-600 dark:bg-red-500/10" : "bg-gray-50 text-gray-500 dark:bg-gray-500/10"}`}>
                        {change}
                    </span>
                    <span className="text-gray-400 ml-2 text-xs uppercase tracking-wide">vs last month</span>
                </div>
            )}
        </div>
    );
}

import { unstable_cache } from "next/cache";

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
            recentTrades,
            rawTopUsers,
            popularArticles,
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
            prisma.journalEntry.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' },
                include: { user: { select: { name: true, image: true } } }
            }),
            prisma.user.findMany({
                take: 5,
                orderBy: { progress: { _count: 'desc' } },
                include: {
                    _count: { select: { progress: true } }
                }
            }),
            prisma.article.findMany({
                take: 5,
                orderBy: { views: 'desc' },
                include: { author: { select: { name: true } } }
            }),
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

        // Transform Top Users
        const topLearners = rawTopUsers.map(user => ({
            id: user.id,
            name: user.name,
            image: user.image,
            email: user.email,
            progressCount: user._count.progress
        }));

        // Transform Recent Trades
        const formattedTrades = recentTrades.map(trade => ({
            ...trade,
            type: trade.type as "BUY" | "SELL"
        }));

        return {
            usersCount,
            articlesCount,
            lessonsCount,
            quizzesCount,
            journalCount,
            commentsCount,
            tradingVolume: tradingVolumeData._sum.lotSize || 0,
            recentTrades: formattedTrades,
            topLearners,
            popularArticles,
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
        <div className="space-y-10 pb-10">
            {/* Premium Header */}
            {/* Standard Header */}
            {/* Standard Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-100 dark:border-white/5 pb-8">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                            Dashboard Overview
                        </h1>
                    </div>
                    <p className="text-lg text-gray-500 dark:text-gray-400 font-medium pl-4.5">
                        Welcome back! Here's what's happening in your platform today.
                    </p>
                </div>
            </div>

            {/* Core Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2">
                    <UserGrowthChart data={stats.userGrowthChart} />
                </div>
                <div className="flex flex-col gap-6">
                    <QuickActionsWidget />
                    <ContentDistributionChart data={stats.contentDistribution} />
                </div>
            </div>

            {/* Detailed Widgets Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div className="h-[400px]">
                    <RecentTradesWidget trades={stats.recentTrades} />
                </div>
                <div className="h-[400px]">
                    <TopLearnersWidget users={stats.topLearners} />
                </div>
                <div className="h-[400px]">
                    <PopularArticlesWidget articles={stats.popularArticles} />
                </div>
            </div>
        </div>
    );
}
