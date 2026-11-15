import { prisma } from "@/lib/prisma";
import { Prisma, ReportType } from "@prisma/client";
import { getMistakeByCode } from "@/lib/mistakes";

// ============================================================================
// REPORT GENERATOR SERVICE
// ============================================================================
// Generates weekly/monthly trading reports with:
// - Core stats (PnL, win rate, profit factor)
// - Symbol/Strategy/Session breakdowns
// - Psychology stats (confidence, plan compliance, emotions)
// - Mistake recap
// - Best/Worst trades
// - Previous period comparison

interface ReportPeriod {
    start: Date;
    end: Date;
    label: string;
    type: ReportType;
}

interface BreakdownItem {
    name: string;
    trades: number;
    pnl: number;
    winRate: number;
}

interface TradeSnippet {
    symbol: string;
    pnl: number;
    date: string;
}

// ─── Period Calculation ─────────────────────────────────────────────────────

/**
 * Get the previous week's Monday-Sunday period in UTC (B1: never double-shift UTC timestamps by account.timezone)
 */
export function getWeeklyPeriod(
    now: Date,
    _timezone = "Etc/UTC",
    current = false
): ReportPeriod {
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth() + 1;
    const d = now.getUTCDate();
    const local = new Date(Date.UTC(y, m - 1, d));

    // DOW: 0=Sun, 1=Mon, ..., 6=Sat
    const dow = local.getUTCDay();

    let monday: Date;
    let sunday: Date;

    if (current) {
        // Current week: go back to this Monday
        const daysBack = dow === 0 ? 6 : dow - 1;
        monday = new Date(local);
        monday.setUTCDate(local.getUTCDate() - daysBack);
        // End is today (not next Sunday)
        sunday = new Date(local);
    } else {
        // Previous week
        const daysBack = dow === 0 ? 6 : dow - 1 + 7;
        monday = new Date(local);
        monday.setUTCDate(local.getUTCDate() - daysBack);
        sunday = new Date(monday);
        sunday.setUTCDate(monday.getUTCDate() + 6);
    }

    // ISO week number
    const jan4 = new Date(Date.UTC(monday.getUTCFullYear(), 0, 4));
    const weekNum = Math.ceil(
        ((monday.getTime() - jan4.getTime()) / 86400000 +
            jan4.getUTCDay() +
            1) /
            7
    );

    return {
        start: new Date(`${formatDate(monday)}T00:00:00.000Z`),
        end: new Date(`${formatDate(sunday)}T23:59:59.999Z`),
        label: current
            ? `Week ${weekNum}, ${monday.getUTCFullYear()} (Current)`
            : `Week ${weekNum}, ${monday.getUTCFullYear()}`,
        type: "WEEKLY",
    };
}

/**
 * Get the previous month's 1st-last period in UTC (B1: never double-shift UTC timestamps by account.timezone)
 */
export function getMonthlyPeriod(
    now: Date,
    _timezone = "Etc/UTC",
    current = false
): ReportPeriod {
    const y = now.getUTCFullYear();
    const m = now.getUTCMonth() + 1;
    const d = now.getUTCDate();

    const monthNames = [
        "January",
        "February",
        "March",
        "April",
        "May",
        "June",
        "July",
        "August",
        "September",
        "October",
        "November",
        "December",
    ];

    if (current) {
        // Current month: 1st of this month → today
        const firstDay = new Date(Date.UTC(y, m - 1, 1));
        const today = new Date(Date.UTC(y, m - 1, d));
        return {
            start: new Date(`${formatDate(firstDay)}T00:00:00.000Z`),
            end: new Date(`${formatDate(today)}T23:59:59.999Z`),
            label: `${monthNames[m - 1]} ${y} (Current)`,
            type: "MONTHLY",
        };
    }

    // Previous month
    const prevMonth = m === 1 ? 12 : m - 1;
    const prevYear = m === 1 ? y - 1 : y;

    const firstDay = new Date(Date.UTC(prevYear, prevMonth - 1, 1));
    const lastDay = new Date(Date.UTC(prevYear, prevMonth, 0));

    return {
        start: new Date(`${formatDate(firstDay)}T00:00:00.000Z`),
        end: new Date(`${formatDate(lastDay)}T23:59:59.999Z`),
        label: `${monthNames[prevMonth - 1]} ${prevYear}`,
        type: "MONTHLY",
    };
}

function formatDate(d: Date): string {
    return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}-${String(d.getUTCDate()).padStart(2, "0")}`;
}

function buildAccountFilterSql(accountId: string | undefined): Prisma.Sql {
    return accountId
        ? Prisma.sql`AND je."accountId" = ${accountId}`
        : Prisma.empty;
}

function buildPnlScaleSql(accountId: string | undefined): Prisma.Sql {
    if (accountId) {
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

interface CoreStatsRow {
    totalTrades: number | bigint | null;
    winCount: number | bigint | null;
    lossCount: number | bigint | null;
    positiveTrades: number | bigint | null;
    negativeTrades: number | bigint | null;
    netPnL: number | null;
    grossProfit: number | null;
    grossLoss: number | null;
    largestWin: number | null;
    largestLoss: number | null;
}

interface BreakdownRow {
    name: string | null;
    trades: number | bigint | null;
    pnl: number | null;
    wins: number | bigint | null;
}

interface DailyBreakdownRow {
    date: string;
    trades: number | bigint | null;
    pnl: number | null;
}

interface TradeSnippetRow {
    symbol: string;
    pnl: number | null;
    exitDate: Date | null;
}

// ─── Core Stats Query ───────────────────────────────────────────────────────

async function getCoreStats(
    userId: string,
    accountId: string | undefined,
    start: Date,
    end: Date
) {
    const accountFilter = buildAccountFilterSql(accountId);
    const scaleSql = buildPnlScaleSql(accountId);

    const result = await prisma.$queryRaw<CoreStatsRow[]>`
  WITH scoped AS (
    SELECT
      je."result",
      ((COALESCE(je."pnl", 0) + COALESCE(je."commission", 0) + COALESCE(je."swap", 0)) * ${scaleSql}) AS "scaledNetPnl"
    FROM "journal_entries" je
    LEFT JOIN "trading_accounts" ta ON ta."id" = je."accountId"
    WHERE je."userId" = ${userId}::uuid
      AND je."status" = 'CLOSED'
      AND je."exitDate" >= ${start}
      AND je."exitDate" <= ${end}
      ${accountFilter}
  )
  SELECT 
    COUNT(*) as "totalTrades",
    SUM(CASE WHEN "result" = 'WIN' THEN 1 ELSE 0 END) as "winCount",
    SUM(CASE WHEN "result" = 'LOSS' THEN 1 ELSE 0 END) as "lossCount",
    COUNT(*) FILTER (WHERE "scaledNetPnl" > 0) as "positiveTrades",
    COUNT(*) FILTER (WHERE "scaledNetPnl" < 0) as "negativeTrades",
    SUM("scaledNetPnl") as "netPnL",
    SUM(CASE WHEN "scaledNetPnl" > 0 THEN "scaledNetPnl" ELSE 0 END) as "grossProfit",
    SUM(CASE WHEN "scaledNetPnl" < 0 THEN ABS("scaledNetPnl") ELSE 0 END) as "grossLoss",
    MAX("scaledNetPnl") as "largestWin",
    MIN("scaledNetPnl") as "largestLoss"
  FROM scoped
  `;

    const row = result[0];
    const totalTrades = Number(row?.totalTrades || 0);
    const winCount = Number(row?.winCount || 0);
    const lossCount = Number(row?.lossCount || 0);
    const positiveTrades = Number(row?.positiveTrades || 0);
    const negativeTrades = Number(row?.negativeTrades || 0);
    const grossProfit = Number(row?.grossProfit || 0);
    const grossLoss = Number(row?.grossLoss || 0);

    return {
        totalTrades,
        winCount,
        lossCount,
        winRate: totalTrades > 0 ? (winCount / totalTrades) * 100 : 0,
        netPnL: Number(row?.netPnL || 0),
        grossProfit,
        grossLoss,
        profitFactor:
            grossLoss > 0
                ? grossProfit / grossLoss
                : grossProfit > 0
                  ? 99
                  : 0,
        avgWin: positiveTrades > 0 ? grossProfit / positiveTrades : 0,
        avgLoss: negativeTrades > 0 ? grossLoss / negativeTrades : 0,
        largestWin: Math.max(0, Number(row?.largestWin || 0)),
        largestLoss: Math.min(0, Number(row?.largestLoss || 0)),
    };
}

// ─── Breakdowns ─────────────────────────────────────────────────────────────

async function getSymbolBreakdown(
    userId: string,
    accountId: string | undefined,
    start: Date,
    end: Date
): Promise<BreakdownItem[]> {
    const accountFilter = buildAccountFilterSql(accountId);
    const scaleSql = buildPnlScaleSql(accountId);

    const result = await prisma.$queryRaw<BreakdownRow[]>`
  SELECT 
    je."symbol" as "name",
    COUNT(*) as "trades",
    SUM((COALESCE(je."pnl", 0) + COALESCE(je."commission", 0) + COALESCE(je."swap", 0)) * ${scaleSql}) as "pnl",
    SUM(CASE WHEN je."result" = 'WIN' THEN 1 ELSE 0 END) as "wins"
  FROM "journal_entries" je
  LEFT JOIN "trading_accounts" ta ON ta."id" = je."accountId"
  WHERE je."userId" = ${userId}::uuid
    AND je."status" = 'CLOSED'
    AND je."exitDate" >= ${start} AND je."exitDate" <= ${end}
    ${accountFilter}
  GROUP BY je."symbol"
  ORDER BY "pnl" DESC
  `;

    return result.map((r) => ({
        name: r.name || "Unknown",
        trades: Number(r.trades || 0),
        pnl: Number(r.pnl || 0),
        winRate:
            Number(r.trades) > 0
                ? (Number(r.wins) / Number(r.trades)) * 100
                : 0,
    }));
}

async function getStrategyBreakdown(
    userId: string,
    accountId: string | undefined,
    start: Date,
    end: Date
): Promise<BreakdownItem[]> {
    const accountFilter = buildAccountFilterSql(accountId);
    const scaleSql = buildPnlScaleSql(accountId);

    const result = await prisma.$queryRaw<BreakdownRow[]>`
  SELECT 
    COALESCE(je."strategy", 'No Strategy') as "name",
    COUNT(*) as "trades",
    SUM((COALESCE(je."pnl", 0) + COALESCE(je."commission", 0) + COALESCE(je."swap", 0)) * ${scaleSql}) as "pnl",
    SUM(CASE WHEN je."result" = 'WIN' THEN 1 ELSE 0 END) as "wins"
  FROM "journal_entries" je
  LEFT JOIN "trading_accounts" ta ON ta."id" = je."accountId"
  WHERE je."userId" = ${userId}::uuid
    AND je."status" = 'CLOSED'
    AND je."exitDate" >= ${start} AND je."exitDate" <= ${end}
    ${accountFilter}
  GROUP BY je."strategy"
  ORDER BY "pnl" DESC
  `;

    return result.map((r) => ({
        name: r.name || "No Strategy",
        trades: Number(r.trades || 0),
        pnl: Number(r.pnl || 0),
        winRate:
            Number(r.trades) > 0
                ? (Number(r.wins) / Number(r.trades)) * 100
                : 0,
    }));
}

async function getSessionBreakdown(
    userId: string,
    accountId: string | undefined,
    start: Date,
    end: Date
): Promise<BreakdownItem[]> {
    const accountFilter = buildAccountFilterSql(accountId);
    const scaleSql = buildPnlScaleSql(accountId);

    const result = await prisma.$queryRaw<BreakdownRow[]>`
  SELECT 
    COALESCE(je."trading_session", 'Unknown') as "name",
    COUNT(*) as "trades",
    SUM((COALESCE(je."pnl", 0) + COALESCE(je."commission", 0) + COALESCE(je."swap", 0)) * ${scaleSql}) as "pnl",
    SUM(CASE WHEN je."result" = 'WIN' THEN 1 ELSE 0 END) as "wins"
  FROM "journal_entries" je
  LEFT JOIN "trading_accounts" ta ON ta."id" = je."accountId"
  WHERE je."userId" = ${userId}::uuid
    AND je."status" = 'CLOSED'
    AND je."exitDate" >= ${start} AND je."exitDate" <= ${end}
    ${accountFilter}
  GROUP BY je."trading_session"
  ORDER BY "trades" DESC
  `;

    return result.map((r) => ({
        name: r.name || "Unknown",
        trades: Number(r.trades || 0),
        pnl: Number(r.pnl || 0),
        winRate:
            Number(r.trades) > 0
                ? (Number(r.wins) / Number(r.trades)) * 100
                : 0,
    }));
}

async function getDirectionBreakdown(
    userId: string,
    accountId: string | undefined,
    start: Date,
    end: Date
): Promise<BreakdownItem[]> {
    const accountFilter = buildAccountFilterSql(accountId);
    const scaleSql = buildPnlScaleSql(accountId);

    const result = await prisma.$queryRaw<BreakdownRow[]>`
  SELECT 
    je."type"::text as "name",
    COUNT(*) as "trades",
    SUM((COALESCE(je."pnl", 0) + COALESCE(je."commission", 0) + COALESCE(je."swap", 0)) * ${scaleSql}) as "pnl",
    SUM(CASE WHEN je."result" = 'WIN' THEN 1 ELSE 0 END) as "wins"
  FROM "journal_entries" je
  LEFT JOIN "trading_accounts" ta ON ta."id" = je."accountId"
  WHERE je."userId" = ${userId}::uuid
    AND je."status" = 'CLOSED'
    AND je."exitDate" >= ${start} AND je."exitDate" <= ${end}
    ${accountFilter}
  GROUP BY je."type"
  ORDER BY "pnl" DESC
  `;

    return result.map((r) => ({
        name: r.name || "Unknown",
        trades: Number(r.trades || 0),
        pnl: Number(r.pnl || 0),
        winRate:
            Number(r.trades) > 0
                ? (Number(r.wins) / Number(r.trades)) * 100
                : 0,
    }));
}

async function getDailyBreakdown(
    userId: string,
    accountId: string | undefined,
    start: Date,
    end: Date,
    timezone: string
): Promise<{ date: string; trades: number; pnl: number }[]> {
    const accountFilter = buildAccountFilterSql(accountId);
    const scaleSql = buildPnlScaleSql(accountId);

    const result = await prisma.$queryRaw<DailyBreakdownRow[]>`
  SELECT 
    TO_CHAR(je."exitDate" AT TIME ZONE ${timezone}, 'YYYY-MM-DD') as "date",
    COUNT(*) as "trades",
    SUM((COALESCE(je."pnl", 0) + COALESCE(je."commission", 0) + COALESCE(je."swap", 0)) * ${scaleSql}) as "pnl"
  FROM "journal_entries" je
  LEFT JOIN "trading_accounts" ta ON ta."id" = je."accountId"
  WHERE je."userId" = ${userId}::uuid
    AND je."status" = 'CLOSED'
    AND je."exitDate" >= ${start} AND je."exitDate" <= ${end}
    ${accountFilter}
  GROUP BY 1
  ORDER BY 1 ASC
  `;

    return result.map((r) => ({
        date: r.date,
        trades: Number(r.trades || 0),
        pnl: Number(r.pnl || 0),
    }));
}

// ─── Psychology Stats ───────────────────────────────────────────────────────

async function getPsychologyStats(
    userId: string,
    accountId: string | undefined,
    start: Date,
    end: Date
) {
    const trades = await prisma.journalEntry.findMany({
        where: {
            userId,
            status: "CLOSED",
            exitDate: { gte: start, lte: end },
            ...(accountId ? { accountId } : {}),
        },
        select: {
            confidenceLevel: true,
            followedPlan: true,
            emotionBefore: true,
            emotionAfter: true,
            mistakes: true,
            tradePlan: {
                select: {
                    tradeCheckSnapshot: {
                        select: {
                            passed: true,
                            snapshotData: true,
                        },
                    },
                },
            },
        },
    });

    // Average confidence
    const withConfidence = trades.filter((t) => t.confidenceLevel != null);
    const avgConfidence =
        withConfidence.length > 0
            ? withConfidence.reduce(
                  (sum, t) => sum + (t.confidenceLevel || 0),
                  0
              ) / withConfidence.length
            : null;

    // Plan compliance
    const withPlanSnapshot = trades.filter((t) => {
        const snap = t.tradePlan?.tradeCheckSnapshot;
        if (!snap) return false;
        const data = snap.snapshotData as Record<string, unknown> | null;
        return data !== null && typeof data === "object" && data.skipped !== true;
    });

    let planCompliance: number | null = null;
    if (withPlanSnapshot.length > 0) {
        planCompliance =
            (withPlanSnapshot.filter(
                (t) => t.tradePlan?.tradeCheckSnapshot?.passed === true
            ).length /
                withPlanSnapshot.length) *
            100;
    } else {
        const withLegacyPlan = trades.filter((t) => t.followedPlan != null);
        if (withLegacyPlan.length > 0) {
            planCompliance =
                (withLegacyPlan.filter((t) => t.followedPlan === true).length /
                    withLegacyPlan.length) *
                100;
        }
    }

    // Top emotions
    const emotionMap = new Map<string, number>();
    trades.forEach((t) => {
        if (t.emotionBefore)
            emotionMap.set(
                t.emotionBefore,
                (emotionMap.get(t.emotionBefore) || 0) + 1
            );
        if (t.emotionAfter)
            emotionMap.set(
                t.emotionAfter,
                (emotionMap.get(t.emotionAfter) || 0) + 1
            );
    });
    const topEmotions = Array.from(emotionMap.entries())
        .map(([emotion, count]) => ({ emotion, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Top mistakes
    const mistakeMap = new Map<string, number>();
    trades.forEach((t) => {
        if (t.mistakes && Array.isArray(t.mistakes)) {
            (t.mistakes as string[]).forEach((code) => {
                mistakeMap.set(code, (mistakeMap.get(code) || 0) + 1);
            });
        }
    });
    const topMistakes = Array.from(mistakeMap.entries())
        .map(([code, count]) => {
            const mistake = getMistakeByCode(code);
            return { mistakeId: code, name: mistake?.name || code, count };
        })
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    return { avgConfidence, planCompliance, topEmotions, topMistakes };
}

// ─── Best/Worst Trades ──────────────────────────────────────────────────────

async function getBestWorstTrades(
    userId: string,
    accountId: string | undefined,
    start: Date,
    end: Date
): Promise<{ best: TradeSnippet[]; worst: TradeSnippet[] }> {
    const accountFilter = buildAccountFilterSql(accountId);
    const scaleSql = buildPnlScaleSql(accountId);

    const [bestResult, worstResult] = await Promise.all([
        prisma.$queryRaw<TradeSnippetRow[]>`
  SELECT
    je."symbol",
    ((COALESCE(je."pnl", 0) + COALESCE(je."commission", 0) + COALESCE(je."swap", 0)) * ${scaleSql}) as "pnl",
    je."exitDate"
  FROM "journal_entries" je
  LEFT JOIN "trading_accounts" ta ON ta."id" = je."accountId"
  WHERE je."userId" = ${userId}::uuid AND je."status" = 'CLOSED'
    AND je."exitDate" >= ${start} AND je."exitDate" <= ${end}
    ${accountFilter}
  ORDER BY ((COALESCE(je."pnl", 0) + COALESCE(je."commission", 0) + COALESCE(je."swap", 0)) * ${scaleSql}) DESC
  LIMIT 3
  `,
        prisma.$queryRaw<TradeSnippetRow[]>`
  SELECT
    je."symbol",
    ((COALESCE(je."pnl", 0) + COALESCE(je."commission", 0) + COALESCE(je."swap", 0)) * ${scaleSql}) as "pnl",
    je."exitDate"
  FROM "journal_entries" je
  LEFT JOIN "trading_accounts" ta ON ta."id" = je."accountId"
  WHERE je."userId" = ${userId}::uuid AND je."status" = 'CLOSED'
    AND je."exitDate" >= ${start} AND je."exitDate" <= ${end}
    ${accountFilter}
  ORDER BY ((COALESCE(je."pnl", 0) + COALESCE(je."commission", 0) + COALESCE(je."swap", 0)) * ${scaleSql}) ASC
  LIMIT 3
  `,
    ]);

    const map = (r: TradeSnippetRow): TradeSnippet => ({
        symbol: r.symbol,
        pnl: Number(r.pnl || 0),
        date: r.exitDate ? r.exitDate.toISOString() : "",
    });

    return {
        best: bestResult.filter((r) => Number(r.pnl) > 0).map(map),
        worst: worstResult.filter((r) => Number(r.pnl) < 0).map(map),
    };
}

// ─── Previous Period Stats ──────────────────────────────────────────────────

export function getPreviousPeriod(period: ReportPeriod): { start: Date; end: Date } {
    if (period.type === "WEEKLY") {
        const start = new Date(period.start);
        start.setUTCDate(start.getUTCDate() - 7);
        const end = new Date(period.end);
        end.setUTCDate(end.getUTCDate() - 7);
        return { start, end };
    } else {
        // Previous month in UTC
        const start = new Date(period.start);
        start.setUTCMonth(start.getUTCMonth() - 1);
        const end = new Date(
            Date.UTC(
                start.getUTCFullYear(),
                start.getUTCMonth() + 1,
                0,
                23,
                59,
                59,
                999
            )
        );
        return { start, end };
    }
}

// ─── Main Generator ─────────────────────────────────────────────────────────

export async function generateReport(
    userId: string,
    accountId: string | undefined,
    period: ReportPeriod
) {
    const resolvedAccountId =
        accountId && accountId !== "all" ? accountId : undefined;

    // Check for existing report
    const existing = await prisma.tradingReport.findUnique({
        where: {
            userId_type_periodStart: {
                userId,
                type: period.type,
                periodStart: period.start,
            },
        },
    });

    const isInProgressPeriod = period.end >= new Date();

    if (existing && !isInProgressPeriod) {
        return {
            skipped: true,
            reason: "Report already exists",
            reportId: existing.id,
        };
    }

    // Core stats for this period
    const stats = await getCoreStats(
        userId,
        resolvedAccountId,
        period.start,
        period.end
    );

    // No trades → skip but return empty indicator
    if (stats.totalTrades === 0) {
        return { skipped: true, reason: "No trades in period", empty: true };
    }

    // Parallel fetch all breakdowns + psychology
    const [bySymbol, byStrategy, bySession, byDay, byDirection, psychology, bestWorst] =
        await Promise.all([
            getSymbolBreakdown(userId, resolvedAccountId, period.start, period.end),
            getStrategyBreakdown(userId, resolvedAccountId, period.start, period.end),
            getSessionBreakdown(userId, resolvedAccountId, period.start, period.end),
            getDailyBreakdown(
                userId,
                resolvedAccountId,
                period.start,
                period.end,
                "Etc/UTC"
            ),
            getDirectionBreakdown(userId, resolvedAccountId, period.start, period.end),
            getPsychologyStats(userId, resolvedAccountId, period.start, period.end),
            getBestWorstTrades(userId, resolvedAccountId, period.start, period.end),
        ]);

    // Previous period comparison
    const prevPeriod = getPreviousPeriod(period);
    const prevStats = await getCoreStats(
        userId,
        resolvedAccountId,
        prevPeriod.start,
        prevPeriod.end
    );

    const reportData = {
        periodEnd: period.end,
        periodLabel: period.label,
        // Core stats
        totalTrades: stats.totalTrades,
        winCount: stats.winCount,
        lossCount: stats.lossCount,
        winRate: stats.winRate,
        netPnL: stats.netPnL,
        grossProfit: stats.grossProfit,
        grossLoss: stats.grossLoss,
        profitFactor: stats.profitFactor,
        avgWin: stats.avgWin,
        avgLoss: stats.avgLoss,
        largestWin: stats.largestWin,
        largestLoss: stats.largestLoss,
        // Previous period
        prevPnL: prevStats.totalTrades > 0 ? prevStats.netPnL : null,
        prevWinRate: prevStats.totalTrades > 0 ? prevStats.winRate : null,
        prevTrades:
            prevStats.totalTrades > 0 ? prevStats.totalTrades : null,
        // Breakdowns
        bySymbol: bySymbol as unknown as Prisma.InputJsonValue,
        byStrategy: byStrategy as unknown as Prisma.InputJsonValue,
        bySession: bySession as unknown as Prisma.InputJsonValue,
        byDay: byDay as unknown as Prisma.InputJsonValue,
        byDirection: byDirection as unknown as Prisma.InputJsonValue,
        // Psychology
        avgConfidence: psychology.avgConfidence,
        planCompliance: psychology.planCompliance,
        topEmotions: psychology.topEmotions as unknown as Prisma.InputJsonValue,
        topMistakes: psychology.topMistakes as unknown as Prisma.InputJsonValue,
        // Best/Worst
        bestTrades: bestWorst.best as unknown as Prisma.InputJsonValue,
        worstTrades: bestWorst.worst as unknown as Prisma.InputJsonValue,
    };

    if (existing) {
        const updated = await prisma.tradingReport.update({
            where: { id: existing.id },
            data: reportData,
        });
        return { skipped: false, reportId: updated.id, stats };
    }

    // Save report
    const report = await prisma.tradingReport.create({
        data: {
            userId,
            type: period.type,
            periodStart: period.start,
            ...reportData,
        },
    });

    return { skipped: false, reportId: report.id, stats };
}

// ─── Batch Generator (for Cron) ─────────────────────────────────────────────

export interface GenerateReportResult {
    skipped?: boolean;
    reason?: string;
    empty?: boolean;
    reportId?: string;
    stats?: Awaited<ReturnType<typeof getCoreStats>>;
    error?: string;
}

export async function generateReportsForAllUsers(
    type: "WEEKLY" | "MONTHLY",
    current = false
) {
    // Fetch all users with trading accounts
    const users = await prisma.user.findMany({
        where: {
            tradingAccounts: { some: {} },
        },
        select: {
            id: true,
        },
    });

    const results: {
        userId: string;
        accountId: string;
        result: GenerateReportResult;
    }[] = [];

    for (const user of users) {
        // B1: All trade timestamps in DB are stored in UTC; do not shift report grouping by account.timezone
        const tz = "Etc/UTC";
        const now = new Date();
        const period =
            type === "WEEKLY"
                ? getWeeklyPeriod(now, tz, current)
                : getMonthlyPeriod(now, tz, current);

        try {
            const result = await generateReport(user.id, undefined, period);
            results.push({
                userId: user.id,
                accountId: "all",
                result,
            });
        } catch (error) {
            console.error(
                `Report generation failed for user ${user.id}:`,
                error
            );
            results.push({
                userId: user.id,
                accountId: "all",
                result: { error: String(error) },
            });
        }
    }

    return results;
}

// ─── User-level Wrappers ────────────────────────────────────────────────────

/**
 * Generate a weekly report for a single user.
 * @param current - if true, generates for the current (in-progress) week
 */
export async function generateWeeklyReportForUser(
    userId: string,
    accountId?: string,
    timezone = "Etc/UTC",
    current = false
) {
    const now = new Date();
    const period = getWeeklyPeriod(now, timezone, current);
    return generateReport(userId, accountId, period);
}

/**
 * Generate a monthly report for a single user.
 * @param current - if true, generates for the current (in-progress) month
 */
export async function generateMonthlyReportForUser(
    userId: string,
    accountId?: string,
    timezone = "Etc/UTC",
    current = false
) {
    const now = new Date();
    const period = getMonthlyPeriod(now, timezone, current);
    return generateReport(userId, accountId, period);
}
