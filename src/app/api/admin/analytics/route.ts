import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/analytics?period=7d|30d|90d
 * Returns aggregated analytics data for admin dashboard.
 */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const period = request.nextUrl.searchParams.get('period') || '7d';
    const days = period === '90d' ? 90 : period === '30d' ? 30 : 7;

    const since = new Date();
    since.setDate(since.getDate() - days);

    const fiveMinAgo = new Date();
    fiveMinAgo.setMinutes(fiveMinAgo.getMinutes() - 5);

    try {
        const [
            pageviews,
            uniqueVisitors,
            realTimeCount,
            topCountries,
            topPages,
            topReferrers,
            deviceBreakdown,
            browserBreakdown,
            dailyPageviews,
        ] = await Promise.all([
            // Total pageviews
            prisma.pageView.count({
                where: { createdAt: { gte: since } },
            }),

            // Unique visitors (distinct sessionId)
            prisma.pageView.groupBy({
                by: ['sessionId'],
                where: { createdAt: { gte: since } },
            }).then(r => r.length),

            // Real-time (last 5 min)
            prisma.pageView.groupBy({
                by: ['sessionId'],
                where: { createdAt: { gte: fiveMinAgo } },
            }).then(r => r.length),

            // Top countries
            prisma.pageView.groupBy({
                by: ['country'],
                where: { createdAt: { gte: since }, country: { not: null } },
                _count: { _all: true },
                orderBy: { _count: { country: 'desc' } },
                take: 20,
            }),

            // Top pages
            prisma.pageView.groupBy({
                by: ['pathname'],
                where: { createdAt: { gte: since } },
                _count: { _all: true },
                orderBy: { _count: { pathname: 'desc' } },
                take: 15,
            }),

            // Top referrers
            prisma.pageView.groupBy({
                by: ['referrer'],
                where: {
                    createdAt: { gte: since },
                    referrer: { not: null },
                },
                _count: { _all: true },
                orderBy: { _count: { referrer: 'desc' } },
                take: 10,
            }),

            // Device breakdown
            prisma.pageView.groupBy({
                by: ['device'],
                where: { createdAt: { gte: since }, device: { not: null } },
                _count: { _all: true },
            }),

            // Browser breakdown
            prisma.pageView.groupBy({
                by: ['browser'],
                where: { createdAt: { gte: since }, browser: { not: null } },
                _count: { _all: true },
                orderBy: { _count: { browser: 'desc' } },
                take: 8,
            }),

            // Daily pageview trend
            prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
                SELECT DATE("createdAt" AT TIME ZONE 'UTC') as date, COUNT(*)::bigint as count
                FROM page_views
                WHERE "createdAt" >= ${since}
                GROUP BY DATE("createdAt" AT TIME ZONE 'UTC')
                ORDER BY date ASC
            `,
        ]);

        // Fill missing days in trend
        const trendMap = new Map<string, number>();
        dailyPageviews.forEach(d => {
            const dateStr = typeof d.date === 'string' ? d.date : new Date(d.date).toISOString().split('T')[0];
            trendMap.set(dateStr, Number(d.count));
        });

        const trend = [];
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            trend.push({ date: dateStr, views: trendMap.get(dateStr) || 0 });
        }

        return NextResponse.json({
            period,
            summary: {
                pageviews,
                uniqueVisitors,
                realTimeVisitors: realTimeCount,
                avgPagesPerVisitor: uniqueVisitors > 0
                    ? Math.round((pageviews / uniqueVisitors) * 10) / 10
                    : 0,
            },
            trend,
            topCountries: topCountries.map(c => ({
                country: c.country,
                views: c._count._all,
            })),
            topPages: topPages.map(p => ({
                pathname: p.pathname,
                views: p._count._all,
            })),
            topReferrers: topReferrers.map(r => ({
                referrer: r.referrer,
                views: r._count._all,
            })),
            devices: deviceBreakdown.map(d => ({
                device: d.device,
                count: d._count._all,
            })),
            browsers: browserBreakdown.map(b => ({
                browser: b.browser,
                count: b._count._all,
            })),
        });
    } catch (error) {
        console.error('Admin analytics error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
