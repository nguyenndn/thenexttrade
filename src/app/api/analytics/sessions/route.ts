import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { parseISO, endOfDay, isValid } from "date-fns";
import {
    getCurrencyInfo,
    normalizeCurrencyCode,
} from "@/lib/utils/cent-account";

interface SessionStats {
    session: string;
    displayName: string;
    color: string;
    totalTrades: number;
    winCount: number;
    lossCount: number;
    winRate: number;
    totalPnL: number;
    avgPnL: number;
    profitFactor: number;
}

interface HourlyStats {
    hour: number;
    hourLabel: string;
    totalTrades: number;
    winRate: number;
    totalPnL: number;
}

const SESSION_COLORS: Record<string, string> = {
    SYDNEY: "#F59E0B", // Amber
    TOKYO: "#EF4444", // Red
    LONDON: "#3B82F6", // Blue
    NEW_YORK: "#10B981", // Green
    LONDON_NY_OVERLAP: "#8B5CF6", // Purple
    TOKYO_LONDON_OVERLAP: "#EC4899", // Pink
    OFF_HOURS: "#6B7280", // Gray
};

const SESSION_NAMES: Record<string, string> = {
    SYDNEY: "Sydney/Asian",
    TOKYO: "Tokyo",
    LONDON: "London",
    NEW_YORK: "New York",
    LONDON_NY_OVERLAP: "London/NY Overlap",
    TOKYO_LONDON_OVERLAP: "Tokyo/London Overlap",
    OFF_HOURS: "Off Hours",
};

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const searchParams = request.nextUrl.searchParams;
        const startDateParam = searchParams.get("startDate");
        const endDateParam = searchParams.get("endDate");
        const rawAccountId = searchParams.get("accountId") || undefined;

        let normalizedAccountId: string | undefined;
        if (rawAccountId === "all") {
            normalizedAccountId = undefined;
        } else if (rawAccountId) {
            normalizedAccountId = rawAccountId;
        } else {
            const lastAccountId =
                request.cookies.get("last_account_id")?.value;
            const { resolveDefaultAccountId } = await import(
                "@/actions/main-account"
            );
            const resolvedDefault = await resolveDefaultAccountId(
                user.id,
                lastAccountId
            );
            normalizedAccountId =
                resolvedDefault && resolvedDefault !== "all"
                    ? resolvedDefault
                    : undefined;
        }

        const userAccounts = prisma.tradingAccount?.findMany
            ? await prisma.tradingAccount.findMany({
                  where: { userId: user.id },
                  select: { id: true, currency: true, server: true },
              })
            : [];

        const parsedStart = startDateParam ? parseISO(startDateParam) : null;
        const startDate =
            parsedStart && isValid(parsedStart) ? parsedStart : undefined;

        // A date-only endDate param (e.g. "2026-08-13") parses to midnight;
        // extend it to end of day ONLY when it is not already a full ISO timestamp.
        const parsedEndRaw = endDateParam ? parseISO(endDateParam) : null;
        const endDate =
            parsedEndRaw && isValid(parsedEndRaw)
                ? endDateParam?.includes("T")
                    ? parsedEndRaw
                    : endOfDay(parsedEndRaw)
                : undefined;

        const targetAcc = normalizedAccountId
            ? userAccounts.find((acc) => acc.id === normalizedAccountId)
            : undefined;
        const currency = !normalizedAccountId
            ? "USD"
            : normalizeCurrencyCode(targetAcc?.currency, targetAcc?.server);

        // ── Aggregation runs in Postgres ────────────────────────────────────
        // This route used to stream every closed trade in range into Node just
        // to group it. The CTE below reproduces the previous Node pipeline:
        // `net_pnl` is ROUND(pnl + commission + swap, 4) × usdRate, the USD
        // rate applies only in all-accounts mode (a single account is reported
        // in its own currency) and defaults to 1 for trades without an account.
        //
        // Totals are summed at full precision and rounded only at display time,
        // matching the dashboard aggregates (getKeyStats). Win/loss use the
        // same ±0.01 threshold as the dashboard so a $0.01 trade is a break-even
        // everywhere instead of a win here and a break-even on the dashboard.
        const conditions: Prisma.Sql[] = [
            Prisma.sql`je."userId" = ${user.id}::uuid`,
            Prisma.sql`je."status" = 'CLOSED'`,
        ];
        if (normalizedAccountId) {
            conditions.push(
                Prisma.sql`je."accountId" = ${normalizedAccountId}::text`
            );
        }
        if (startDate) {
            conditions.push(Prisma.sql`je."exitDate" >= ${startDate}`);
        }
        if (endDate) {
            conditions.push(Prisma.sql`je."exitDate" <= ${endDate}`);
        }

        const useUsdRate = !normalizedAccountId && userAccounts.length > 0;
        const rateCte = useUsdRate
            ? Prisma.sql`rates(account_id, rate) AS (VALUES ${Prisma.join(
                  userAccounts.map(
                      (acc) =>
                          Prisma.sql`(${acc.id}::text, ${getCurrencyInfo(acc.currency, acc.server).usdRate}::numeric)`
                  )
              )}),`
            : Prisma.empty;
        const rateJoin = useUsdRate
            ? Prisma.sql`LEFT JOIN rates r ON r.account_id = je."accountId"`
            : Prisma.empty;
        const rateExpr = useUsdRate
            ? Prisma.sql`COALESCE(r.rate, 1)`
            : Prisma.sql`1`;

        const scopedCte = Prisma.sql`
            WITH ${rateCte}
            scoped AS (
                SELECT
                    COALESCE(
                        NULLIF(je."trading_session", ''),
                        CASE
                            WHEN hours.utc_h BETWEEN 0 AND 5 THEN 'SYDNEY'
                            WHEN hours.utc_h = 6 THEN 'TOKYO'
                            WHEN hours.utc_h BETWEEN 7 AND 8 THEN 'TOKYO_LONDON_OVERLAP'
                            WHEN hours.utc_h BETWEEN 9 AND 11 THEN 'LONDON'
                            WHEN hours.utc_h BETWEEN 12 AND 15 THEN 'LONDON_NY_OVERLAP'
                            WHEN hours.utc_h BETWEEN 16 AND 20 THEN 'NEW_YORK'
                            ELSE 'SYDNEY'
                        END
                    ) AS "session",
                    hours.utc_h,
                    CASE
                        WHEN je."pnl" IS NULL THEN NULL
                        ELSE ROUND(
                            (
                                je."pnl"
                                + COALESCE(je."commission", 0)
                                + COALESCE(je."swap", 0)
                            )::numeric,
                            4
                        ) * (${rateExpr})::numeric
                    END AS net_pnl
                FROM "journal_entries" je
                ${rateJoin}
                CROSS JOIN LATERAL (
                    SELECT EXTRACT(
                        HOUR FROM je."entryDate" AT TIME ZONE 'UTC'
                    )::int AS utc_h
                ) hours
                WHERE ${Prisma.join(conditions, " AND ")}
            )
        `;

        const [sessionAgg, hourAgg] = await Promise.all([
            prisma.$queryRaw<
                Array<{
                    session: string;
                    totalTrades: number;
                    winCount: number;
                    lossCount: number;
                    totalPnL: number;
                    grossProfit: number;
                    grossLoss: number;
                }>
            >(Prisma.sql`
                ${scopedCte}
                SELECT
                    "session",
                    COUNT(*)::int AS "totalTrades",
                    COUNT(*) FILTER (WHERE net_pnl > 0.01)::int AS "winCount",
                    COUNT(*) FILTER (WHERE net_pnl < -0.01)::int AS "lossCount",
                    COALESCE(SUM(net_pnl), 0)::float8 AS "totalPnL",
                    COALESCE(SUM(net_pnl) FILTER (WHERE net_pnl > 0.01), 0)::float8 AS "grossProfit",
                    COALESCE(SUM(-net_pnl) FILTER (WHERE net_pnl < -0.01), 0)::float8 AS "grossLoss"
                FROM scoped
                GROUP BY "session"
            `),
            prisma.$queryRaw<
                Array<{
                    hour: number;
                    totalTrades: number;
                    winCount: number;
                    totalPnL: number;
                }>
            >(Prisma.sql`
                ${scopedCte}
                SELECT
                    utc_h AS "hour",
                    COUNT(*)::int AS "totalTrades",
                    COUNT(*) FILTER (WHERE net_pnl > 0.01)::int AS "winCount",
                    COALESCE(SUM(net_pnl), 0)::float8 AS "totalPnL"
                FROM scoped
                GROUP BY utc_h
            `),
        ]);

        // Build session stats — same shape and ordering as the pre-SQL version
        const sessionStats: SessionStats[] = sessionAgg
            .map((data) => {
                const total = data.totalTrades;
                const totalPnL = Number(data.totalPnL);
                const grossProfit = Number(data.grossProfit);
                const grossLoss = Number(data.grossLoss);
                return {
                    session: data.session,
                    displayName: SESSION_NAMES[data.session] || data.session,
                    color: SESSION_COLORS[data.session] || "#6B7280",
                    totalTrades: total,
                    winCount: data.winCount,
                    lossCount: data.lossCount,
                    winRate: total > 0 ? (data.winCount / total) * 100 : 0,
                    totalPnL,
                    avgPnL: total > 0 ? totalPnL / total : 0,
                    profitFactor:
                        grossLoss > 0
                            ? grossProfit / grossLoss
                            : grossProfit > 0
                              ? 99
                              : 0,
                };
            })
            .sort((a, b) => b.totalPnL - a.totalPnL);

        // Build hourly stats, filling the hours with no trades
        const hourMap = new Map(hourAgg.map((row) => [Number(row.hour), row]));
        const fullHourlyStats: HourlyStats[] = [];
        for (let i = 0; i < 24; i++) {
            const existing = hourMap.get(i);
            if (existing) {
                const total = existing.totalTrades;
                fullHourlyStats.push({
                    hour: i,
                    hourLabel: `${i.toString().padStart(2, "0")}:00`,
                    totalTrades: total,
                    winRate: total > 0 ? (existing.winCount / total) * 100 : 0,
                    totalPnL: Number(existing.totalPnL),
                });
            } else {
                fullHourlyStats.push({
                    hour: i,
                    hourLabel: `${i.toString().padStart(2, "0")}:00`,
                    totalTrades: 0,
                    winRate: 0,
                    totalPnL: 0,
                });
            }
        }

        // Find best/worst
        const bestSession =
            sessionStats.length > 0
                ? sessionStats.reduce((best, curr) =>
                      curr.totalPnL > best.totalPnL ? curr : best
                  ).session
                : null;

        const worstSession =
            sessionStats.length > 0
                ? sessionStats.reduce((worst, curr) =>
                      curr.totalPnL < worst.totalPnL ? curr : worst
                  ).session
                : null;

        const hourlyWithTrades = fullHourlyStats.filter(
            (h) => h.totalTrades >= 3
        );
        const bestHour =
            hourlyWithTrades.length > 0
                ? hourlyWithTrades.reduce((best, curr) =>
                      curr.winRate > best.winRate ? curr : best
                  ).hour
                : null;

        const worstHour =
            hourlyWithTrades.length > 0
                ? hourlyWithTrades.reduce((worst, curr) =>
                      curr.winRate < worst.winRate ? curr : worst
                  ).hour
                : null;

        // Generate recommendations
        const recommendations: {
            type: "positive" | "negative" | "warning" | "neutral";
            text: string;
        }[] = [];

        // 1. Analyze best session
        if (bestSession) {
            const best = sessionStats.find((s) => s.session === bestSession);
            if (best) {
                if (best.profitFactor >= 2 && best.winRate >= 50) {
                    recommendations.push({
                        type: "positive",
                        text: `Goldmine: The ${SESSION_NAMES[bestSession] || bestSession} session is highly consistent. Your Win Rate is ${best.winRate.toFixed(0)}% with a Profit Factor of ${best.profitFactor.toFixed(2)}. Prioritize capital allocation for this timeframe.`,
                    });
                } else if (best.winRate > 55) {
                    recommendations.push({
                        type: "positive",
                        text: `Solid Performance: Your win rate during the ${SESSION_NAMES[bestSession] || bestSession} session is excellent (${best.winRate.toFixed(0)}%). This is your safest window for entries.`,
                    });
                } else if (best.totalPnL > 0) {
                    recommendations.push({
                        type: "positive",
                        text: `Profitable: The ${SESSION_NAMES[bestSession] || bestSession} session yields your highest profit, despite a ${best.winRate.toFixed(0)}% win rate. Keep up this current Risk/Reward ratio.`,
                    });
                }
            }
        }

        // 2. Analyze worst session
        if (worstSession && worstSession !== bestSession) {
            const worst = sessionStats.find((s) => s.session === worstSession);
            if (worst) {
                if (worst.totalPnL < 0 && worst.profitFactor < 0.5) {
                    recommendations.push({
                        type: "negative",
                        text: `Red Alert: The ${SESSION_NAMES[worstSession] || worstSession} session is draining your account. Profit Factor is critically low (${worst.profitFactor.toFixed(2)}). Recommendation: Stay out of the market during this session to preserve capital.`,
                    });
                } else if (worst.winRate < 45) {
                    recommendations.push({
                        type: "warning",
                        text: `Restrict Entries: Poor performance during the ${SESSION_NAMES[worstSession] || worstSession} session (${worst.winRate.toFixed(0)}% Win). Market structure here might not align with your core strategy.`,
                    });
                }
            }
        }

        // 3. Analyze hourly performance
        if (bestHour !== null && worstHour !== null && bestHour !== worstHour) {
            const bHour = fullHourlyStats.find((h) => h.hour === bestHour);
            const wHour = fullHourlyStats.find((h) => h.hour === worstHour);

            if (bHour && bHour.winRate >= 60 && bHour.totalTrades >= 3) {
                recommendations.push({
                    type: "positive",
                    text: `Golden Hour: ${bestHour.toString().padStart(2, "0")}:00 - ${bestHour.toString().padStart(2, "0")}:59 UTC is your peak performance window (${bHour.winRate.toFixed(0)}% Win).`,
                });
            }
            if (wHour && wHour.winRate <= 30 && wHour.totalTrades >= 3) {
                recommendations.push({
                    type: "negative",
                    text: `Danger Zone: You frequently face losses at ${worstHour.toString().padStart(2, "0")}:00 UTC (${wHour.winRate.toFixed(0)}% Win). It is highly recommended to step away from the charts during this hour.`,
                });
            }
        }

        // 4. Fallback if data is insufficient for deep insights
        if (recommendations.length === 0 && sessionStats.length > 0) {
            recommendations.push({
                type: "neutral",
                text: "Insufficient Data: No session has proven exceptionally profitable or excessively risky yet. Keep journaling more trades to uncover actionable insights.",
            });
        }

        return NextResponse.json({
            sessionStats,
            hourlyStats: fullHourlyStats,
            bestSession,
            worstSession,
            bestHour,
            worstHour,
            recommendations,
            currency,
        });
    } catch (error) {
        console.error("Session analytics error:", error);
        return NextResponse.json(
            { error: "Failed to fetch session analytics" },
            { status: 500 }
        );
    }
}
