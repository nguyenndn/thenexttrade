import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getGeoFromHeaders, generateSessionId } from '@/lib/analytics';
import { getAuthUser } from '@/lib/auth-cache';

export const dynamic = 'force-dynamic';

// Rate limit: 30 events/min per session
const eventRateMap = new Map<string, { count: number; windowStart: number }>();

/**
 * Public endpoint for client-side custom event tracking.
 * POST /api/analytics/event
 * Body: { name: string, data?: Record<string, string>, pathname?: string }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, data, pathname } = body;

        if (!name || typeof name !== 'string') {
            return NextResponse.json({ error: 'Event name required' }, { status: 400 });
        }

        // Validate event name length
        if (name.length > 100) {
            return NextResponse.json({ error: 'Event name too long' }, { status: 400 });
        }

        const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? '127.0.0.1';
        const ua = request.headers.get('user-agent') ?? '';
        const sessionId = generateSessionId(ip, ua);

        // Rate limit check
        const now = Date.now();
        const rateKey = `event:${sessionId}`;
        const entry = eventRateMap.get(rateKey);

        if (entry && now - entry.windowStart < 60_000) {
            entry.count++;
            if (entry.count > 30) {
                return NextResponse.json({ error: 'Rate limited' }, { status: 429 });
            }
        } else {
            eventRateMap.set(rateKey, { count: 1, windowStart: now });
        }

        const geo = getGeoFromHeaders(request.headers);

        // Attach userId when logged in (non-blocking, never fail)
        const user = await getAuthUser().catch(() => null);

        await prisma.analyticsEvent.create({
            data: {
                name,
                data: data || undefined,
                pathname: pathname || null,
                country: geo.country,
                sessionId,
                userId: user?.id ?? null,
            },
        });

        return NextResponse.json({ ok: true });
    } catch (error) {
        console.error('Analytics event error:', error);
        return NextResponse.json({ error: 'Internal error' }, { status: 500 });
    }
}
