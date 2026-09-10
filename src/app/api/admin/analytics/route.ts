import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { normalizeCountryCode } from "@/lib/country-utils";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/analytics?period=7d|30d|90d
 * Returns aggregated analytics data for admin dashboard.
 */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const fromParam = request.nextUrl.searchParams.get("from");
    const toParam = request.nextUrl.searchParams.get("to");
    const period = request.nextUrl.searchParams.get("period") || "7d";

    let since: Date;
    let until = new Date();
    let days = 7;

    if (fromParam && toParam) {
        const parsedSince = new Date(fromParam);
        const parsedUntil = new Date(toParam);
        if (!isNaN(parsedSince.getTime()) && !isNaN(parsedUntil.getTime())) {
            since = parsedSince;
            since.setHours(0, 0, 0, 0);
            until = new Date(parsedUntil);
            until.setHours(23, 59, 59, 999);
            days = Math.max(
                1,
                Math.round(
                    (until.getTime() - since.getTime()) / (1000 * 60 * 60 * 24)
                )
            );
        } else {
            days = period === "90d" ? 90 : period === "30d" ? 30 : 7;
            since = new Date();
            since.setDate(since.getDate() - days);
        }
    } else {
        days = period === "90d" ? 90 : period === "30d" ? 30 : 7;
        since = new Date();
        since.setDate(since.getDate() - days);
    }

    // Previous period for comparison (same duration immediately preceding since)
    const prevEnd = new Date(since);
    const prevStart = new Date(since);
    prevStart.setDate(prevStart.getDate() - days);

    const fiveMinAgo = new Date();
    fiveMinAgo.setMinutes(fiveMinAgo.getMinutes() - 5);

    try {
        const [
            pageviews,
            uniqueVisitors,
            prevPageviews,
            prevUniqueVisitors,
            realTimeCount,
            topCountries,
            registeredCountriesRaw,
            topPages,
            topReferrers,
            deviceBreakdown,
            browserBreakdown,
            dailyPageviews,
        ] = await Promise.all([
            // Total pageviews
            prisma.pageView.count({
                where: { createdAt: { gte: since, lte: until } },
            }),

            // Unique visitors (distinct sessionId)
            prisma.pageView
                .groupBy({
                    by: ["sessionId"],
                    where: { createdAt: { gte: since, lte: until } },
                })
                .then((r) => r.length),

            // Previous period pageviews (for comparison)
            prisma.pageView.count({
                where: { createdAt: { gte: prevStart, lt: prevEnd } },
            }),

            // Previous period unique visitors
            prisma.pageView
                .groupBy({
                    by: ["sessionId"],
                    where: { createdAt: { gte: prevStart, lt: prevEnd } },
                })
                .then((r) => r.length),

            // Real-time (last 5 min)
            prisma.pageView
                .groupBy({
                    by: ["sessionId"],
                    where: { createdAt: { gte: fiveMinAgo } },
                })
                .then((r) => r.length),

            // Top countries
            prisma.pageView.groupBy({
                by: ["country"],
                where: {
                    createdAt: { gte: since, lte: until },
                    country: { not: null },
                },
                _count: { _all: true },
                orderBy: { _count: { country: "desc" } },
                take: 20,
            }),

            // Registered user countries. This is account profile data,
            // intentionally separate from visitor pageview geo.
            prisma.profile.groupBy({
                by: ["country"],
                where: { country: { not: null } },
                _count: { country: true },
                orderBy: { _count: { country: "desc" } },
                take: 20,
            }),

            // Top pages
            prisma.pageView.groupBy({
                by: ["pathname"],
                where: { createdAt: { gte: since, lte: until } },
                _count: { _all: true },
                orderBy: { _count: { pathname: "desc" } },
                take: 15,
            }),

            // Top referrers
            prisma.pageView.groupBy({
                by: ["referrer"],
                where: {
                    createdAt: { gte: since, lte: until },
                    referrer: { not: null },
                },
                _count: { _all: true },
                orderBy: { _count: { referrer: "desc" } },
                take: 10,
            }),

            // Device breakdown
            prisma.pageView.groupBy({
                by: ["device"],
                where: {
                    createdAt: { gte: since, lte: until },
                    device: { not: null },
                },
                _count: { _all: true },
            }),

            // Browser breakdown
            prisma.pageView.groupBy({
                by: ["browser"],
                where: {
                    createdAt: { gte: since, lte: until },
                    browser: { not: null },
                },
                _count: { _all: true },
                orderBy: { _count: { browser: "desc" } },
                take: 8,
            }),

            // Daily pageview trend
            prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
                SELECT DATE("createdAt" AT TIME ZONE 'UTC') as date, COUNT(*)::bigint as count
                FROM page_views
                WHERE "createdAt" >= ${since} AND "createdAt" <= ${until}
                GROUP BY DATE("createdAt" AT TIME ZONE 'UTC')
                ORDER BY date ASC
            `,
        ]);

        // Fill missing days in trend
        const trendMap = new Map<string, number>();
        dailyPageviews.forEach((d) => {
            const dateStr =
                typeof d.date === "string"
                    ? d.date
                    : new Date(d.date).toISOString().split("T")[0];
            trendMap.set(dateStr, Number(d.count));
        });

        const trend = [];
        const startDay = new Date(since);
        startDay.setHours(0, 0, 0, 0);
        const endDay = new Date(until);
        endDay.setHours(0, 0, 0, 0);

        const curr = new Date(startDay);
        while (curr <= endDay) {
            const dateStr = curr.toISOString().split("T")[0];
            trend.push({ date: dateStr, views: trendMap.get(dateStr) || 0 });
            curr.setDate(curr.getDate() + 1);
        }

        // Calculate trend percentages
        const viewsTrend =
            prevPageviews > 0
                ? Math.round(
                      ((pageviews - prevPageviews) / prevPageviews) * 100
                  )
                : pageviews > 0
                  ? 100
                  : 0;
        const visitorsTrend =
            prevUniqueVisitors > 0
                ? Math.round(
                      ((uniqueVisitors - prevUniqueVisitors) /
                          prevUniqueVisitors) *
                          100
                  )
                : uniqueVisitors > 0
                  ? 100
                  : 0;

        const registeredCountryMap = new Map<string, number>();
        registeredCountriesRaw.forEach((row) => {
            const country = normalizeCountryCode(row.country);
            if (!country) return;
            registeredCountryMap.set(
                country,
                (registeredCountryMap.get(country) || 0) + row._count.country
            );
        });

        const registeredCountries = Array.from(registeredCountryMap.entries())
            .map(([country, users]) => ({ country, users }))
            .sort((a, b) => b.users - a.users)
            .slice(0, 20);

        return NextResponse.json({
            period,
            summary: {
                pageviews,
                uniqueVisitors,
                realTimeVisitors: realTimeCount,
                avgPagesPerVisitor:
                    uniqueVisitors > 0
                        ? Math.round((pageviews / uniqueVisitors) * 10) / 10
                        : 0,
                viewsTrend,
                visitorsTrend,
            },
            trend,
            topCountries: topCountries.map((c) => ({
                country: c.country,
                views: c._count._all,
            })),
            registeredCountries,
            topPages: topPages.map((p) => ({
                pathname: p.pathname,
                views: p._count._all,
            })),
            topReferrers: topReferrers.map((r) => ({
                referrer: r.referrer,
                views: r._count._all,
            })),
            devices: deviceBreakdown.map((d) => ({
                device: d.device,
                count: d._count._all,
            })),
            browsers: browserBreakdown.map((b) => ({
                browser: b.browser,
                count: b._count._all,
            })),
        });
    } catch (error) {
        console.error("Admin analytics error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
