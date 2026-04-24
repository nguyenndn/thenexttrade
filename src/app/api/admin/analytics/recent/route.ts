import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/analytics/recent
 * Returns recent pageviews (last 15 min) for the real-time visitors table.
 */
export async function GET() {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const fifteenMinAgo = new Date();
    fifteenMinAgo.setMinutes(fifteenMinAgo.getMinutes() - 15);

    try {
        const recent = await prisma.pageView.findMany({
            where: { createdAt: { gte: fifteenMinAgo } },
            orderBy: { createdAt: 'desc' },
            take: 50,
            select: {
                sessionId: true,
                pathname: true,
                country: true,
                device: true,
                browser: true,
                createdAt: true,
            },
        });

        return NextResponse.json(recent);
    } catch (error) {
        console.error('Recent visitors error:', error);
        return NextResponse.json([], { status: 500 });
    }
}
