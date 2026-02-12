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
export async function getMonthlyAnalytics(userId: string, accountId?: string) {
    // Determine the WHERE clause
    // Note: We use template literals for trusted values, but be careful with strings.
    // Prisma.sql is safer for preventing injection.
    
    // We fetch last 12 months by default
    const result = await prisma.$queryRaw`
        SELECT 
            TO_CHAR("exitDate", 'YYYY-MM') as "date",
            SUM("pnl") as "profit",
            COUNT(*) as "tradeCount",
            SUM(CASE WHEN "pnl" > 0 THEN 1 ELSE 0 END) as "winCount"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        -- Optional Account Filter
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
            SUM("pnl") as "totalPnL",
            SUM(CASE WHEN "pnl" > 0 THEN 1 ELSE 0 END) as "wins",
            SUM(CASE WHEN "pnl" < 0 THEN 1 ELSE 0 END) as "losses",
            SUM(CASE WHEN "pnl" > 0 THEN "pnl" ELSE 0 END) as "grossProfit",
            SUM(CASE WHEN "pnl" < 0 THEN ABS("pnl") ELSE 0 END) as "grossLoss"
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
        grossLoss
    };
}

/**
 * Cached Wrapper for Dashboard
 * Revalidates every 60 seconds or on demand
 */
export const getCachedDashboardStats = unstable_cache(
    async (userId: string, accountId?: string) => {
        const [stats, monthly] = await Promise.all([
            getKeyStats(userId, accountId),
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
export async function getDailyPerformance(userId: string, accountId?: string, startDate?: Date, endDate?: Date) {
    // Build date filter
    const dateFilter = startDate && endDate 
        ? Prisma.sql`AND "exitDate" >= ${startDate} AND "exitDate" <= ${endDate}`
        : Prisma.sql`AND "exitDate" >= NOW() - INTERVAL '90 days'`; // Default to 90 days if no date

    const result = await prisma.$queryRaw`
        SELECT 
            TO_CHAR("exitDate", 'YYYY-MM-DD') as "date",
            SUM("pnl") as "profit",
            COUNT(*) as "tradeCount",
            SUM(CASE WHEN "pnl" > 0 THEN 1 ELSE 0 END) as "winCount"
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
            SUM("pnl") as "netProfit",
            SUM(CASE WHEN "pnl" > 0 THEN "pnl" ELSE 0 END) as "grossProfit"
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
        grossProfit: Number(row.grossProfit || 0)
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
            SELECT "id", "symbol", "type", "pnl", "entryDate", "exitDate", "result", "lotSize"
            FROM "JournalEntry"
            WHERE "userId" = ${userId}::uuid
            AND "status" = 'CLOSED'
            AND (${accountId ? accountId : '1'} = '1' OR "accountId" = ${accountId})
            ${dateFilter}
            AND "pnl" > 0
            ORDER BY "pnl" DESC
            LIMIT 3
        `,
        // Worst Trades: Lowest Negative PnL (Biggest Loss)
        prisma.$queryRaw`
            SELECT "id", "symbol", "type", "pnl", "entryDate", "exitDate", "result", "lotSize"
            FROM "JournalEntry"
            WHERE "userId" = ${userId}::uuid
            AND "status" = 'CLOSED'
            AND (${accountId ? accountId : '1'} = '1' OR "accountId" = ${accountId})
            ${dateFilter}
            AND "pnl" < 0
            ORDER BY "pnl" ASC
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
