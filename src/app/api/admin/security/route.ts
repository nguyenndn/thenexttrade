import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/security?period=7d|30d|90d
 * Returns security dashboard data: summary, trend, recent events, top IPs.
 */
export async function GET(request: NextRequest) {
  const auth = await requireAdmin();
  if (auth instanceof NextResponse) return auth;

  const period = request.nextUrl.searchParams.get("period") || "7d";
  const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
  const pageSize = 20;
  const typeFilter = request.nextUrl.searchParams.get("type") || null;
  const ipFilter = request.nextUrl.searchParams.get("ip") || null;

  const days = period === "90d" ? 90 : period === "30d" ? 30 : 7;
  const since = new Date();
  since.setDate(since.getDate() - days);

  try {
    // Build where clause
    const where: Record<string, unknown> = {
      createdAt: { gte: since },
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
        where: { createdAt: { gte: since } },
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
        where: { createdAt: { gte: since } },
        orderBy: { _count: { ip: "desc" } },
        take: 10,
      }),

      // Blocked IPs count
      prisma.blockedIP.count(),

      // Trend (events per day)
      prisma.$queryRaw<Array<{ date: string; count: bigint }>>`
        SELECT DATE(created_at AT TIME ZONE 'UTC') as date, COUNT(*)::bigint as count
        FROM security_logs
        WHERE created_at >= ${since}
        GROUP BY DATE(created_at AT TIME ZONE 'UTC')
        ORDER BY date ASC
      `,
    ]);

    // Build type counts map
    const typeCounts: Record<string, number> = {};
    eventsByType.forEach((e) => {
      typeCounts[e.type] = e._count.type;
    });

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
      trend: trendRaw.map((t) => ({
        date: t.date,
        count: Number(t.count),
      })),
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
