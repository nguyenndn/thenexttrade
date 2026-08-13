import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

export interface AdvancedFilters {
    direction?: "BUY" | "SELL";
    source?: "MANUAL" | "AUTO";
    comment?: string;
    magicNumber?: number;
    symbol?: string;
    result?: "WIN" | "LOSS" | "BREAK_EVEN";
}

export function buildAdvancedFiltersSql(filters?: AdvancedFilters) {
    if (!filters) return Prisma.empty;
    const conditions: Prisma.Sql[] = [];

    if (filters.direction) {
        conditions.push(
            Prisma.sql`AND "type" = ${filters.direction}::"TradeType"`
        );
    }

    if (filters.source) {
        if (filters.source === "MANUAL") {
            conditions.push(
                Prisma.sql`AND ("syncSource" = 'MANUAL' OR ("syncSource" = 'APP' AND ("magicNumber" = 0 OR "magicNumber" IS NULL)))`
            );
        } else if (filters.source === "AUTO") {
            conditions.push(
                Prisma.sql`AND "syncSource" = 'APP' AND "magicNumber" > 0`
            );
        }
    }

    if (filters.comment) {
        conditions.push(
            Prisma.sql`AND "notes" ILIKE ${"%" + filters.comment + "%"}`
        );
    }

    if (filters.magicNumber !== undefined && filters.magicNumber !== null) {
        conditions.push(Prisma.sql`AND "magicNumber" = ${filters.magicNumber}`);
    }

    if (filters.symbol) {
        conditions.push(
            Prisma.sql`AND "symbol" ILIKE ${"%" + filters.symbol + "%"}`
        );
    }

    if (filters.result) {
        conditions.push(
            Prisma.sql`AND "result" = ${filters.result}::"TradeResult"`
        );
    }

    if (conditions.length === 0) return Prisma.empty;

    return Prisma.sql` ${Prisma.join(conditions, " ")}`;
}

// ============================================================================
// RAW SQL ANALYTICS QUERIES
// ============================================================================
// Why Raw SQL?
// Prisma's groupBy is good, but for time-series truncation (Month/Day) and
// complex conditional aggregates (Win Rate in one go), Raw SQL is 100x faster.

/**
 * Get aggregated Monthly Performance for a user
 * Returns { date, profit, tradeCount }
 */
export async function getMonthlyAnalytics(
    userId: string,
    accountId?: string,
    timezone?: string,
    filters?: AdvancedFilters
) {
    const tz = timezone || "Etc/UTC";
    const advancedFiltersSql = buildAdvancedFiltersSql(filters);

    const result = await prisma.$queryRaw`
  SELECT 
  TO_CHAR("exitDate" AT TIME ZONE ${tz}, 'YYYY-MM') as "date",
  SUM("pnl") as "profit",
  COUNT(*) as "tradeCount",
  SUM(CASE WHEN "pnl" > 0 THEN 1 ELSE 0 END) as "winCount"
  FROM "JournalEntry"
  WHERE "userId" = ${userId}::uuid
  AND "status" = 'CLOSED'
  AND (${accountId ? accountId : "1"} = '1' OR "accountId" = ${accountId})
  AND "exitDate" >= NOW() - INTERVAL '12 months'
  ${advancedFiltersSql}
  GROUP BY 1
  ORDER BY 1 ASC
  `;

    // Cast BigInt to Number if necessary (Prisma returns BigInt for COUNT)
    return (result as any[]).map((row) => ({
        date: row.date,
        profit: Number(row.profit || 0),
        tradeCount: Number(row.tradeCount || 0),
        winRate:
            Number(row.tradeCount) > 0
                ? (Number(row.winCount) / Number(row.tradeCount)) * 100
                : 0,
    }));
}

/**
 * Get Key Statistics (Win Rate, Profit Factor, Total PnL)
 * Single Query optimized
 */
export async function getKeyStats(
    userId: string,
    accountId?: string,
    startDate?: Date,
    endDate?: Date,
    filters?: AdvancedFilters
) {
    // Build date filter
    const dateFilter =
        startDate && endDate
            ? Prisma.sql`AND "exitDate" >= ${startDate} AND "exitDate" <= ${endDate}`
            : Prisma.empty;
    const advancedFiltersSql = buildAdvancedFiltersSql(filters);

    const result = await prisma.$queryRaw`
  SELECT 
  COUNT(*) as "totalTrades",
  SUM(COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "totalPnL",
  SUM(CASE WHEN "result" = 'WIN' THEN 1 ELSE 0 END) as "wins",
  SUM(CASE WHEN "result" = 'LOSS' THEN 1 ELSE 0 END) as "losses",
  SUM(CASE WHEN "result" = 'BREAK_EVEN' THEN 1 ELSE 0 END) as "breakEvens",
  SUM(CASE WHEN (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) > 0 THEN (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) ELSE 0 END) as "grossProfit",
  SUM(CASE WHEN (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) < 0 THEN ABS(COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) ELSE 0 END) as "grossLoss",
  SUM(COALESCE("commission", 0)) as "commission",
  SUM(COALESCE("swap", 0)) as "swap",
  MAX(CASE WHEN (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) > 0 THEN (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) ELSE 0 END) as "maxWin",
  MIN(CASE WHEN (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) < 0 THEN (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) ELSE 0 END) as "maxLoss",
  AVG(EXTRACT(EPOCH FROM ("exitDate" - "entryDate"))/60) as "avgHoldMinutes"
  FROM "JournalEntry"
  WHERE "userId" = ${userId}::uuid
  AND "status" = 'CLOSED'
  AND (${accountId ? accountId : "1"} = '1' OR "accountId" = ${accountId})
  ${dateFilter}
  ${advancedFiltersSql}
  `;

    const stats = (result as any[])[0] || {};
    const totalTrades = Number(stats.totalTrades || 0);
    const wins = Number(stats.wins || 0);
    const losses = Number(stats.losses || 0);
    const breakEvens = Number(stats.breakEvens || 0);
    // Denominator = decided trades (win + loss + break-even), matching the
    // win-rate convention used by getMonthlyAnalytics / getJournalEntries so
    // the dashboard KPI and charts never disagree.
    const decisiveTrades = wins + losses + breakEvens;
    const grossProfit = Number(stats.grossProfit || 0);
    const grossLoss = Number(stats.grossLoss || 0);

    return {
        totalTrades,
        winCount: wins,
        lossCount: losses,
        winRate: decisiveTrades > 0 ? (wins / decisiveTrades) * 100 : null,
        totalPnL: Number(stats.totalPnL || 0),
        profitFactor:
            grossLoss > 0
                ? grossProfit / grossLoss
                : grossProfit > 0
                  ? 99
                  : 0,
        grossProfit,
        grossLoss,
        avgWin: wins > 0 ? grossProfit / wins : 0,
        avgLoss: losses > 0 ? grossLoss / losses : 0,
        commission: Number(stats.commission || 0),
        swap: Number(stats.swap || 0),
        maxWin: Number(stats.maxWin || 0),
        maxLoss: Number(stats.maxLoss || 0),
        avgHoldMinutes: Number(stats.avgHoldMinutes || 0),
    };
}

/**
 * Cached Wrapper for Dashboard
 * Revalidates every 60 seconds or on demand
 */
export const getCachedDashboardStats = unstable_cache(
    async (
        userId: string,
        accountId?: string,
        startDate?: string,
        endDate?: string,
        filtersStr?: string
    ) => {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        const filters = filtersStr
            ? (JSON.parse(filtersStr) as AdvancedFilters)
            : undefined;

        const [stats, monthly] = await Promise.all([
            getKeyStats(userId, accountId, start, end, filters),
            getMonthlyAnalytics(userId, accountId, undefined, filters),
        ]);
        return { stats, monthly };
    },
    ["dashboard-stats"],
    {
        revalidate: 60, // 60 Seconds Cache
        tags: ["dashboard-stats"],
    }
);

/**
 * Get Daily Performance for Chart
 */
export async function getDailyPerformance(
    userId: string,
    accountId?: string,
    startDate?: Date,
    endDate?: Date,
    timezone?: string,
    filters?: AdvancedFilters
) {
    const tz = timezone || "Etc/UTC";
    // Build date filter
    const dateFilter =
        startDate && endDate
            ? Prisma.sql`AND "exitDate" >= ${startDate} AND "exitDate" <= ${endDate}`
            : Prisma.empty; // Default to all time if no date
    const advancedFiltersSql = buildAdvancedFiltersSql(filters);

    const result = await prisma.$queryRaw`
  SELECT 
  TO_CHAR("exitDate" AT TIME ZONE ${tz}, 'YYYY-MM-DD') as "date",
  SUM(COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "profit",
  COUNT(*) as "tradeCount",
  SUM(CASE WHEN "result" = 'WIN' THEN 1 ELSE 0 END) as "winCount",
  SUM(CASE WHEN "result" = 'LOSS' THEN 1 ELSE 0 END) as "lossCount"
  FROM "JournalEntry"
  WHERE "userId" = ${userId}::uuid
  AND "status" = 'CLOSED'
  AND (${accountId ? accountId : "1"} = '1' OR "accountId" = ${accountId})
  ${dateFilter}
  ${advancedFiltersSql}
  GROUP BY 1
  ORDER BY 1 ASC
  `;

    return (result as any[]).map((row) => ({
        date: row.date,
        value: Number(row.profit || 0), // Daily PnL
        winRate:
            Number(row.winCount || 0) + Number(row.lossCount || 0) > 0
                ? (Number(row.winCount || 0) /
                      (Number(row.winCount || 0) +
                          Number(row.lossCount || 0))) *
                  100
                : 0,
        tradeCount: Number(row.tradeCount || 0),
        winCount: Number(row.winCount || 0),
        lossCount: Number(row.lossCount || 0),
    }));
}

/**
 * Get Intraday Performance (trade-by-trade) for single-day chart
 * Returns individual trades with timestamps for cumulative profit line
 */
export async function getIntradayPerformance(
    userId: string,
    accountId?: string,
    startDate?: Date,
    endDate?: Date,
    filters?: AdvancedFilters
) {
    const dateFilter =
        startDate && endDate
            ? Prisma.sql`AND "exitDate" >= ${startDate} AND "exitDate" <= ${endDate}`
            : Prisma.empty;
    const advancedFiltersSql = buildAdvancedFiltersSql(filters);

    const result = await prisma.$queryRaw`
  SELECT 
  "exitDate" as "date",
  (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "pnl"
  FROM "JournalEntry"
  WHERE "userId" = ${userId}::uuid
  AND "status" = 'CLOSED'
  AND (${accountId ? accountId : "1"} = '1' OR "accountId" = ${accountId})
  ${dateFilter}
  ${advancedFiltersSql}
  ORDER BY "exitDate" ASC
  `;

    return (result as any[]).map((row) => ({
        date: (row.date as Date).toISOString(),
        pnl: Number(row.pnl || 0),
    }));
}

/**
 * Get Symbol Performance for Pie Chart & List
 */
export async function getSymbolPerformance(
    userId: string,
    accountId?: string,
    startDate?: Date,
    endDate?: Date,
    filters?: AdvancedFilters
) {
    // Build date filter
    const dateFilter =
        startDate && endDate
            ? Prisma.sql`AND "exitDate" >= ${startDate} AND "exitDate" <= ${endDate}`
            : Prisma.empty;
    const advancedFiltersSql = buildAdvancedFiltersSql(filters);

    const result = await prisma.$queryRaw`
  SELECT 
  "symbol",
  COUNT(*) as "tradeCount",
  SUM(COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "netProfit",
  SUM(CASE WHEN (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) > 0 THEN (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) ELSE 0 END) as "grossProfit",
  SUM(CASE WHEN "result" = 'WIN' THEN 1 ELSE 0 END) as "winCount",
  SUM(CASE WHEN "result" = 'LOSS' THEN 1 ELSE 0 END) as "lossCount",
  SUM(CASE WHEN "result" = 'BREAK_EVEN' THEN 1 ELSE 0 END) as "breakEvenCount"
  FROM "JournalEntry"
  WHERE "userId" = ${userId}::uuid
  AND "status" = 'CLOSED'
  AND (${accountId ? accountId : "1"} = '1' OR "accountId" = ${accountId})
  ${dateFilter}
  ${advancedFiltersSql}
  GROUP BY "symbol"
  ORDER BY "netProfit" DESC
  LIMIT 10
  `;

    return (result as any[]).map((row) => {
        const wins = Number(row.winCount || 0);
        const losses = Number(row.lossCount || 0);
        const breakEvens = Number(row.breakEvenCount || 0);
        // Decided-trades denominator (win + loss + break-even) to match the
        // rest of analytics, so per-symbol win rate agrees with the KPI.
        const decisiveTrades = wins + losses + breakEvens;

        return {
            symbol: row.symbol,
            trades: Number(row.tradeCount),
            pnl: Number(row.netProfit || 0),
            grossProfit: Number(row.grossProfit || 0),
            winRate: decisiveTrades > 0 ? (wins / decisiveTrades) * 100 : 0,
        };
    });
}

/**
 * Get Top Trades (Best & Worst)
 */
export async function getTopTrades(
    userId: string,
    accountId?: string,
    startDate?: Date,
    endDate?: Date,
    filters?: AdvancedFilters
) {
    // Build date filter
    const dateFilter =
        startDate && endDate
            ? Prisma.sql`AND "exitDate" >= ${startDate} AND "exitDate" <= ${endDate}`
            : Prisma.empty;
    const advancedFiltersSql = buildAdvancedFiltersSql(filters);

    const [bestResult, worstResult] = await Promise.all([
        // Best Trades: Highest Positive PnL
        prisma.$queryRaw`
  SELECT "id", "symbol", "type", (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "pnl", "entryDate", "exitDate", "result", "lotSize"
  FROM "JournalEntry"
  WHERE "userId" = ${userId}::uuid
  AND "status" = 'CLOSED'
  AND (${accountId ? accountId : "1"} = '1' OR "accountId" = ${accountId})
  ${dateFilter}
  ${advancedFiltersSql}
  AND (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) > 0
  ORDER BY (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) DESC
  LIMIT 3
  `,
        // Worst Trades: Lowest Negative PnL (Biggest Loss)
        prisma.$queryRaw`
  SELECT "id", "symbol", "type", (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "pnl", "entryDate", "exitDate", "result", "lotSize"
  FROM "JournalEntry"
  WHERE "userId" = ${userId}::uuid
  AND "status" = 'CLOSED'
  AND (${accountId ? accountId : "1"} = '1' OR "accountId" = ${accountId})
  ${dateFilter}
  ${advancedFiltersSql}
  AND (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) < 0
  ORDER BY (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) ASC
  LIMIT 3
  `,
    ]);

    const mapTrade = (t: any) => ({
        id: t.id,
        symbol: t.symbol,
        type: t.type,
        pnl: Number(t.pnl),
        lotSize: Number(t.lotSize || 0),
        date: t.exitDate,
        result: t.result,
    });

    return {
        best: (bestResult as any[]).map(mapTrade),
        worst: (worstResult as any[]).map(mapTrade),
    };
}

/**
 * Get Lot Distribution by Symbol
 */
export async function getLotDistribution(
    userId: string,
    accountId?: string,
    startDate?: Date,
    endDate?: Date,
    filters?: AdvancedFilters
) {
    // Build date filter
    const dateFilter =
        startDate && endDate
            ? Prisma.sql`AND "exitDate" >= ${startDate} AND "exitDate" <= ${endDate}`
            : Prisma.empty;
    const advancedFiltersSql = buildAdvancedFiltersSql(filters);

    const result = await prisma.$queryRaw`
  SELECT 
  "symbol",
  SUM("lotSize") as "totalLots"
  FROM "JournalEntry"
  WHERE "userId" = ${userId}::uuid
  AND "status" = 'CLOSED'
  AND (${accountId ? accountId : "1"} = '1' OR "accountId" = ${accountId})
  ${dateFilter}
  ${advancedFiltersSql}
  GROUP BY "symbol"
  ORDER BY "totalLots" DESC
  LIMIT 5
  `;

    return (result as any[]).map((row) => ({
        name: row.symbol,
        value: Number(row.totalLots || 0),
    }));
}

/**
 * Get Day of Week Performance
 * Returns { day, dayIndex, pnl, tradeCount, winRate }
 */
export async function getDayOfWeekPerformance(
    userId: string,
    accountId?: string,
    startDate?: Date,
    endDate?: Date,
    timezone?: string,
    filters?: AdvancedFilters
) {
    const tz = timezone || "Etc/UTC";
    // Build date filter
    const dateFilter =
        startDate && endDate
            ? Prisma.sql`AND "exitDate" >= ${startDate} AND "exitDate" <= ${endDate}`
            : Prisma.empty;
    const advancedFiltersSql = buildAdvancedFiltersSql(filters);

    const result = await prisma.$queryRaw`
  SELECT 
  EXTRACT(DOW FROM "exitDate" AT TIME ZONE ${tz}) as "dayIndex",
  COUNT(*) as "tradeCount",
  SUM(COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "netProfit",
  SUM(CASE WHEN "result" = 'WIN' THEN 1 ELSE 0 END) as "winCount",
  SUM(CASE WHEN "result" = 'LOSS' THEN 1 ELSE 0 END) as "lossCount",
  SUM(CASE WHEN "result" = 'BREAK_EVEN' THEN 1 ELSE 0 END) as "breakEvenCount"
  FROM "JournalEntry"
  WHERE "userId" = ${userId}::uuid
  AND "status" = 'CLOSED'
  AND (${accountId ? accountId : "1"} = '1' OR "accountId" = ${accountId})
  ${dateFilter}
  ${advancedFiltersSql}
  GROUP BY 1
  ORDER BY 1 ASC
  `;

    const dayNames = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
    ];

    return (result as any[]).map((row) => {
        const wins = Number(row.winCount || 0);
        const losses = Number(row.lossCount || 0);
        const breakEvens = Number(row.breakEvenCount || 0);
        // Decided-trades denominator (win + loss + break-even) to match the
        // rest of analytics, so per-day win rate agrees with the KPI.
        const decisiveTrades = wins + losses + breakEvens;

        return {
            day: dayNames[Number(row.dayIndex)],
            dayIndex: Number(row.dayIndex),
            pnl: Number(row.netProfit || 0),
            tradeCount: Number(row.tradeCount || 0),
            winRate: decisiveTrades > 0 ? (wins / decisiveTrades) * 100 : 0,
        };
    });
}

/**
 * Get Current Win/Loss Streak
 * Queries the most recent closed trades and counts consecutive results
 */
export async function getCurrentStreak(
    userId: string,
    accountId?: string
): Promise<{ type: "win" | "loss" | "none"; count: number }> {
    const result = (await prisma.$queryRaw`
  SELECT "result"
  FROM "JournalEntry"
  WHERE "userId" = ${userId}::uuid
  AND "status" = 'CLOSED'
  AND "result" IS NOT NULL
  AND (${accountId ? accountId : "1"} = '1' OR "accountId" = ${accountId})
  ORDER BY "exitDate" DESC
  LIMIT 50
  `) as { result: string }[];

    if (!result.length) return { type: "none", count: 0 };

    const firstResult = result[0].result; // WIN or LOSS
    if (firstResult !== "WIN" && firstResult !== "LOSS")
        return { type: "none", count: 0 };

    let count = 0;
    for (const trade of result) {
        if (trade.result === firstResult) {
            count++;
        } else {
            break;
        }
    }

    return { type: firstResult === "WIN" ? "win" : "loss", count };
}

/**
 * Get Trading Session Performance (Asian, London, New York)
 * Groups trades by the forex session of their entry time (UTC)
 */
export async function getSessionPerformance(
    userId: string,
    accountId?: string,
    startDate?: Date,
    endDate?: Date,
    filters?: AdvancedFilters
) {
    const dateFilter =
        startDate && endDate
            ? Prisma.sql`AND "exitDate" >= ${startDate} AND "exitDate" <= ${endDate}`
            : Prisma.empty;
    const advancedFiltersSql = buildAdvancedFiltersSql(filters);

    const result = await prisma.$queryRaw`
  SELECT 
  CASE 
  WHEN EXTRACT(HOUR FROM "entryDate") >= 21 OR EXTRACT(HOUR FROM "entryDate") < 6 THEN 'Sydney'
  WHEN EXTRACT(HOUR FROM "entryDate") >= 0 AND EXTRACT(HOUR FROM "entryDate") < 9 THEN 'Tokyo'
  WHEN EXTRACT(HOUR FROM "entryDate") >= 8 AND EXTRACT(HOUR FROM "entryDate") < 17 THEN 'London'
  WHEN EXTRACT(HOUR FROM "entryDate") >= 13 AND EXTRACT(HOUR FROM "entryDate") < 22 THEN 'New York'
  ELSE 'Off-Hours'
  END as "session",
  COUNT(*) as "tradeCount",
  SUM(COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "netProfit",
  SUM(CASE WHEN "result" = 'WIN' THEN 1 ELSE 0 END) as "winCount",
  SUM(CASE WHEN "result" = 'LOSS' THEN 1 ELSE 0 END) as "lossCount",
  SUM(CASE WHEN "result" = 'BREAK_EVEN' THEN 1 ELSE 0 END) as "breakEvenCount"
  FROM "JournalEntry"
  WHERE "userId" = ${userId}::uuid
  AND "status" = 'CLOSED'
  AND "entryDate" IS NOT NULL
  AND (${accountId ? accountId : "1"} = '1' OR "accountId" = ${accountId})
  ${dateFilter}
  ${advancedFiltersSql}
  GROUP BY 1
  ORDER BY "netProfit" DESC
  `;

    const sessionOrder = ["Sydney", "Tokyo", "London", "New York"];
    const mapped = (result as any[]).map((row) => {
        const wins = Number(row.winCount || 0);
        const losses = Number(row.lossCount || 0);
        const breakEvens = Number(row.breakEvenCount || 0);
        // Decided-trades denominator (win + loss + break-even) to match the
        // rest of analytics, so per-session win rate agrees with the KPI.
        const decisiveTrades = wins + losses + breakEvens;

        return {
            session: row.session as string,
            trades: Number(row.tradeCount || 0),
            pnl: Number(row.netProfit || 0),
            winRate: decisiveTrades > 0 ? (wins / decisiveTrades) * 100 : 0,
        };
    });

    return sessionOrder.map(
        (s) =>
            mapped.find((m) => m.session === s) || {
                session: s,
                trades: 0,
                pnl: 0,
                winRate: 0,
            }
    );
}
