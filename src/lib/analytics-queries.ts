import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

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
export async function getMonthlyAnalytics(userId: string, accountId?: string, timezone?: string) {
    const tz = timezone || 'Etc/UTC';

    const result = await prisma.$queryRaw`
        SELECT 
            TO_CHAR("exitDate" AT TIME ZONE ${tz}, 'YYYY-MM') as "date",
            SUM("pnl") as "profit",
            COUNT(*) as "tradeCount",
            SUM(CASE WHEN "pnl" > 0 THEN 1 ELSE 0 END) as "winCount"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND (${accountId ? accountId : '1'} = '1' OR "accountId" = ${accountId})
        AND "exitDate" >= NOW() - INTERVAL '12 months'
        GROUP BY 1
        ORDER BY 1 ASC
    `;

    // Cast BigInt to Number if necessary (Prisma returns BigInt for COUNT)
    return (result as any[]).map(row => ({
        date: row.date,
        profit: Number(row.profit || 0),
        tradeCount: Number(row.tradeCount || 0),
        winRate: Number(row.tradeCount) > 0 ? (Number(row.winCount) / Number(row.tradeCount)) * 100 : 0
    }));
}

/**
 * Get Key Statistics (Win Rate, Profit Factor, Total PnL)
 * Single Query optimized
 */
export async function getKeyStats(userId: string, accountId?: string, startDate?: Date, endDate?: Date) {
    // Build date filter
    const dateFilter = startDate && endDate
        ? Prisma.sql`AND "exitDate" >= ${startDate} AND "exitDate" <= ${endDate}`
        : Prisma.empty;

    const result = await prisma.$queryRaw`
        SELECT 
            COUNT(*) as "totalTrades",
            SUM(COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "totalPnL",
            SUM(CASE WHEN (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) > 0 THEN 1 ELSE 0 END) as "wins",
            SUM(CASE WHEN (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) < 0 THEN 1 ELSE 0 END) as "losses",
            SUM(CASE WHEN (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) > 0 THEN (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) ELSE 0 END) as "grossProfit",
            SUM(CASE WHEN (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) < 0 THEN ABS(COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) ELSE 0 END) as "grossLoss"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND (${accountId ? accountId : '1'} = '1' OR "accountId" = ${accountId})
        ${dateFilter}
    `;

    const stats = (result as any[])[0] || {};
    const totalTrades = Number(stats.totalTrades || 0);
    const wins = Number(stats.wins || 0);
    const losses = Number(stats.losses || 0);
    const grossProfit = Number(stats.grossProfit || 0);
    const grossLoss = Number(stats.grossLoss || 0);

    return {
        totalTrades,
        winCount: wins,
        lossCount: losses,
        winRate: totalTrades > 0 ? (wins / totalTrades) * 100 : 0,
        totalPnL: Number(stats.totalPnL || 0),
        profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0,
        grossProfit,
        grossLoss,
        avgWin: wins > 0 ? grossProfit / wins : 0,
        avgLoss: losses > 0 ? grossLoss / losses : 0
    };
}

/**
 * Cached Wrapper for Dashboard
 * Revalidates every 60 seconds or on demand
 */
export const getCachedDashboardStats = unstable_cache(
    async (userId: string, accountId?: string, startDate?: string, endDate?: string) => {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;

        const [stats, monthly] = await Promise.all([
            getKeyStats(userId, accountId, start, end),
            getMonthlyAnalytics(userId, accountId)
        ]);
        return { stats, monthly };
    },
    ['dashboard-stats'],
    {
        revalidate: 60, // 60 Seconds Cache
        tags: ['dashboard-stats']
    }
);

/**
 * Get Daily Performance for Chart (last 90 days default)
 */
/**
 * Get Daily Performance for Chart
 */
export async function getDailyPerformance(userId: string, accountId?: string, startDate?: Date, endDate?: Date, timezone?: string) {
    const tz = timezone || 'Etc/UTC';
    // Build date filter
    const dateFilter = startDate && endDate
        ? Prisma.sql`AND "exitDate" >= ${startDate} AND "exitDate" <= ${endDate}`
        : Prisma.empty; // Default to all time if no date

    const result = await prisma.$queryRaw`
        SELECT 
            TO_CHAR("exitDate" AT TIME ZONE ${tz}, 'YYYY-MM-DD') as "date",
            SUM(COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "profit",
            COUNT(*) as "tradeCount",
            SUM(CASE WHEN (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) > 0 THEN 1 ELSE 0 END) as "winCount"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND (${accountId ? accountId : '1'} = '1' OR "accountId" = ${accountId})
        ${dateFilter}
        GROUP BY 1
        ORDER BY 1 ASC
    `;

    return (result as any[]).map(row => ({
        date: row.date,
        value: Number(row.profit || 0), // Daily PnL
        winRate: Number(row.tradeCount) > 0 ? (Number(row.winCount) / Number(row.tradeCount)) * 100 : 0,
        tradeCount: Number(row.tradeCount || 0),
        winCount: Number(row.winCount || 0)
    }));
}

/**
 * Get Intraday Performance (trade-by-trade) for single-day chart
 * Returns individual trades with timestamps for cumulative profit line
 */
export async function getIntradayPerformance(userId: string, accountId?: string, startDate?: Date, endDate?: Date) {
    const dateFilter = startDate && endDate
        ? Prisma.sql`AND "exitDate" >= ${startDate} AND "exitDate" <= ${endDate}`
        : Prisma.empty;

    const result = await prisma.$queryRaw`
        SELECT 
            "exitDate" as "date",
            (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "pnl"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND (${accountId ? accountId : '1'} = '1' OR "accountId" = ${accountId})
        ${dateFilter}
        ORDER BY "exitDate" ASC
    `;

    return (result as any[]).map(row => ({
        date: (row.date as Date).toISOString(),
        pnl: Number(row.pnl || 0),
    }));
}

/**
 * Get Symbol Performance for Pie Chart & List
 */
/**
 * Get Symbol Performance for Pie Chart & List
 */
export async function getSymbolPerformance(userId: string, accountId?: string, startDate?: Date, endDate?: Date) {
    // Build date filter
    const dateFilter = startDate && endDate
        ? Prisma.sql`AND "exitDate" >= ${startDate} AND "exitDate" <= ${endDate}`
        : Prisma.empty;

    const result = await prisma.$queryRaw`
        SELECT 
            "symbol",
            COUNT(*) as "tradeCount",
            SUM(COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "netProfit",
            SUM(CASE WHEN (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) > 0 THEN (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) ELSE 0 END) as "grossProfit",
            SUM(CASE WHEN "result" = 'WIN' THEN 1 ELSE 0 END) as "winCount"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND (${accountId ? accountId : '1'} = '1' OR "accountId" = ${accountId})
        ${dateFilter}
        GROUP BY "symbol"
        ORDER BY "netProfit" DESC
        LIMIT 10
    `;

    return (result as any[]).map(row => ({
        symbol: row.symbol,
        trades: Number(row.tradeCount),
        pnl: Number(row.netProfit || 0),
        grossProfit: Number(row.grossProfit || 0),
        winRate: Number(row.tradeCount) > 0 ? (Number(row.winCount) / Number(row.tradeCount)) * 100 : 0
    }));
}

/**
 * Get Top Trades (Best & Worst)
 */
export async function getTopTrades(userId: string, accountId?: string, startDate?: Date, endDate?: Date) {
    // Build date filter
    const dateFilter = startDate && endDate
        ? Prisma.sql`AND "exitDate" >= ${startDate} AND "exitDate" <= ${endDate}`
        : Prisma.empty;

    const [bestResult, worstResult] = await Promise.all([
        // Best Trades: Highest Positive PnL
        prisma.$queryRaw`
            SELECT "id", "symbol", "type", (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "pnl", "entryDate", "exitDate", "result", "lotSize"
            FROM "JournalEntry"
            WHERE "userId" = ${userId}::uuid
            AND "status" = 'CLOSED'
            AND (${accountId ? accountId : '1'} = '1' OR "accountId" = ${accountId})
            ${dateFilter}
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
            AND (${accountId ? accountId : '1'} = '1' OR "accountId" = ${accountId})
            ${dateFilter}
            AND (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) < 0
            ORDER BY (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) ASC
            LIMIT 3
        `
    ]);

    const mapTrade = (t: any) => ({
        id: t.id,
        symbol: t.symbol,
        type: t.type,
        pnl: Number(t.pnl),
        lotSize: Number(t.lotSize || 0),
        date: t.exitDate,
        result: t.result
    });

    return {
        best: (bestResult as any[]).map(mapTrade),
        worst: (worstResult as any[]).map(mapTrade)
    };
}

/**
 * Get Lot Distribution by Symbol
 */
export async function getLotDistribution(userId: string, accountId?: string, startDate?: Date, endDate?: Date) {
    // Build date filter
    const dateFilter = startDate && endDate
        ? Prisma.sql`AND "exitDate" >= ${startDate} AND "exitDate" <= ${endDate}`
        : Prisma.empty;

    const result = await prisma.$queryRaw`
        SELECT 
            "symbol",
            SUM("lotSize") as "totalLots"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND (${accountId ? accountId : '1'} = '1' OR "accountId" = ${accountId})
        ${dateFilter}
        GROUP BY "symbol"
        ORDER BY "totalLots" DESC
        LIMIT 5
    `;

    return (result as any[]).map(row => ({
        name: row.symbol,
        value: Number(row.totalLots || 0)
    }));
}
/**
 * Get Day of Week Performance
 * Returns { day, dayIndex, pnl, tradeCount, winRate }
 */
export async function getDayOfWeekPerformance(userId: string, accountId?: string, startDate?: Date, endDate?: Date, timezone?: string) {
    const tz = timezone || 'Etc/UTC';
    // Build date filter
    const dateFilter = startDate && endDate
        ? Prisma.sql`AND "exitDate" >= ${startDate} AND "exitDate" <= ${endDate}`
        : Prisma.empty;

    const result = await prisma.$queryRaw`
        SELECT 
            EXTRACT(DOW FROM "exitDate" AT TIME ZONE ${tz}) as "dayIndex",
            COUNT(*) as "tradeCount",
            SUM(COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "netProfit",
            SUM(CASE WHEN "result" = 'WIN' THEN 1 ELSE 0 END) as "winCount"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND (${accountId ? accountId : '1'} = '1' OR "accountId" = ${accountId})
        ${dateFilter}
        GROUP BY 1
        ORDER BY 1 ASC
    `;

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    return (result as any[]).map(row => ({
        day: dayNames[Number(row.dayIndex)],
        dayIndex: Number(row.dayIndex),
        pnl: Number(row.netProfit || 0),
        tradeCount: Number(row.tradeCount || 0),
        winRate: Number(row.tradeCount) > 0 ? (Number(row.winCount) / Number(row.tradeCount)) * 100 : 0
    }));
}

/**
 * Get Current Win/Loss Streak
 * Queries the most recent closed trades and counts consecutive results
 */
export async function getCurrentStreak(userId: string, accountId?: string): Promise<{ type: 'win' | 'loss' | 'none'; count: number }> {
    const result = await prisma.$queryRaw`
        SELECT "result"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND "result" IS NOT NULL
        AND (${accountId ? accountId : '1'} = '1' OR "accountId" = ${accountId})
        ORDER BY "exitDate" DESC
        LIMIT 50
    ` as { result: string }[];

    if (!result.length) return { type: 'none', count: 0 };

    const firstResult = result[0].result; // WIN or LOSS
    if (firstResult !== 'WIN' && firstResult !== 'LOSS') return { type: 'none', count: 0 };

    let count = 0;
    for (const trade of result) {
        if (trade.result === firstResult) {
            count++;
        } else {
            break;
        }
    }

    return { type: firstResult === 'WIN' ? 'win' : 'loss', count };
}

/**
 * Get Trading Session Performance (Asian, London, New York)
 * Groups trades by the forex session of their entry time (UTC)
 */
export async function getSessionPerformance(userId: string, accountId?: string, startDate?: Date, endDate?: Date) {
    const dateFilter = startDate && endDate
        ? Prisma.sql`AND "exitDate" >= ${startDate} AND "exitDate" <= ${endDate}`
        : Prisma.empty;

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
            SUM(CASE WHEN (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) > 0 THEN 1 ELSE 0 END) as "winCount"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND "entryDate" IS NOT NULL
        AND (${accountId ? accountId : '1'} = '1' OR "accountId" = ${accountId})
        ${dateFilter}
        GROUP BY 1
        ORDER BY "netProfit" DESC
    `;

    const sessionOrder = ['Sydney', 'Tokyo', 'London', 'New York'];
    const mapped = (result as any[]).map(row => ({
        session: row.session as string,
        trades: Number(row.tradeCount || 0),
        pnl: Number(row.netProfit || 0),
        winRate: Number(row.tradeCount) > 0 ? (Number(row.winCount) / Number(row.tradeCount)) * 100 : 0,
    }));

    return sessionOrder
        .map(s => mapped.find(m => m.session === s) || { session: s, trades: 0, pnl: 0, winRate: 0 });
}
