import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/analytics/content?period=7d|30d|90d
 * Returns per-article analytics with view counts, grouped by article.
 */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const period = request.nextUrl.searchParams.get('period') || '7d';
    const days = period === '90d' ? 90 : period === '30d' ? 30 : 7;

    const since = new Date();
    since.setDate(since.getDate() - days);

    try {
        // Get article-level pageviews by matching pathname pattern /articles/*
        const articleViews = await prisma.$queryRaw<Array<{
            pathname: string;
            views: bigint;
        }>>`
            SELECT pathname, COUNT(*)::bigint as views
            FROM page_views
            WHERE "createdAt" >= ${since}
              AND pathname LIKE '/articles/%'
              AND pathname NOT LIKE '/articles/create%'
            GROUP BY pathname
            ORDER BY views DESC
            LIMIT 30
        `;

        // Get article metadata for the matched pathnames
        const slugs = articleViews.map(a => {
            const parts = a.pathname.split('/');
            return parts[parts.length - 1] || parts[parts.length - 2];
        }).filter(Boolean);

        const articles = slugs.length > 0
            ? await prisma.article.findMany({
                where: { slug: { in: slugs } },
                select: {
                    slug: true,
                    title: true,
                    author: { select: { name: true } },
                    category: { select: { name: true } },
                    publishedAt: true,
                },
            })
            : [];

        const articleMap = new Map(articles.map(a => [a.slug, a]));

        // Build enriched content analytics
        const content = articleViews.map(av => {
            const slug = av.pathname.split('/').filter(Boolean).pop() || '';
            const article = articleMap.get(slug);
            return {
                pathname: av.pathname,
                slug,
                title: article?.title || slug,
                author: article?.author?.name || 'Unknown',
                category: article?.category?.name || 'Uncategorized',
                views: Number(av.views),
                publishedAt: article?.publishedAt?.toISOString() || null,
            };
        });

        // Author aggregation
        const authorMap = new Map<string, number>();
        content.forEach(c => {
            authorMap.set(c.author, (authorMap.get(c.author) || 0) + c.views);
        });
        const authors = Array.from(authorMap.entries())
            .map(([name, views]) => ({ name, views }))
            .sort((a, b) => b.views - a.views);

        // Category aggregation
        const categoryMap = new Map<string, number>();
        content.forEach(c => {
            categoryMap.set(c.category, (categoryMap.get(c.category) || 0) + c.views);
        });
        const categories = Array.from(categoryMap.entries())
            .map(([name, views]) => ({ name, views }))
            .sort((a, b) => b.views - a.views);

        return NextResponse.json({
            period,
            content,
            authors,
            categories,
            totalArticleViews: content.reduce((s, c) => s + c.views, 0),
        });
    } catch (error) {
        console.error('Content analytics error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
