
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import { ArticleList } from "@/components/admin/articles/ArticleList";
import { ArticleStatsClient } from "@/components/admin/articles/ArticleStatsClient";
import { AdminPageHeader } from "@/components/admin/AdminPageHeader";
import { Button } from "@/components/ui/Button";

export const dynamic = 'force-dynamic';

// ── Helper: 7-day daily article counts ──
async function getDailyArticleCounts(days: number, where?: Record<string, unknown>) {
    const counts: number[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const dayStart = new Date(now);
        dayStart.setDate(now.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const count = await prisma.article.count({
            where: {
                ...where,
                createdAt: { gte: dayStart, lte: dayEnd },
            },
        });
        counts.push(count);
    }
    return counts;
}

// ── Helper: 7-day daily view sums ──
async function getDailyViewSums(days: number) {
    const sums: number[] = [];
    const now = new Date();

    for (let i = days - 1; i >= 0; i--) {
        const dayStart = new Date(now);
        dayStart.setDate(now.getDate() - i);
        dayStart.setHours(0, 0, 0, 0);

        const dayEnd = new Date(dayStart);
        dayEnd.setHours(23, 59, 59, 999);

        const result = await prisma.article.aggregate({
            _sum: { views: true },
            where: { createdAt: { gte: dayStart, lte: dayEnd } },
        });
        sums.push(result._sum.views || 0);
    }
    return sums;
}

// ── Helper: 30d trend percent ──
async function getArticleTrend(where?: Record<string, unknown>) {
    const now = new Date();
    const d30 = new Date(now);
    d30.setDate(now.getDate() - 30);
    const d60 = new Date(now);
    d60.setDate(now.getDate() - 60);

    const [current, previous] = await Promise.all([
        prisma.article.count({ where: { ...where, createdAt: { gte: d30 } } }),
        prisma.article.count({ where: { ...where, createdAt: { gte: d60, lt: d30 } } }),
    ]);

    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
}

async function getHeroStats() {
    try {
        const [
            totalViews, avgViews, publishedCount, pendingCount,
            viewsSparkline, publishedSparkline, pendingSparkline,
            publishedTrend, pendingTrend,
        ] = await Promise.all([
            prisma.article.aggregate({ _sum: { views: true } }),
            prisma.article.aggregate({ _avg: { views: true } }),
            prisma.article.count({ where: { status: "PUBLISHED" } }),
            prisma.article.count({ where: { status: "PENDING" } }),
            getDailyViewSums(7),
            getDailyArticleCounts(7, { status: "PUBLISHED" }),
            getDailyArticleCounts(7, { status: "PENDING" }),
            getArticleTrend({ status: "PUBLISHED" }),
            getArticleTrend({ status: "PENDING" }),
        ]);

        return {
            totalViews: { value: totalViews._sum.views || 0, sparkline: viewsSparkline, trendPercent: null },
            avgViews: { value: Math.round(avgViews._avg.views || 0), sparkline: viewsSparkline, trendPercent: null },
            published: { value: publishedCount, sparkline: publishedSparkline, trendPercent: publishedTrend },
            pending: { value: pendingCount, sparkline: pendingSparkline, trendPercent: pendingTrend },
        };
    } catch (error) {
        console.error("Error fetching article hero stats:", error);
        const empty = { value: 0, sparkline: [0, 0, 0, 0, 0, 0, 0], trendPercent: null };
        return { totalViews: empty, avgViews: empty, published: empty, pending: empty };
    }
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

    const [heroStats, articles, totalArticlesCount] = await Promise.all([
        getHeroStats(),
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
            <AdminPageHeader
                title="Article Management"
                description="Manage blog posts, track performance and analytics."
            >
                <Link href="/admin/articles/create">
                    <Button variant="primary" className="shadow-lg shadow-primary/30">
                        <Plus size={18} strokeWidth={2.5} />
                        Add New
                    </Button>
                </Link>
            </AdminPageHeader>

            {/* Animated Hero Stats */}
            <ArticleStatsClient
                totalViews={heroStats.totalViews}
                avgViews={heroStats.avgViews}
                published={heroStats.published}
                pending={heroStats.pending}
            />

            {/* List with Filters & Bulk Actions */}
            <ArticleList
                initialArticles={articles as any}
                pagination={{ currentPage: page, totalPages }}
            />
        </div>
    );
}
