import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/analytics/events?period=7d|30d|90d
 * Returns custom event data + conversion funnel.
 */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const period = request.nextUrl.searchParams.get('period') || '7d';
    const days = period === '90d' ? 90 : period === '30d' ? 30 : 7;

    const since = new Date();
    since.setDate(since.getDate() - days);

    try {
        const [
            eventCounts,
            recentEvents,
            // Funnel data
            totalVisitors,
            interestedCount,
            signedUpCount,
            activatedCount,
        ] = await Promise.all([
            // Event breakdown by name
            prisma.analyticsEvent.groupBy({
                by: ['name'],
                where: { createdAt: { gte: since } },
                _count: { _all: true },
                orderBy: { _count: { name: 'desc' } },
            }),

            // Recent events (last 20)
            prisma.analyticsEvent.findMany({
                where: { createdAt: { gte: since } },
                orderBy: { createdAt: 'desc' },
                take: 20,
                select: {
                    id: true,
                    name: true,
                    data: true,
                    pathname: true,
                    country: true,
                    createdAt: true,
                },
            }),

            // Funnel: Total unique visitors
            prisma.pageView.groupBy({
                by: ['sessionId'],
                where: { createdAt: { gte: since } },
            }).then(r => r.length),

            // Funnel: Interested (clicked CTA)
            prisma.analyticsEvent.groupBy({
                by: ['sessionId'],
                where: {
                    createdAt: { gte: since },
                    name: { in: ['click_open_account', 'click_download_ea'] },
                },
            }).then(r => r.length),

            // Funnel: Signed up
            prisma.analyticsEvent.count({
                where: {
                    createdAt: { gte: since },
                    name: 'signup_complete',
                },
            }),

            // Funnel: Activated (first trade sync)
            prisma.analyticsEvent.count({
                where: {
                    createdAt: { gte: since },
                    name: 'first_trade_sync',
                },
            }),
        ]);

        return NextResponse.json({
            period,
            events: eventCounts.map(e => ({
                name: e.name,
                count: e._count._all,
            })),
            recentEvents,
            funnel: {
                visitors: totalVisitors,
                interested: interestedCount,
                signedUp: signedUpCount,
                activated: activatedCount,
            },
        });
    } catch (error) {
        console.error('Admin analytics events error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
