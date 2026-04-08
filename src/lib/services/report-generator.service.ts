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
 * Get the previous week's Monday-Sunday period in account timezone
 */
export function getWeeklyPeriod(now: Date, timezone: string, current = false): ReportPeriod {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    const localDate = formatter.format(now);
    const [y, m, d] = localDate.split("-").map(Number);
    const local = new Date(y, m - 1, d);

    // DOW: 0=Sun, 1=Mon, ..., 6=Sat
    const dow = local.getDay();

    let monday: Date;
    let sunday: Date;

    if (current) {
        // Current week: go back to this Monday
        const daysBack = dow === 0 ? 6 : dow - 1;
        monday = new Date(local);
        monday.setDate(local.getDate() - daysBack);
        // End is today (not next Sunday)
        sunday = new Date(local);
    } else {
        // Previous week
        const daysBack = dow === 0 ? 6 : dow - 1 + 7;
        monday = new Date(local);
        monday.setDate(local.getDate() - daysBack);
        sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
    }

    // ISO week number
    const jan4 = new Date(monday.getFullYear(), 0, 4);
    const weekNum = Math.ceil(((monday.getTime() - jan4.getTime()) / 86400000 + jan4.getDay() + 1) / 7);

    return {
        start: new Date(`${formatDate(monday)}T00:00:00`),
        end: new Date(`${formatDate(sunday)}T23:59:59.999`),
        label: current ? `Week ${weekNum}, ${monday.getFullYear()} (Current)` : `Week ${weekNum}, ${monday.getFullYear()}`,
        type: "WEEKLY",
    };
}

/**
 * Get the previous month's 1st-last period in account timezone
 */
export function getMonthlyPeriod(now: Date, timezone: string, current = false): ReportPeriod {
    const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    });
    const localDate = formatter.format(now);
    const [y, m, d] = localDate.split("-").map(Number);

    const monthNames = ["January", "February", "March", "April", "May", "June",
        "July", "August", "September", "October", "November", "December"];

    if (current) {
        // Current month: 1st of this month → today
        const firstDay = new Date(y, m - 1, 1);
        const today = new Date(y, m - 1, d);
        return {
            start: new Date(`${formatDate(firstDay)}T00:00:00`),
            end: new Date(`${formatDate(today)}T23:59:59.999`),
            label: `${monthNames[m - 1]} ${y} (Current)`,
            type: "MONTHLY",
        };
    }

    // Previous month
    const prevMonth = m === 1 ? 12 : m - 1;
    const prevYear = m === 1 ? y - 1 : y;

    const firstDay = new Date(prevYear, prevMonth - 1, 1);
    const lastDay = new Date(prevYear, prevMonth, 0);

    return {
        start: new Date(`${formatDate(firstDay)}T00:00:00`),
        end: new Date(`${formatDate(lastDay)}T23:59:59.999`),
        label: `${monthNames[prevMonth - 1]} ${prevYear}`,
        type: "MONTHLY",
    };
}

function formatDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

// ─── Core Stats Query ───────────────────────────────────────────────────────

async function getCoreStats(userId: string, accountId: string | undefined, start: Date, end: Date) {
    const accountFilter = accountId
        ? Prisma.sql`AND "accountId" = ${accountId}`
        : Prisma.empty;

    const result = await prisma.$queryRaw`
        SELECT 
            COUNT(*) as "totalTrades",
            SUM(CASE WHEN "result" = 'WIN' THEN 1 ELSE 0 END) as "winCount",
            SUM(CASE WHEN "result" = 'LOSS' THEN 1 ELSE 0 END) as "lossCount",
            SUM(COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "netPnL",
            SUM(CASE WHEN (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) > 0 
                THEN (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) ELSE 0 END) as "grossProfit",
            SUM(CASE WHEN (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) < 0 
                THEN ABS(COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) ELSE 0 END) as "grossLoss",
            MAX(COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "largestWin",
            MIN(COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "largestLoss"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND "exitDate" >= ${start}
        AND "exitDate" <= ${end}
        ${accountFilter}
    `;

    const row = (result as any[])[0] || {};
    const totalTrades = Number(row.totalTrades || 0);
    const winCount = Number(row.winCount || 0);
    const lossCount = Number(row.lossCount || 0);
    const grossProfit = Number(row.grossProfit || 0);
    const grossLoss = Number(row.grossLoss || 0);

    return {
        totalTrades,
        winCount,
        lossCount,
        winRate: totalTrades > 0 ? (winCount / totalTrades) * 100 : 0,
        netPnL: Number(row.netPnL || 0),
        grossProfit,
        grossLoss,
        profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0,
        avgWin: winCount > 0 ? grossProfit / winCount : 0,
        avgLoss: lossCount > 0 ? grossLoss / lossCount : 0,
        largestWin: Math.max(0, Number(row.largestWin || 0)),
        largestLoss: Math.min(0, Number(row.largestLoss || 0)),
    };
}

// ─── Breakdowns ─────────────────────────────────────────────────────────────

async function getSymbolBreakdown(userId: string, accountId: string | undefined, start: Date, end: Date): Promise<BreakdownItem[]> {
    const accountFilter = accountId
        ? Prisma.sql`AND "accountId" = ${accountId}`
        : Prisma.empty;

    const result = await prisma.$queryRaw`
        SELECT 
            "symbol" as "name",
            COUNT(*) as "trades",
            SUM(COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "pnl",
            SUM(CASE WHEN "result" = 'WIN' THEN 1 ELSE 0 END) as "wins"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND "exitDate" >= ${start} AND "exitDate" <= ${end}
        ${accountFilter}
        GROUP BY "symbol"
        ORDER BY "pnl" DESC
    `;

    return (result as any[]).map(r => ({
        name: r.name,
        trades: Number(r.trades),
        pnl: Number(r.pnl || 0),
        winRate: Number(r.trades) > 0 ? (Number(r.wins) / Number(r.trades)) * 100 : 0,
    }));
}

async function getStrategyBreakdown(userId: string, accountId: string | undefined, start: Date, end: Date): Promise<BreakdownItem[]> {
    const accountFilter = accountId
        ? Prisma.sql`AND "accountId" = ${accountId}`
        : Prisma.empty;

    const result = await prisma.$queryRaw`
        SELECT 
            COALESCE("strategy", 'No Strategy') as "name",
            COUNT(*) as "trades",
            SUM(COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "pnl",
            SUM(CASE WHEN "result" = 'WIN' THEN 1 ELSE 0 END) as "wins"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND "exitDate" >= ${start} AND "exitDate" <= ${end}
        ${accountFilter}
        GROUP BY "strategy"
        ORDER BY "pnl" DESC
    `;

    return (result as any[]).map(r => ({
        name: r.name,
        trades: Number(r.trades),
        pnl: Number(r.pnl || 0),
        winRate: Number(r.trades) > 0 ? (Number(r.wins) / Number(r.trades)) * 100 : 0,
    }));
}

async function getSessionBreakdown(userId: string, accountId: string | undefined, start: Date, end: Date): Promise<BreakdownItem[]> {
    const accountFilter = accountId
        ? Prisma.sql`AND "accountId" = ${accountId}`
        : Prisma.empty;

    const result = await prisma.$queryRaw`
        SELECT 
            COALESCE("trading_session", 'Unknown') as "name",
            COUNT(*) as "trades",
            SUM(COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "pnl",
            SUM(CASE WHEN "result" = 'WIN' THEN 1 ELSE 0 END) as "wins"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND "exitDate" >= ${start} AND "exitDate" <= ${end}
        ${accountFilter}
        GROUP BY "trading_session"
        ORDER BY "trades" DESC
    `;

    return (result as any[]).map(r => ({
        name: r.name,
        trades: Number(r.trades),
        pnl: Number(r.pnl || 0),
        winRate: Number(r.trades) > 0 ? (Number(r.wins) / Number(r.trades)) * 100 : 0,
    }));
}

async function getDailyBreakdown(userId: string, accountId: string | undefined, start: Date, end: Date, timezone: string): Promise<{ date: string; trades: number; pnl: number }[]> {
    const accountFilter = accountId
        ? Prisma.sql`AND "accountId" = ${accountId}`
        : Prisma.empty;

    const result = await prisma.$queryRaw`
        SELECT 
            TO_CHAR("exitDate" AT TIME ZONE ${timezone}, 'YYYY-MM-DD') as "date",
            COUNT(*) as "trades",
            SUM(COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "pnl"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND "exitDate" >= ${start} AND "exitDate" <= ${end}
        ${accountFilter}
        GROUP BY 1
        ORDER BY 1 ASC
    `;

    return (result as any[]).map(r => ({
        date: r.date,
        trades: Number(r.trades),
        pnl: Number(r.pnl || 0),
    }));
}

// ─── Psychology Stats ───────────────────────────────────────────────────────

async function getPsychologyStats(userId: string, accountId: string | undefined, start: Date, end: Date) {
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
        },
    });

    // Average confidence
    const withConfidence = trades.filter(t => t.confidenceLevel != null);
    const avgConfidence = withConfidence.length > 0
        ? withConfidence.reduce((sum, t) => sum + (t.confidenceLevel || 0), 0) / withConfidence.length
        : null;

    // Plan compliance
    const withPlan = trades.filter(t => t.followedPlan != null);
    const planCompliance = withPlan.length > 0
        ? (withPlan.filter(t => t.followedPlan === true).length / withPlan.length) * 100
        : null;

    // Top emotions
    const emotionMap = new Map<string, number>();
    trades.forEach(t => {
        if (t.emotionBefore) emotionMap.set(t.emotionBefore, (emotionMap.get(t.emotionBefore) || 0) + 1);
        if (t.emotionAfter) emotionMap.set(t.emotionAfter, (emotionMap.get(t.emotionAfter) || 0) + 1);
    });
    const topEmotions = Array.from(emotionMap.entries())
        .map(([emotion, count]) => ({ emotion, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

    // Top mistakes
    const mistakeMap = new Map<string, number>();
    trades.forEach(t => {
        if (t.mistakes && Array.isArray(t.mistakes)) {
            (t.mistakes as string[]).forEach(code => {
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

async function getBestWorstTrades(userId: string, accountId: string | undefined, start: Date, end: Date): Promise<{ best: TradeSnippet[]; worst: TradeSnippet[] }> {
    const accountFilter = accountId
        ? Prisma.sql`AND "accountId" = ${accountId}`
        : Prisma.empty;

    const [bestResult, worstResult] = await Promise.all([
        prisma.$queryRaw`
            SELECT "symbol", (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "pnl", "exitDate"
            FROM "JournalEntry"
            WHERE "userId" = ${userId}::uuid AND "status" = 'CLOSED'
            AND "exitDate" >= ${start} AND "exitDate" <= ${end}
            ${accountFilter}
            ORDER BY (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) DESC
            LIMIT 3
        `,
        prisma.$queryRaw`
            SELECT "symbol", (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "pnl", "exitDate"
            FROM "JournalEntry"
            WHERE "userId" = ${userId}::uuid AND "status" = 'CLOSED'
            AND "exitDate" >= ${start} AND "exitDate" <= ${end}
            ${accountFilter}
            ORDER BY (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) ASC
            LIMIT 3
        `,
    ]);

    const map = (r: any): TradeSnippet => ({
        symbol: r.symbol,
        pnl: Number(r.pnl),
        date: r.exitDate?.toISOString?.() || "",
    });

    return {
        best: (bestResult as any[]).filter(r => Number(r.pnl) > 0).map(map),
        worst: (worstResult as any[]).filter(r => Number(r.pnl) < 0).map(map),
    };
}

// ─── Previous Period Stats ──────────────────────────────────────────────────

function getPreviousPeriod(period: ReportPeriod): { start: Date; end: Date } {
    if (period.type === "WEEKLY") {
        const start = new Date(period.start);
        start.setDate(start.getDate() - 7);
        const end = new Date(period.end);
        end.setDate(end.getDate() - 7);
        return { start, end };
    } else {
        // Previous month
        const start = new Date(period.start);
        start.setMonth(start.getMonth() - 1);
        const end = new Date(start.getFullYear(), start.getMonth() + 1, 0, 23, 59, 59, 999);
        return { start, end };
    }
}

// ─── Main Generator ─────────────────────────────────────────────────────────

export async function generateReport(
    userId: string,
    accountId: string | undefined,
    period: ReportPeriod
) {
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

    if (existing) {
        return { skipped: true, reason: "Report already exists", reportId: existing.id };
    }

    // Core stats for this period
    const stats = await getCoreStats(userId, accountId, period.start, period.end);

    // No trades → skip but return empty indicator
    if (stats.totalTrades === 0) {
        return { skipped: true, reason: "No trades in period", empty: true };
    }

    // Parallel fetch all breakdowns + psychology
    const [bySymbol, byStrategy, bySession, byDay, psychology, bestWorst] = await Promise.all([
        getSymbolBreakdown(userId, accountId, period.start, period.end),
        getStrategyBreakdown(userId, accountId, period.start, period.end),
        getSessionBreakdown(userId, accountId, period.start, period.end),
        getDailyBreakdown(userId, accountId, period.start, period.end, "Etc/UTC"),
        getPsychologyStats(userId, accountId, period.start, period.end),
        getBestWorstTrades(userId, accountId, period.start, period.end),
    ]);

    // Previous period comparison
    const prevPeriod = getPreviousPeriod(period);
    const prevStats = await getCoreStats(userId, accountId, prevPeriod.start, prevPeriod.end);

    // Save report
    const report = await prisma.tradingReport.create({
        data: {
            userId,
            type: period.type,
            periodStart: period.start,
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
            prevTrades: prevStats.totalTrades > 0 ? prevStats.totalTrades : null,
            // Breakdowns
            bySymbol: bySymbol as any,
            byStrategy: byStrategy as any,
            bySession: bySession as any,
            byDay: byDay as any,
            // Psychology
            avgConfidence: psychology.avgConfidence,
            planCompliance: psychology.planCompliance,
            topEmotions: psychology.topEmotions as any,
            topMistakes: psychology.topMistakes as any,
            // Best/Worst
            bestTrades: bestWorst.best as any,
            worstTrades: bestWorst.worst as any,
        },
    });

    return { skipped: false, reportId: report.id, stats };
}

// ─── Batch Generator (for Cron) ─────────────────────────────────────────────

export async function generateReportsForAllUsers(type: "WEEKLY" | "MONTHLY", current = false) {
    // Fetch all users with trading accounts
    const users = await prisma.user.findMany({
        where: {
            tradingAccounts: { some: {} },
        },
        select: {
            id: true,
            tradingAccounts: {
                select: {
                    id: true,
                    timezone: true,
                },
            },
        },
    });

    const results: { userId: string; accountId: string; result: any }[] = [];

    for (const user of users) {
        for (const account of user.tradingAccounts) {
            const tz = account.timezone || "Etc/UTC";
            const now = new Date();
            const period = type === "WEEKLY"
                ? getWeeklyPeriod(now, tz, current)
                : getMonthlyPeriod(now, tz, current);

            try {
                const result = await generateReport(user.id, account.id, period);
                results.push({ userId: user.id, accountId: account.id, result });
            } catch (error) {
                console.error(`Report generation failed for user ${user.id}, account ${account.id}:`, error);
                results.push({ userId: user.id, accountId: account.id, result: { error: String(error) } });
            }
        }
    }

    return results;
}
