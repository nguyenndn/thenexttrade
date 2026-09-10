import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireSuperAdmin } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/security?period=7d|30d|90d
 * Returns security dashboard data: summary, trend, recent events, top IPs.
 */
export async function GET(request: NextRequest) {
    const auth = await requireSuperAdmin();
    if (auth instanceof NextResponse) return auth;

    const fromParam = request.nextUrl.searchParams.get("from");
    const toParam = request.nextUrl.searchParams.get("to");
    const period = request.nextUrl.searchParams.get("period") || "7d";
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const pageSize = 20;
    const typeFilter = request.nextUrl.searchParams.get("type") || null;
    const ipFilter = request.nextUrl.searchParams.get("ip") || null;

    let since: Date;
    let until = new Date();

    if (fromParam && toParam) {
        const parsedSince = new Date(fromParam);
        const parsedUntil = new Date(toParam);
        if (!isNaN(parsedSince.getTime()) && !isNaN(parsedUntil.getTime())) {
            since = parsedSince;
            since.setHours(0, 0, 0, 0);
            until = new Date(parsedUntil);
            until.setHours(23, 59, 59, 999);
        } else {
            const days = period === "90d" ? 90 : period === "30d" ? 30 : 7;
            since = new Date();
            since.setDate(since.getDate() - days);
        }
    } else {
        const days = period === "90d" ? 90 : period === "30d" ? 30 : 7;
        since = new Date();
        since.setDate(since.getDate() - days);
    }

    try {
        // Build where clause
        const where: Record<string, unknown> = {
            createdAt: { gte: since, lte: until },
        };
        if (typeFilter) where.type = typeFilter;
        if (ipFilter) where.ip = { contains: ipFilter };

        // Parallel queries
        const [
            totalEvents,
            eventsByType,
            recentEvents,
            topIPs,
            blockedIPCount,
            trendRaw,
        ] = await Promise.all([
            // Total count
            prisma.securityLog.count({ where }),

            // Count by type
            prisma.securityLog.groupBy({
                by: ["type"],
                _count: { type: true },
                where: { createdAt: { gte: since, lte: until } },
            }),

            // Recent events (paginated)
            prisma.securityLog.findMany({
                where,
                orderBy: { createdAt: "desc" },
                take: pageSize,
                skip: (page - 1) * pageSize,
            }),

            // Top IPs
            prisma.securityLog.groupBy({
                by: ["ip"],
                _count: { ip: true },
                where: { createdAt: { gte: since, lte: until } },
                orderBy: { _count: { ip: "desc" } },
                take: 10,
            }),

            // Blocked IPs count
            prisma.blockedIP.count(),

            // Trend (events per day)
            prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
                SELECT DATE("createdAt" AT TIME ZONE 'UTC') as date, COUNT(*)::bigint as count
                FROM security_logs
                WHERE "createdAt" >= ${since} AND "createdAt" <= ${until}
                GROUP BY DATE("createdAt" AT TIME ZONE 'UTC')
                ORDER BY date ASC
            `,
        ]);

        // Build type counts map
        const typeCounts: Record<string, number> = {};
        eventsByType.forEach((e) => {
            typeCounts[e.type] = e._count.type;
        });

        // Fill missing days in trend
        const trendMap = new Map<string, number>();
        trendRaw.forEach((t) => {
            const dateStr =
                typeof t.date === "string"
                    ? t.date
                    : new Date(t.date).toISOString().split("T")[0];
            trendMap.set(dateStr, Number(t.count));
        });

        const trend = [];
        const startDay = new Date(since);
        startDay.setHours(0, 0, 0, 0);
        const endDay = new Date(until);
        endDay.setHours(0, 0, 0, 0);

        const curr = new Date(startDay);
        while (curr <= endDay) {
            const dateStr = curr.toISOString().split("T")[0];
            trend.push({ date: dateStr, count: trendMap.get(dateStr) || 0 });
            curr.setDate(curr.getDate() + 1);
        }

        return NextResponse.json({
            summary: {
                totalEvents,
                blockedIPs: blockedIPCount,
                rateLimitHits: typeCounts["RATE_LIMIT"] || 0,
                botBlocked: typeCounts["BOT_BLOCKED"] || 0,
                loginFailed: typeCounts["LOGIN_FAILED"] || 0,
                turnstileFailed: typeCounts["TURNSTILE_FAILED"] || 0,
                authFailed: typeCounts["AUTH_FAILED"] || 0,
                cronFailed: typeCounts["CRON_FAILED"] || 0,
            },
            trend,
            recentEvents,
            topIPs: topIPs.map((t) => ({
                ip: t.ip,
                count: t._count.ip,
            })),
            pagination: {
                page,
                pageSize,
                total: totalEvents,
                totalPages: Math.ceil(totalEvents / pageSize),
            },
        });
    } catch (error) {
        console.error("[Admin Security] Error:", error);
        return NextResponse.json(
            { error: "Failed to fetch security data" },
            { status: 500 }
        );
    }
}
