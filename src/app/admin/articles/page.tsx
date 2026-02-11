
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus, Eye, BarChart2, Globe, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { ArticleList } from "@/components/admin/articles/ArticleList";

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

    // Fetch Authors for filter (Optimized: only fetch ID/Name)
    const authors = await prisma.user.findMany({
        where: { profile: { role: { in: ["ADMIN", "EDITOR"] } } },
        select: { id: true, name: true }
    });

    const totalPages = Math.ceil(totalArticlesCount / limit);

    return (
        <div className="space-y-10 pb-10">
            {/* Header */}
            {/* ... */}
            {/* Using strict select means we might miss 'content', casting to any as List doesn't need content */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-100 dark:border-white/5 pb-8">
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
                        className="flex items-center gap-2 px-6 py-2.5 bg-primary hover:bg-[#00a872] text-white font-bold text-sm rounded-xl transition-all shadow-lg shadow-primary/30 hover:-translate-y-1 active:scale-95 active:translate-y-0"
                    >
                        <Plus size={18} strokeWidth={2.5} />
                        Add New
                    </Link>
                </div>
            </div>

            {/* Stats Grid - Premium Style */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-indigo-500 uppercase tracking-wider">Total Views</p>
                            <h3 className="text-3xl font-black mt-2 text-gray-900 dark:text-white tracking-tight">{stats.totalViews.toLocaleString()}</h3>
                        </div>
                        <div className="p-3.5 rounded-xl bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 ring-1 ring-indigo-500/20">
                            <Eye size={24} strokeWidth={2.5} />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-orange-500 uppercase tracking-wider">Avg. Read</p>
                            <h3 className="text-3xl font-black mt-2 text-gray-900 dark:text-white tracking-tight">{stats.avgViews.toLocaleString()}</h3>
                        </div>
                        <div className="p-3.5 rounded-xl bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 ring-1 ring-orange-500/20">
                            <BarChart2 size={24} strokeWidth={2.5} />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-emerald-500 uppercase tracking-wider">Published</p>
                            <h3 className="text-3xl font-black mt-2 text-gray-900 dark:text-white tracking-tight">{stats.publishedArticles} <span className="text-lg text-gray-400 font-medium">/ {stats.totalArticles}</span></h3>
                        </div>
                        <div className="p-3.5 rounded-xl bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 ring-1 ring-emerald-500/20">
                            <Globe size={24} strokeWidth={2.5} />
                        </div>
                    </div>
                </div>
                <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-sm font-bold text-amber-500 uppercase tracking-wider">Pending</p>
                            <h3 className="text-3xl font-black mt-2 text-gray-900 dark:text-white tracking-tight">{stats.pendingArticles}</h3>
                        </div>
                        <div className="p-3.5 rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 ring-1 ring-amber-500/20">
                            <Clock size={24} strokeWidth={2.5} />
                        </div>
                    </div>
                </div>
            </div>

            {/* List with Filters & Bulk Actions */}
            <ArticleList
                initialArticles={articles as any}
                authors={authors.map(a => ({ id: a.id, name: a.name || "Unknown" }))}
                pagination={{ currentPage: page, totalPages }}
            />
        </div>
    );
}
