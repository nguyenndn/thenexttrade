
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Eye, BarChart2, Globe, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { ArticleList } from "@/components/admin/articles/ArticleList";
import { StatCard } from "@/components/admin/widgets/StatCard";

export const dynamic = 'force-dynamic';

async function getArticleStats() {
    const [statusGroups, views, totalArticles] = await Promise.all([
        prisma.article.groupBy({
            by: ['status'],
            _count: true
        }),
        prisma.article.aggregate({
            _sum: { views: true },
            _avg: { views: true }
        }),
        prisma.article.count()
    ]);

    const statusMap = statusGroups.reduce((acc, curr) => {
        acc[curr.status] = curr._count;
        return acc;
    }, {} as Record<string, number>);

    return {
        totalArticles,
        publishedArticles: statusMap['PUBLISHED'] || 0,
        pendingArticles: statusMap['PENDING'] || 0,
        totalViews: views._sum.views || 0,
        avgViews: Math.round(views._avg.views || 0),
    };
}

interface PageProps {
    searchParams: Promise<{
        page?: string;
        q?: string;
        status?: string;
        author?: string;
    }>;
}

export default async function AdminArticlesPage({ searchParams }: PageProps) {
    const params = await searchParams;
    const page = parseInt(params.page || "1");
    const query = params.q || "";
    const status = params.status;
    const authorId = params.author;
    const limit = 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (query) {
        where.OR = [
            { title: { contains: query, mode: "insensitive" } },
            { slug: { contains: query, mode: "insensitive" } }
        ];
    }

    if (status) {
        where.status = status;
    }

    if (authorId) {
        where.authorId = authorId;
    }

    const [stats, articles, totalArticlesCount] = await Promise.all([
        getArticleStats(),
        prisma.article.findMany({
            where,
            select: {
                id: true,
                title: true,
                slug: true,
                status: true,
                views: true,
                isFeatured: true,
                thumbnail: true,
                createdAt: true,
                updatedAt: true,
                authorId: true,
                categoryId: true,
                excerpt: true,
                category: { select: { id: true, name: true } },
                author: { select: { id: true, name: true, image: true } }
            },
            orderBy: { createdAt: "desc" },
            skip,
            take: limit
        }),
        prisma.article.count({ where })
    ]);



    const totalPages = Math.ceil(totalArticlesCount / limit);

    return (
        <div className="space-y-4 pb-10">
            {/* Header */}
            {/* ... */}
            {/* Using strict select means we might miss 'content', casting to any as List doesn't need content */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 dark:border-white/10 pb-8">
                {/* ... Header Content ... */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                            Article Management
                        </h1>
                    </div>
                    <p className="text-lg text-gray-500 dark:text-gray-400 font-medium pl-4.5">
                        Manage blog posts, track performance and analytics.
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Link
                        href="/admin/articles/create"
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-[#00C888] text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-primary/30 active:scale-95 active:translate-y-0"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        Add New
                    </Link>
                </div>
            </div>

            {/* Stats Grid - Premium Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard
                    title="Total Views"
                    value={stats.totalViews.toLocaleString()}
                    icon={Eye}
                    color="indigo"
                />
                <StatCard
                    title="Avg. Read"
                    value={stats.avgViews.toLocaleString()}
                    icon={BarChart2}
                    color="amber"
                />
                <StatCard
                    title="Published"
                    value={`${stats.publishedArticles} / ${stats.totalArticles}`}
                    icon={Globe}
                    color="emerald"
                />
                <StatCard
                    title="Pending"
                    value={stats.pendingArticles}
                    icon={Clock}
                    color="amber"
                />
            </div>

            {/* List with Filters & Bulk Actions */}
            <ArticleList
                initialArticles={articles as any}
                pagination={{ currentPage: page, totalPages }}
            />
        </div>
    );
}
