import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

/**
 * Internal endpoint — called by middleware to record pageviews.
 * Protected by x-internal header check.
 */
export async function POST(request: NextRequest) {
    // Only accept internal requests
    const internalHeader = request.headers.get('x-internal-analytics');
    if (internalHeader !== '1') {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { pathname, referrer, country, city, region, device, browser, os, sessionId } = body;

        if (!pathname || !sessionId) {
            return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
        }

        await prisma.pageView.create({
            data: {
                pathname,
                referrer: referrer || null,
                country: country || null,
                city: city || null,
                region: region || null,
                device: device || null,
                browser: browser || null,
                os: os || null,
                sessionId,
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Analytics collect error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
