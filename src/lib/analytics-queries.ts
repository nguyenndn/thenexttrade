import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { unstable_cache } from "next/cache";

export interface AdvancedFilters {
    direction?: "BUY" | "SELL";
    source?: "MANUAL" | "AUTO";
    comment?: string;
    magicNumber?: number;
    symbol?: string;
    result?: "WIN" | "LOSS" | "BREAK_EVEN" | "BE_PLUS";
}

function normalizeAccountIdParam(accountId?: string): string | undefined {
    return accountId && accountId !== "all" ? accountId : undefined;
}

function buildAccountFilterSql(normalizedAccountId?: string): Prisma.Sql {
    return normalizedAccountId
        ? Prisma.sql`AND je."accountId" = ${normalizedAccountId}`
        : Prisma.empty;
}

function buildDateFilterSql(startDate?: Date, endDate?: Date): Prisma.Sql {
    const parts: Prisma.Sql[] = [];
    if (startDate) {
        parts.push(Prisma.sql`AND je."exitDate" >= ${startDate}`);
    }
    if (endDate) {
        parts.push(Prisma.sql`AND je."exitDate" <= ${endDate}`);
    }
    if (parts.length === 0) return Prisma.empty;
    return Prisma.sql` ${Prisma.join(parts, " ")}`;
}

/**
 * SQL FX/Cent multiplier matching `convertToUsdEquivalent` in `src/lib/utils/cent-account.ts`.
 * Applied ONLY when `accountId` is NOT pinned to a single account (`!normalizedAccountId`).
 */
function buildPnlScaleSql(normalizedAccountId?: string): Prisma.Sql {
    if (normalizedAccountId) {
        return Prisma.sql`1.0`;
    }
    return Prisma.sql`(CASE
        WHEN UPPER(COALESCE(ta."currency", '')) IN ('USC','USCENT','USDCENT','US_CENT','USDT_CENT','CENT') THEN 0.01
        WHEN UPPER(COALESCE(ta."currency", '')) IN ('EUC','EURC','EURCENT','EU_CENT','EUR_CENT') THEN 0.0108
        WHEN UPPER(COALESCE(ta."currency", '')) IN ('GBC','GBPC','GBPCENT','GB_CENT','GBP_CENT') THEN 0.0128
        WHEN UPPER(COALESCE(ta."currency", '')) IN ('JPC','JPYC','JPYCENT') THEN 0.000067
        WHEN UPPER(COALESCE(ta."currency", '')) IN ('AUC','AUDC','AUDCENT') THEN 0.0065
        WHEN UPPER(COALESCE(ta."currency", '')) IN ('CAC','CADC','CADCENT') THEN 0.0073
        WHEN UPPER(COALESCE(ta."currency", '')) IN ('CHC','CHFC','CHFCENT') THEN 0.0113
        WHEN UPPER(COALESCE(ta."currency", '')) IN ('NZC','NZDC','NZDCENT') THEN 0.006
        WHEN COALESCE(ta."server", '') ILIKE '%cent%' OR COALESCE(ta."account_type", '') ILIKE '%cent%' THEN
            CASE
                WHEN UPPER(COALESCE(ta."currency", '')) = 'EUR' THEN 0.0108
                WHEN UPPER(COALESCE(ta."currency", '')) = 'GBP' THEN 0.0128
                ELSE 0.01
            END
        WHEN UPPER(COALESCE(ta."currency", '')) = 'EUR' THEN 1.08
        WHEN UPPER(COALESCE(ta."currency", '')) = 'GBP' THEN 1.28
        WHEN UPPER(COALESCE(ta."currency", '')) = 'JPY' THEN 0.0067
        WHEN UPPER(COALESCE(ta."currency", '')) = 'AUD' THEN 0.65
        WHEN UPPER(COALESCE(ta."currency", '')) = 'CAD' THEN 0.73
        WHEN UPPER(COALESCE(ta."currency", '')) = 'CHF' THEN 1.13
        WHEN UPPER(COALESCE(ta."currency", '')) = 'NZD' THEN 0.60
        WHEN UPPER(COALESCE(ta."currency", '')) = 'SGD' THEN 0.76
        ELSE 1.0
    END)`;
}

/**
 * Synced trades (/api/ea/*, /api/sync/*, /api/mt5/*) already normalize Cent lotSize on ingest.
 * Only unnormalized MANUAL rows on Cent accounts need 0.01 lot scaling.
 */
function buildLotScaleSql(normalizedAccountId?: string): Prisma.Sql {
    if (normalizedAccountId) {
        return Prisma.sql`1.0`;
    }
    return Prisma.sql`(CASE
        WHEN COALESCE(je."sync_source", 'MANUAL') = 'MANUAL'
             AND (
                 UPPER(COALESCE(ta."currency", '')) IN ('USC','USCENT','USDCENT','US_CENT','USDT_CENT','CENT','EUC','EURC','EURCENT','EU_CENT','EUR_CENT','GBC','GBPC','GBPCENT','GB_CENT','GBP_CENT','JPC','JPYC','JPYCENT','AUC','AUDC','AUDCENT','CAC','CADC','CADCENT','CHC','CHFC','CHFCENT','NZC','NZDC','NZDCENT')
                 OR COALESCE(ta."server", '') ILIKE '%cent%'
                 OR COALESCE(ta."account_type", '') ILIKE '%cent%'
             )
        THEN 0.01
        ELSE 1.0
    END)`;
}

export function buildAdvancedFiltersSql(filters?: AdvancedFilters) {
    if (!filters) return Prisma.empty;
    const conditions: Prisma.Sql[] = [];

    if (filters.direction) {
        conditions.push(
            Prisma.sql`AND je."type" = ${filters.direction}::"TradeType"`
        );
    }

    if (filters.source) {
        if (filters.source === "MANUAL") {
            conditions.push(
                Prisma.sql`AND (je."sync_source" = 'MANUAL' OR (je."sync_source" = 'APP' AND (je."magic_number" = 0 OR je."magic_number" IS NULL)))`
            );
        } else if (filters.source === "AUTO") {
            conditions.push(
                Prisma.sql`AND je."sync_source" = 'APP' AND je."magic_number" > 0`
            );
        }
    }

    if (filters.comment) {
        conditions.push(
            Prisma.sql`AND je."notes" ILIKE ${"%" + filters.comment + "%"}`
        );
    }

    if (filters.magicNumber !== undefined && filters.magicNumber !== null) {
        conditions.push(
            Prisma.sql`AND je."magic_number" = ${filters.magicNumber}`
        );
    }

    if (filters.symbol) {
        conditions.push(
            Prisma.sql`AND je."symbol" ILIKE ${"%" + filters.symbol + "%"}`
        );
    }

    if (filters.result) {
        if (filters.result === "BREAK_EVEN") {
            conditions.push(
                Prisma.sql`AND je."result" IN ('BREAK_EVEN'::"TradeResult", 'BE_PLUS'::"TradeResult")`
            );
        } else {
            conditions.push(
                Prisma.sql`AND je."result" = ${filters.result}::"TradeResult"`
            );
        }
    }

    if (conditions.length === 0) return Prisma.empty;

    return Prisma.sql` ${Prisma.join(conditions, " ")}`;
}

interface MonthlyAnalyticsRow {
    date: string;
    profit: number | bigint | null;
    tradeCount: number | bigint | null;
    winCount: number | bigint | null;
}

interface KeyStatsRow {
    totalTrades: number | bigint | null;
    totalPnL: number | null;
    wins: number | bigint | null;
    losses: number | bigint | null;
    breakEvens: number | bigint | null;
    positiveTrades: number | bigint | null;
    negativeTrades: number | bigint | null;
    grossProfit: number | null;
    grossLoss: number | null;
    commission: number | null;
    swap: number | null;
    maxWin: number | null;
    maxLoss: number | null;
    avgHoldMinutes: number | null;
}

interface DailyPerformanceRow {
    date: string;
    profit: number | null;
    tradeCount: number | bigint | null;
    winCount: number | bigint | null;
    lossCount: number | bigint | null;
    breakEvenCount: number | bigint | null;
}

interface IntradayPerformanceRow {
    date: Date;
    pnl: number | null;
}

interface SymbolPerformanceRow {
    symbol: string;
    tradeCount: number | bigint | null;
    netProfit: number | null;
    grossProfit: number | null;
    grossLoss: number | null;
    winCount: number | bigint | null;
    lossCount: number | bigint | null;
    breakEvenCount: number | bigint | null;
    longTrades: number | bigint | null;
    longPnl: number | null;
    longWins: number | bigint | null;
    longLosses: number | bigint | null;
    longBreakEvens: number | bigint | null;
    shortTrades: number | bigint | null;
    shortPnl: number | null;
    shortWins: number | bigint | null;
    shortLosses: number | bigint | null;
    shortBreakEvens: number | bigint | null;
}

interface TopTradeRow {
    id: string;
    symbol: string;
    type: string;
    pnl: number | null;
    entryDate: Date;
    exitDate: Date | null;
    result: string | null;
    lotSize: number | null;
}

interface LotDistributionRow {
    symbol: string;
    totalLots: number | null;
}

interface DayOfWeekRow {
    dayIndex: number | string | bigint;
    tradeCount: number | bigint | null;
    netProfit: number | null;
    winCount: number | bigint | null;
    lossCount: number | bigint | null;
    breakEvenCount: number | bigint | null;
}

interface SessionPerformanceRow {
    session: string;
    tradeCount: number | bigint | null;
    netProfit: number | null;
    winCount: number | bigint | null;
    lossCount: number | bigint | null;
    breakEvenCount: number | bigint | null;
}

// ============================================================================
// RAW SQL ANALYTICS QUERIES
// ============================================================================

/**
 * Get aggregated Monthly Performance for a user
 * Returns { date, profit, tradeCount, winRate }
 */
export async function getMonthlyAnalytics(
    userId: string,
    accountId?: string,
    timezone?: string,
    filters?: AdvancedFilters
) {
    const normalizedAccountId = normalizeAccountIdParam(accountId);
    const tz = timezone || "Etc/UTC";
    const accountFilter = buildAccountFilterSql(normalizedAccountId);
    const scaleSql = buildPnlScaleSql(normalizedAccountId);
    const advancedFiltersSql = buildAdvancedFiltersSql(filters);

    const result = await prisma.$queryRaw<MonthlyAnalyticsRow[]>`
  SELECT 
    TO_CHAR(je."exitDate" AT TIME ZONE ${tz}, 'YYYY-MM') as "date",
    SUM((COALESCE(je."pnl", 0) + COALESCE(je."commission", 0) + COALESCE(je."swap", 0)) * ${scaleSql}) as "profit",
    COUNT(*) as "tradeCount",
    SUM(CASE WHEN je."result" = 'WIN' THEN 1 ELSE 0 END) as "winCount"
  FROM "journal_entries" je
  LEFT JOIN "trading_accounts" ta ON ta."id" = je."accountId"
  WHERE je."userId" = ${userId}::uuid
    AND je."status" = 'CLOSED'
    ${accountFilter}
    AND je."exitDate" >= NOW() - INTERVAL '12 months'
    ${advancedFiltersSql}
  GROUP BY 1
  ORDER BY 1 ASC
  `;

    return result.map((row) => ({
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
    const normalizedAccountId = normalizeAccountIdParam(accountId);
    const accountFilter = buildAccountFilterSql(normalizedAccountId);
    const dateFilter = buildDateFilterSql(startDate, endDate);
    const scaleSql = buildPnlScaleSql(normalizedAccountId);
    const advancedFiltersSql = buildAdvancedFiltersSql(filters);

    const result = await prisma.$queryRaw<KeyStatsRow[]>`
  WITH scoped AS (
    SELECT
      je."result",
      je."entryDate",
      je."exitDate",
      (COALESCE(je."commission", 0) * ${scaleSql}) AS "scaledCommission",
      (COALESCE(je."swap", 0) * ${scaleSql}) AS "scaledSwap",
      ((COALESCE(je."pnl", 0) + COALESCE(je."commission", 0) + COALESCE(je."swap", 0)) * ${scaleSql}) AS "scaledNetPnl"
    FROM "journal_entries" je
    LEFT JOIN "trading_accounts" ta ON ta."id" = je."accountId"
    WHERE je."userId" = ${userId}::uuid
      AND je."status" = 'CLOSED'
      ${accountFilter}
      ${dateFilter}
      ${advancedFiltersSql}
  )
  SELECT 
    COUNT(*) as "totalTrades",
    SUM("scaledNetPnl") as "totalPnL",
    COUNT(*) FILTER (WHERE "result" = 'WIN') as "wins",
    COUNT(*) FILTER (WHERE "result" = 'LOSS') as "losses",
    COUNT(*) FILTER (WHERE "result" IN ('BREAK_EVEN', 'BE_PLUS')) as "breakEvens",
    COUNT(*) FILTER (WHERE "scaledNetPnl" > 0) as "positiveTrades",
    COUNT(*) FILTER (WHERE "scaledNetPnl" < 0) as "negativeTrades",
    SUM(CASE WHEN "scaledNetPnl" > 0 THEN "scaledNetPnl" ELSE 0 END) as "grossProfit",
    SUM(CASE WHEN "scaledNetPnl" < 0 THEN ABS("scaledNetPnl") ELSE 0 END) as "grossLoss",
    SUM("scaledCommission") as "commission",
    SUM("scaledSwap") as "swap",
    MAX(CASE WHEN "scaledNetPnl" > 0 THEN "scaledNetPnl" ELSE 0 END) as "maxWin",
    MIN(CASE WHEN "scaledNetPnl" < 0 THEN "scaledNetPnl" ELSE 0 END) as "maxLoss",
    AVG(EXTRACT(EPOCH FROM ("exitDate" - "entryDate"))/60) as "avgHoldMinutes"
  FROM scoped
  `;

    const stats = result[0];
    const totalTrades = Number(stats?.totalTrades || 0);
    const wins = Number(stats?.wins || 0);
    const losses = Number(stats?.losses || 0);
    const breakEvens = Number(stats?.breakEvens || 0);
    const positiveTrades = Number(stats?.positiveTrades || 0);
    const negativeTrades = Number(stats?.negativeTrades || 0);
    const totalClosed = wins + losses + breakEvens;
    const grossProfit = Number(stats?.grossProfit || 0);
    const grossLoss = Number(stats?.grossLoss || 0);

    return {
        totalTrades,
        winCount: wins,
        lossCount: losses,
        winRate: totalClosed > 0 ? (wins / totalClosed) * 100 : 0,
        totalPnL: Number(stats?.totalPnL || 0),
        profitFactor:
            grossLoss > 0
                ? grossProfit / grossLoss
                : grossProfit > 0
                  ? 99
                  : 0,
        grossProfit,
        grossLoss,
        avgWin: positiveTrades > 0 ? grossProfit / positiveTrades : 0,
        avgLoss: negativeTrades > 0 ? grossLoss / negativeTrades : 0,
        commission: Number(stats?.commission || 0),
        swap: Number(stats?.swap || 0),
        maxWin: Number(stats?.maxWin || 0),
        maxLoss: Number(stats?.maxLoss || 0),
        avgHoldMinutes: Number(stats?.avgHoldMinutes || 0),
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
        revalidate: 60,
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
    const normalizedAccountId = normalizeAccountIdParam(accountId);
    const tz = timezone || "Etc/UTC";
    const accountFilter = buildAccountFilterSql(normalizedAccountId);
    const dateFilter = buildDateFilterSql(startDate, endDate);
    const scaleSql = buildPnlScaleSql(normalizedAccountId);
    const advancedFiltersSql = buildAdvancedFiltersSql(filters);

    const result = await prisma.$queryRaw<DailyPerformanceRow[]>`
  SELECT 
    TO_CHAR(je."exitDate" AT TIME ZONE ${tz}, 'YYYY-MM-DD') as "date",
    SUM((COALESCE(je."pnl", 0) + COALESCE(je."commission", 0) + COALESCE(je."swap", 0)) * ${scaleSql}) as "profit",
    COUNT(*) as "tradeCount",
    COUNT(*) FILTER (WHERE je."result" = 'WIN') as "winCount",
    COUNT(*) FILTER (WHERE je."result" = 'LOSS') as "lossCount",
    COUNT(*) FILTER (WHERE je."result" IN ('BREAK_EVEN', 'BE_PLUS')) as "breakEvenCount"
  FROM "journal_entries" je
  LEFT JOIN "trading_accounts" ta ON ta."id" = je."accountId"
  WHERE je."userId" = ${userId}::uuid
    AND je."status" = 'CLOSED'
    ${accountFilter}
    ${dateFilter}
    ${advancedFiltersSql}
  GROUP BY 1
  ORDER BY 1 ASC
  `;

    return result.map((row) => {
        const wins = Number(row.winCount || 0);
        const losses = Number(row.lossCount || 0);
        const breakEvens = Number(row.breakEvenCount || 0);
        const totalClosed = wins + losses + breakEvens;

        return {
            date: row.date,
            value: Number(row.profit || 0),
            winRate: totalClosed > 0 ? (wins / totalClosed) * 100 : 0,
            tradeCount: Number(row.tradeCount || 0),
            winCount: wins,
            lossCount: losses,
        };
    });
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
    const normalizedAccountId = normalizeAccountIdParam(accountId);
    const accountFilter = buildAccountFilterSql(normalizedAccountId);
    const dateFilter = buildDateFilterSql(startDate, endDate);
    const scaleSql = buildPnlScaleSql(normalizedAccountId);
    const advancedFiltersSql = buildAdvancedFiltersSql(filters);

    const result = await prisma.$queryRaw<IntradayPerformanceRow[]>`
  SELECT 
    je."exitDate" as "date",
    ((COALESCE(je."pnl", 0) + COALESCE(je."commission", 0) + COALESCE(je."swap", 0)) * ${scaleSql}) as "pnl"
  FROM "journal_entries" je
  LEFT JOIN "trading_accounts" ta ON ta."id" = je."accountId"
  WHERE je."userId" = ${userId}::uuid
    AND je."status" = 'CLOSED'
    AND je."exitDate" IS NOT NULL
    ${accountFilter}
    ${dateFilter}
    ${advancedFiltersSql}
  ORDER BY je."exitDate" ASC
  `;

    return result.map((row) => ({
        date: row.date.toISOString(),
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
    const normalizedAccountId = normalizeAccountIdParam(accountId);
    const accountFilter = buildAccountFilterSql(normalizedAccountId);
    const dateFilter = buildDateFilterSql(startDate, endDate);
    const scaleSql = buildPnlScaleSql(normalizedAccountId);
    const advancedFiltersSql = buildAdvancedFiltersSql(filters);

    const result = await prisma.$queryRaw<SymbolPerformanceRow[]>`
  WITH scoped AS (
    SELECT
      je."symbol",
      je."type",
      je."result",
      ((COALESCE(je."pnl", 0) + COALESCE(je."commission", 0) + COALESCE(je."swap", 0)) * ${scaleSql}) AS "scaledNetPnl"
    FROM "journal_entries" je
    LEFT JOIN "trading_accounts" ta ON ta."id" = je."accountId"
    WHERE je."userId" = ${userId}::uuid
      AND je."status" = 'CLOSED'
      ${accountFilter}
      ${dateFilter}
      ${advancedFiltersSql}
  )
  SELECT 
    "symbol",
    COUNT(*) as "tradeCount",
    SUM("scaledNetPnl") as "netProfit",
    SUM(CASE WHEN "scaledNetPnl" > 0 THEN "scaledNetPnl" ELSE 0 END) as "grossProfit",
    SUM(CASE WHEN "scaledNetPnl" < 0 THEN ABS("scaledNetPnl") ELSE 0 END) as "grossLoss",
    COUNT(*) FILTER (WHERE "result" = 'WIN') as "winCount",
    COUNT(*) FILTER (WHERE "result" = 'LOSS') as "lossCount",
    COUNT(*) FILTER (WHERE "result" IN ('BREAK_EVEN', 'BE_PLUS')) as "breakEvenCount",
    COUNT(*) FILTER (WHERE "type" = 'BUY') as "longTrades",
    SUM(CASE WHEN "type" = 'BUY' THEN "scaledNetPnl" ELSE 0 END) as "longPnl",
    COUNT(*) FILTER (WHERE "type" = 'BUY' AND "result" = 'WIN') as "longWins",
    COUNT(*) FILTER (WHERE "type" = 'BUY' AND "result" = 'LOSS') as "longLosses",
    COUNT(*) FILTER (WHERE "type" = 'BUY' AND "result" IN ('BREAK_EVEN', 'BE_PLUS')) as "longBreakEvens",
    COUNT(*) FILTER (WHERE "type" = 'SELL') as "shortTrades",
    SUM(CASE WHEN "type" = 'SELL' THEN "scaledNetPnl" ELSE 0 END) as "shortPnl",
    COUNT(*) FILTER (WHERE "type" = 'SELL' AND "result" = 'WIN') as "shortWins",
    COUNT(*) FILTER (WHERE "type" = 'SELL' AND "result" = 'LOSS') as "shortLosses",
    COUNT(*) FILTER (WHERE "type" = 'SELL' AND "result" IN ('BREAK_EVEN', 'BE_PLUS')) as "shortBreakEvens"
  FROM scoped
  GROUP BY "symbol"
  ORDER BY "netProfit" DESC
  LIMIT 10
  `;

    return result.map((row) => {
        const wins = Number(row.winCount || 0);
        const losses = Number(row.lossCount || 0);
        const breakEvens = Number(row.breakEvenCount || 0);
        const totalClosed = wins + losses + breakEvens;
        const grossProfit = Number(row.grossProfit || 0);
        const grossLoss = Number(row.grossLoss || 0);

        const lWins = Number(row.longWins || 0);
        const lClosed =
            lWins +
            Number(row.longLosses || 0) +
            Number(row.longBreakEvens || 0);

        const sWins = Number(row.shortWins || 0);
        const sClosed =
            sWins +
            Number(row.shortLosses || 0) +
            Number(row.shortBreakEvens || 0);

        return {
            symbol: row.symbol,
            trades: Number(row.tradeCount),
            pnl: Number(row.netProfit || 0),
            grossProfit,
            profitFactor:
                grossLoss > 0
                    ? Number((grossProfit / grossLoss).toFixed(2))
                    : grossProfit > 0
                      ? 99.9
                      : 0,
            winRate: totalClosed > 0 ? (wins / totalClosed) * 100 : 0,
            longTrades: Number(row.longTrades || 0),
            longPnl: Number(row.longPnl || 0),
            longWinRate: lClosed > 0 ? (lWins / lClosed) * 100 : 0,
            shortTrades: Number(row.shortTrades || 0),
            shortPnl: Number(row.shortPnl || 0),
            shortWinRate: sClosed > 0 ? (sWins / sClosed) * 100 : 0,
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
    const normalizedAccountId = normalizeAccountIdParam(accountId);
    const accountFilter = buildAccountFilterSql(normalizedAccountId);
    const dateFilter = buildDateFilterSql(startDate, endDate);
    const scaleSql = buildPnlScaleSql(normalizedAccountId);
    const lotScaleSql = buildLotScaleSql(normalizedAccountId);
    const advancedFiltersSql = buildAdvancedFiltersSql(filters);

    const [bestResult, worstResult] = await Promise.all([
        prisma.$queryRaw<TopTradeRow[]>`
  SELECT
    je."id",
    je."symbol",
    je."type",
    ((COALESCE(je."pnl", 0) + COALESCE(je."commission", 0) + COALESCE(je."swap", 0)) * ${scaleSql}) as "pnl",
    je."entryDate",
    je."exitDate",
    je."result",
    (COALESCE(je."lotSize", 0) * ${lotScaleSql}) as "lotSize"
  FROM "journal_entries" je
  LEFT JOIN "trading_accounts" ta ON ta."id" = je."accountId"
  WHERE je."userId" = ${userId}::uuid
    AND je."status" = 'CLOSED'
    ${accountFilter}
    ${dateFilter}
    ${advancedFiltersSql}
    AND ((COALESCE(je."pnl", 0) + COALESCE(je."commission", 0) + COALESCE(je."swap", 0)) * ${scaleSql}) > 0
  ORDER BY ((COALESCE(je."pnl", 0) + COALESCE(je."commission", 0) + COALESCE(je."swap", 0)) * ${scaleSql}) DESC
  LIMIT 3
  `,
        prisma.$queryRaw<TopTradeRow[]>`
  SELECT
    je."id",
    je."symbol",
    je."type",
    ((COALESCE(je."pnl", 0) + COALESCE(je."commission", 0) + COALESCE(je."swap", 0)) * ${scaleSql}) as "pnl",
    je."entryDate",
    je."exitDate",
    je."result",
    (COALESCE(je."lotSize", 0) * ${lotScaleSql}) as "lotSize"
  FROM "journal_entries" je
  LEFT JOIN "trading_accounts" ta ON ta."id" = je."accountId"
  WHERE je."userId" = ${userId}::uuid
    AND je."status" = 'CLOSED'
    ${accountFilter}
    ${dateFilter}
    ${advancedFiltersSql}
    AND ((COALESCE(je."pnl", 0) + COALESCE(je."commission", 0) + COALESCE(je."swap", 0)) * ${scaleSql}) < 0
  ORDER BY ((COALESCE(je."pnl", 0) + COALESCE(je."commission", 0) + COALESCE(je."swap", 0)) * ${scaleSql}) ASC
  LIMIT 3
  `,
    ]);

    const mapTrade = (t: TopTradeRow) => ({
        id: t.id,
        symbol: t.symbol,
        type: t.type,
        pnl: Number(t.pnl || 0),
        lotSize: Number(t.lotSize || 0),
        date: t.exitDate,
        result: t.result,
    });

    return {
        best: bestResult.map(mapTrade),
        worst: worstResult.map(mapTrade),
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
    const normalizedAccountId = normalizeAccountIdParam(accountId);
    const accountFilter = buildAccountFilterSql(normalizedAccountId);
    const dateFilter = buildDateFilterSql(startDate, endDate);
    const lotScaleSql = buildLotScaleSql(normalizedAccountId);
    const advancedFiltersSql = buildAdvancedFiltersSql(filters);

    const result = await prisma.$queryRaw<LotDistributionRow[]>`
  SELECT 
    je."symbol",
    SUM(COALESCE(je."lotSize", 0) * ${lotScaleSql}) as "totalLots"
  FROM "journal_entries" je
  LEFT JOIN "trading_accounts" ta ON ta."id" = je."accountId"
  WHERE je."userId" = ${userId}::uuid
    AND je."status" = 'CLOSED'
    ${accountFilter}
    ${dateFilter}
    ${advancedFiltersSql}
  GROUP BY je."symbol"
  ORDER BY "totalLots" DESC
  LIMIT 5
  `;

    return result.map((row) => ({
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
    const normalizedAccountId = normalizeAccountIdParam(accountId);
    const tz = timezone || "Etc/UTC";
    const accountFilter = buildAccountFilterSql(normalizedAccountId);
    const dateFilter = buildDateFilterSql(startDate, endDate);
    const scaleSql = buildPnlScaleSql(normalizedAccountId);
    const advancedFiltersSql = buildAdvancedFiltersSql(filters);

    const result = await prisma.$queryRaw<DayOfWeekRow[]>`
  SELECT 
    EXTRACT(DOW FROM je."exitDate" AT TIME ZONE ${tz}) as "dayIndex",
    COUNT(*) as "tradeCount",
    SUM((COALESCE(je."pnl", 0) + COALESCE(je."commission", 0) + COALESCE(je."swap", 0)) * ${scaleSql}) as "netProfit",
    COUNT(*) FILTER (WHERE je."result" = 'WIN') as "winCount",
    COUNT(*) FILTER (WHERE je."result" = 'LOSS') as "lossCount",
    COUNT(*) FILTER (WHERE je."result" IN ('BREAK_EVEN', 'BE_PLUS')) as "breakEvenCount"
  FROM "journal_entries" je
  LEFT JOIN "trading_accounts" ta ON ta."id" = je."accountId"
  WHERE je."userId" = ${userId}::uuid
    AND je."status" = 'CLOSED'
    ${accountFilter}
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

    return result.map((row) => {
        const wins = Number(row.winCount || 0);
        const losses = Number(row.lossCount || 0);
        const breakEvens = Number(row.breakEvenCount || 0);
        const totalClosed = wins + losses + breakEvens;

        return {
            day: dayNames[Number(row.dayIndex)],
            dayIndex: Number(row.dayIndex),
            pnl: Number(row.netProfit || 0),
            tradeCount: Number(row.tradeCount || 0),
            winRate: totalClosed > 0 ? (wins / totalClosed) * 100 : 0,
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
    const normalizedAccountId = normalizeAccountIdParam(accountId);
    const accountFilter = buildAccountFilterSql(normalizedAccountId);

    const result = await prisma.$queryRaw<{ result: string }[]>`
  SELECT je."result"
  FROM "journal_entries" je
  WHERE je."userId" = ${userId}::uuid
    AND je."status" = 'CLOSED'
    AND je."result" IS NOT NULL
    ${accountFilter}
  ORDER BY je."exitDate" DESC
  LIMIT 50
  `;

    if (!result.length) return { type: "none", count: 0 };

    const firstResult = result[0].result;
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
    const normalizedAccountId = normalizeAccountIdParam(accountId);
    const accountFilter = buildAccountFilterSql(normalizedAccountId);
    const dateFilter = buildDateFilterSql(startDate, endDate);
    const scaleSql = buildPnlScaleSql(normalizedAccountId);
    const advancedFiltersSql = buildAdvancedFiltersSql(filters);

    const result = await prisma.$queryRaw<SessionPerformanceRow[]>`
  SELECT 
    CASE 
      WHEN EXTRACT(HOUR FROM je."entryDate") >= 21 OR EXTRACT(HOUR FROM je."entryDate") < 6 THEN 'Sydney'
      WHEN EXTRACT(HOUR FROM je."entryDate") >= 0 AND EXTRACT(HOUR FROM je."entryDate") < 9 THEN 'Tokyo'
      WHEN EXTRACT(HOUR FROM je."entryDate") >= 8 AND EXTRACT(HOUR FROM je."entryDate") < 17 THEN 'London'
      WHEN EXTRACT(HOUR FROM je."entryDate") >= 13 AND EXTRACT(HOUR FROM je."entryDate") < 22 THEN 'New York'
      ELSE 'Off-Hours'
    END as "session",
    COUNT(*) as "tradeCount",
    SUM((COALESCE(je."pnl", 0) + COALESCE(je."commission", 0) + COALESCE(je."swap", 0)) * ${scaleSql}) as "netProfit",
    COUNT(*) FILTER (WHERE je."result" = 'WIN') as "winCount",
    COUNT(*) FILTER (WHERE je."result" = 'LOSS') as "lossCount",
    COUNT(*) FILTER (WHERE je."result" IN ('BREAK_EVEN', 'BE_PLUS')) as "breakEvenCount"
  FROM "journal_entries" je
  LEFT JOIN "trading_accounts" ta ON ta."id" = je."accountId"
  WHERE je."userId" = ${userId}::uuid
    AND je."status" = 'CLOSED'
    AND je."entryDate" IS NOT NULL
    ${accountFilter}
    ${dateFilter}
    ${advancedFiltersSql}
  GROUP BY 1
  ORDER BY "netProfit" DESC
  `;

    const sessionOrder = ["Sydney", "Tokyo", "London", "New York"];
    const mapped = result.map((row) => {
        const wins = Number(row.winCount || 0);
        const losses = Number(row.lossCount || 0);
        const breakEvens = Number(row.breakEvenCount || 0);
        const totalClosed = wins + losses + breakEvens;

        return {
            session: row.session,
            trades: Number(row.tradeCount || 0),
            pnl: Number(row.netProfit || 0),
            winRate: totalClosed > 0 ? (wins / totalClosed) * 100 : 0,
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
