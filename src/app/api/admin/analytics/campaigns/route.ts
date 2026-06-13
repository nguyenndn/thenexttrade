import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireAdmin } from '@/lib/api-auth';

export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/analytics/campaigns?period=7d|30d|90d
 * Returns UTM campaign analytics.
 */
export async function GET(request: NextRequest) {
 const auth = await requireAdmin();
 if (auth instanceof NextResponse) return auth;

 const period = request.nextUrl.searchParams.get('period') || '7d';
 const days = period === '90d' ? 90 : period === '30d' ? 30 : 7;

 const since = new Date();
 since.setDate(since.getDate() - days);

 try {
 // Campaign-level aggregation
 const campaigns = await prisma.$queryRaw<Array<{
 utm_campaign: string;
 utm_source: string;
 utm_medium: string;
 views: bigint;
 unique_visitors: bigint;
 }>>`
 SELECT
 COALESCE("utmCampaign", '(not set)') as utm_campaign,
 COALESCE("utmSource", '(not set)') as utm_source,
 COALESCE("utmMedium", '(not set)') as utm_medium,
 COUNT(*)::bigint as views,
 COUNT(DISTINCT "sessionId")::bigint as unique_visitors
 FROM page_views
 WHERE "createdAt" >= ${since}
 AND ("utmSource" IS NOT NULL OR "utmMedium" IS NOT NULL OR "utmCampaign" IS NOT NULL)
 GROUP BY "utmCampaign", "utmSource", "utmMedium"
 ORDER BY views DESC
 LIMIT 20
 `;

 // Source-level aggregation
 const sources = await prisma.$queryRaw<Array<{
 utm_source: string;
 views: bigint;
 }>>`
 SELECT
 COALESCE("utmSource", '(not set)') as utm_source,
 COUNT(*)::bigint as views
 FROM page_views
 WHERE "createdAt" >= ${since}
 AND "utmSource" IS NOT NULL
 GROUP BY "utmSource"
 ORDER BY views DESC
 LIMIT 10
 `;

 return NextResponse.json({
 period,
 campaigns: campaigns.map(c => ({
 campaign: c.utm_campaign,
 source: c.utm_source,
 medium: c.utm_medium,
 views: Number(c.views),
 uniqueVisitors: Number(c.unique_visitors),
 })),
 sources: sources.map(s => ({
 source: s.utm_source,
 views: Number(s.views),
 })),
 totalCampaignViews: campaigns.reduce((s, c) => s + Number(c.views), 0),
 });
 } catch (error) {
 console.error('Campaign analytics error:', error);
 return NextResponse.json({ error: 'Internal error' }, { status: 500 });
 }
}
