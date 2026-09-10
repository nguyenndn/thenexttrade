import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/analytics/events?period=7d|30d|90d
 * Returns custom event data + conversion funnel.
 */
export async function GET(request: NextRequest) {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    const fromParam = request.nextUrl.searchParams.get("from");
    const toParam = request.nextUrl.searchParams.get("to");
    const period = request.nextUrl.searchParams.get("period") || "7d";

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
                by: ["name"],
                where: { createdAt: { gte: since, lte: until } },
                _count: { _all: true },
                orderBy: { _count: { name: "desc" } },
            }),

            // Recent events (last 20)
            prisma.analyticsEvent.findMany({
                where: { createdAt: { gte: since, lte: until } },
                orderBy: { createdAt: "desc" },
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
            prisma.pageView
                .groupBy({
                    by: ["sessionId"],
                    where: { createdAt: { gte: since, lte: until } },
                })
                .then((r) => r.length),

            // Funnel: Explored Leaderboard
            prisma.pageView
                .groupBy({
                    by: ["sessionId"],
                    where: {
                        createdAt: { gte: since, lte: until },
                        pathname: { startsWith: "/leaderboard" },
                    },
                })
                .then((r) => r.length),

            // Funnel: Learned (Completed lesson or journal)
            prisma.analyticsEvent
                .groupBy({
                    by: ["sessionId"],
                    where: {
                        createdAt: { gte: since, lte: until },
                        name: {
                            in: ["complete_lesson", "journal_entry_created"],
                        },
                    },
                })
                .then((r) => r.length),

            // Funnel: Adopted EA (Downloaded EA)
            prisma.analyticsEvent
                .groupBy({
                    by: ["sessionId"],
                    where: {
                        createdAt: { gte: since, lte: until },
                        name: "click_download_ea",
                    },
                })
                .then((r) => r.length),
        ]);

        return NextResponse.json({
            period,
            events: eventCounts.map((e) => ({
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
        console.error("Admin analytics events error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}
