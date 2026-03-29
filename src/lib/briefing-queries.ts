import { prisma } from "@/lib/prisma";
import { getCurrentStreak, getKeyStats } from "@/lib/analytics-queries";
import { startOfWeek, format, subDays } from "date-fns";

// ============================================================================
// TYPES
// ============================================================================

export interface BriefingData {
    userName: string;
    currentStreak: { type: "win" | "loss" | "none"; count: number };

    lastTradingSession: {
        date: string;
        trades: number;
        wins: number;
        losses: number;
        pnl: number;
        bestPair: string | null;
    } | null;

    // Yesterday vs all-time average (unique to Briefing)
    yesterdayVsAvg: {
        yesterdayWR: number;
        avgWR: number;
        yesterdayTrades: number;
        avgDailyTrades: number;
        yesterdayPnl: number;
        hasData: boolean;
    };

    // Last 7 trading days: win/loss results for sparkline
    weeklyResults: Array<{
        date: string;        // "Mon", "Tue"...
        wins: number;
        losses: number;
        pnl: number;
    }>;

    todayEvents: Array<{
        time: string;
        currency: string;
        event: string;
        impact: "HIGH" | "MEDIUM" | "LOW";
    }>;

    insight: {
        icon: string;
        title: string;
        description: string;
    } | null;

    dailyFocus: string | null;

    tradeScore: number | null;

    quote: { text: string; author: string } | null;

    // Keep weekStats internally for insight generation but don't expose as UI block
    weekStats: {
        trades: number;
        winRate: number;
        profitFactor: number;
        bestPair: string | null;
    };
}

// ============================================================================
// QUERIES
// ============================================================================

async function getLastTradingSession(userId: string, accountId?: string) {
    const result = await prisma.$queryRaw`
        WITH last_day AS (
            SELECT DISTINCT DATE("exitDate") as "tradeDate"
            FROM "JournalEntry"
            WHERE "userId" = ${userId}::uuid
            AND "status" = 'CLOSED'
            AND (${accountId ? accountId : "1"} = '1' OR "accountId" = ${accountId})
            ORDER BY 1 DESC
            LIMIT 1
        )
        SELECT
            ld."tradeDate",
            COUNT(*) as "trades",
            SUM(CASE WHEN "result" = 'WIN' THEN 1 ELSE 0 END) as "wins",
            SUM(CASE WHEN "result" = 'LOSS' THEN 1 ELSE 0 END) as "losses",
            SUM(COALESCE(j."pnl", 0) + COALESCE(j."commission", 0) + COALESCE(j."swap", 0)) as "pnl"
        FROM "JournalEntry" j
        INNER JOIN last_day ld ON DATE(j."exitDate") = ld."tradeDate"
        WHERE j."userId" = ${userId}::uuid
        AND j."status" = 'CLOSED'
        AND (${accountId ? accountId : "1"} = '1' OR j."accountId" = ${accountId})
        GROUP BY ld."tradeDate"
    `;

    const row = (result as any[])[0];
    if (!row) return null;

    const pairResult = await prisma.$queryRaw`
        SELECT "symbol", COUNT(*) as "cnt",
            SUM(CASE WHEN "result" = 'WIN' THEN 1 ELSE 0 END) as "wins"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND DATE("exitDate") = ${row.tradeDate}
        AND (${accountId ? accountId : "1"} = '1' OR "accountId" = ${accountId})
        GROUP BY "symbol"
        ORDER BY "wins" DESC
        LIMIT 1
    `;

    const bestPairRow = (pairResult as any[])[0];

    return {
        date: format(new Date(row.tradeDate), "EEE, MMM d"),
        trades: Number(row.trades),
        wins: Number(row.wins),
        losses: Number(row.losses),
        pnl: Number(row.pnl || 0),
        bestPair: bestPairRow?.symbol || null,
    };
}

async function getWeekStats(userId: string, accountId?: string) {
    const weekStart = startOfWeek(new Date(), { weekStartsOn: 1 });

    const result = await prisma.$queryRaw`
        SELECT
            COUNT(*) as "trades",
            SUM(CASE WHEN "result" = 'WIN' THEN 1 ELSE 0 END) as "wins",
            SUM(CASE WHEN (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) > 0
                THEN (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) ELSE 0 END) as "grossProfit",
            SUM(CASE WHEN (COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) < 0
                THEN ABS(COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) ELSE 0 END) as "grossLoss"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND "exitDate" >= ${weekStart}
        AND (${accountId ? accountId : "1"} = '1' OR "accountId" = ${accountId})
    `;

    const row = (result as any[])[0] || {};
    const trades = Number(row.trades || 0);
    const wins = Number(row.wins || 0);
    const grossProfit = Number(row.grossProfit || 0);
    const grossLoss = Number(row.grossLoss || 0);

    let bestPair: string | null = null;
    if (trades > 0) {
        const pairResult = await prisma.$queryRaw`
            SELECT "symbol", COUNT(*) as "cnt",
                SUM(CASE WHEN "result" = 'WIN' THEN 1 ELSE 0 END) as "wins"
            FROM "JournalEntry"
            WHERE "userId" = ${userId}::uuid
            AND "status" = 'CLOSED'
            AND "exitDate" >= ${weekStart}
            AND (${accountId ? accountId : "1"} = '1' OR "accountId" = ${accountId})
            GROUP BY "symbol"
            ORDER BY "wins" DESC
            LIMIT 1
        `;
        bestPair = (pairResult as any[])[0]?.symbol || null;
    }

    return {
        trades,
        winRate: trades > 0 ? (wins / trades) * 100 : 0,
        profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0,
        bestPair,
    };
}

// NEW: Yesterday performance vs all-time average
async function getYesterdayVsAvg(userId: string, accountId?: string): Promise<BriefingData["yesterdayVsAvg"]> {
    const yesterday = subDays(new Date(), 1);
    const yesterdayStart = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());
    const yesterdayEnd = new Date(yesterdayStart);
    yesterdayEnd.setDate(yesterdayEnd.getDate() + 1);

    // Yesterday's stats
    const yesterdayResult = await prisma.$queryRaw`
        SELECT
            COUNT(*) as "trades",
            SUM(CASE WHEN "result" = 'WIN' THEN 1 ELSE 0 END) as "wins",
            SUM(COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "pnl"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND "exitDate" >= ${yesterdayStart}
        AND "exitDate" < ${yesterdayEnd}
        AND (${accountId ? accountId : "1"} = '1' OR "accountId" = ${accountId})
    `;

    const yRow = (yesterdayResult as any[])[0] || {};
    const yTrades = Number(yRow.trades || 0);
    const yWins = Number(yRow.wins || 0);
    const yPnl = Number(yRow.pnl || 0);

    // All-time average per trading day
    const avgResult = await prisma.$queryRaw`
        SELECT
            COUNT(DISTINCT DATE("exitDate")) as "tradingDays",
            COUNT(*) as "totalTrades",
            SUM(CASE WHEN "result" = 'WIN' THEN 1 ELSE 0 END) as "totalWins"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND (${accountId ? accountId : "1"} = '1' OR "accountId" = ${accountId})
    `;

    const aRow = (avgResult as any[])[0] || {};
    const tradingDays = Number(aRow.tradingDays || 1);
    const totalTrades = Number(aRow.totalTrades || 0);
    const totalWins = Number(aRow.totalWins || 0);

    return {
        yesterdayWR: yTrades > 0 ? (yWins / yTrades) * 100 : 0,
        avgWR: totalTrades > 0 ? (totalWins / totalTrades) * 100 : 0,
        yesterdayTrades: yTrades,
        avgDailyTrades: tradingDays > 0 ? Math.round(totalTrades / tradingDays) : 0,
        yesterdayPnl: yPnl,
        hasData: yTrades > 0,
    };
}

// NEW: Last 7 trading days for sparkline
async function getWeeklyResults(userId: string, accountId?: string): Promise<BriefingData["weeklyResults"]> {
    const sevenDaysAgo = subDays(new Date(), 7);

    const result = await prisma.$queryRaw`
        SELECT
            DATE("exitDate") as "tradeDate",
            SUM(CASE WHEN "result" = 'WIN' THEN 1 ELSE 0 END) as "wins",
            SUM(CASE WHEN "result" = 'LOSS' THEN 1 ELSE 0 END) as "losses",
            SUM(COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "pnl"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND "exitDate" >= ${sevenDaysAgo}
        AND (${accountId ? accountId : "1"} = '1' OR "accountId" = ${accountId})
        GROUP BY DATE("exitDate")
        ORDER BY DATE("exitDate") ASC
    `;

    return (result as any[]).map((row) => ({
        date: format(new Date(row.tradeDate), "EEE"),
        wins: Number(row.wins || 0),
        losses: Number(row.losses || 0),
        pnl: Number(row.pnl || 0),
    }));
}

async function getTodayEvents() {
    const today = new Date();
    const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const events = await prisma.economicEvent.findMany({
        where: {
            date: { gte: todayStart, lt: todayEnd },
            impact: { in: ["HIGH", "MEDIUM"] },
        },
        orderBy: { date: "asc" },
        take: 8,
    });

    return events.map((e) => ({
        time: format(e.date, "HH:mm"),
        currency: e.currency,
        event: e.title,
        impact: e.impact as "HIGH" | "MEDIUM" | "LOW",
    }));
}

async function getRandomQuote(): Promise<{ text: string; author: string } | null> {
    try {
        const count = await prisma.quote.count({ where: { isActive: true } });
        if (count === 0) return null;
        const skip = Math.floor(Math.random() * count);
        const quote = await prisma.quote.findFirst({
            where: { isActive: true },
            skip,
        });
        return quote ? { text: quote.text, author: quote.author } : null;
    } catch {
        return null;
    }
}

// ============================================================================
// INSIGHT RULES
// ============================================================================

interface InsightInput {
    weekStats: BriefingData["weekStats"];
    streak: BriefingData["currentStreak"];
    lastSession: BriefingData["lastTradingSession"];
}

function generateInsight(data: InsightInput): BriefingData["insight"] {
    if (data.streak.type === "loss" && data.streak.count >= 3) {
        return {
            icon: "AlertTriangle",
            title: "Losing Streak Alert",
            description: `You're on a ${data.streak.count}-trade losing streak. Consider taking a break, reviewing your journal, and resetting your mindset before the next trade.`,
        };
    }

    if (data.streak.type === "win" && data.streak.count >= 5) {
        return {
            icon: "Flame",
            title: "You're on Fire!",
            description: `${data.streak.count}-win streak! Great discipline. Stay focused and don't get overconfident — stick to your plan.`,
        };
    }

    if (data.weekStats.trades >= 5 && data.weekStats.winRate >= 65) {
        return {
            icon: "TrendingUp",
            title: "Strong Week So Far",
            description: `${Math.round(data.weekStats.winRate)}% win rate this week across ${data.weekStats.trades} trades. Keep the consistency going!`,
        };
    }

    if (data.weekStats.trades >= 5 && data.weekStats.winRate < 45) {
        return {
            icon: "Target",
            title: "Review Your Approach",
            description: `Your win rate this week is ${Math.round(data.weekStats.winRate)}%. Consider reviewing your recent entries and checking if you're following your trading plan.`,
        };
    }

    if (data.lastSession && data.lastSession.losses > data.lastSession.wins) {
        return {
            icon: "RefreshCw",
            title: "Reset and Refocus",
            description: `Your last session had more losses than wins. Take a moment to review those trades objectively before trading today.`,
        };
    }

    return {
        icon: "Sparkles",
        title: "Stay Disciplined",
        description: `Consistency beats excitement. Follow your plan, manage your risk, and let the edge play out over time.`,
    };
}

function generateDailyFocus(data: InsightInput): string | null {
    if (data.weekStats.trades > 0 && data.weekStats.winRate < 50) {
        return "Focus on quality over quantity today. Only take A+ setups.";
    }
    if (data.streak.type === "loss" && data.streak.count >= 2) {
        return "Use a checklist before every trade today. Confirm setup + risk before entry.";
    }
    if (data.weekStats.trades === 0) {
        return "Review your watchlist and prepare your trading plan for the day.";
    }
    return "Stick to your plan. Document every trade in your journal.";
}

// ============================================================================
// MAIN AGGREGATOR
// ============================================================================

export async function getDailyBriefingData(
    userId: string,
    accountId?: string
): Promise<BriefingData> {
    const userName = await prisma.user.findUnique({
        where: { id: userId },
        select: { name: true },
    });

    const [streak, lastSession, weekStats, todayEvents, quote, yesterdayVsAvg, weeklyResults] = await Promise.all([
        getCurrentStreak(userId, accountId),
        getLastTradingSession(userId, accountId),
        getWeekStats(userId, accountId),
        getTodayEvents(),
        getRandomQuote(),
        getYesterdayVsAvg(userId, accountId),
        getWeeklyResults(userId, accountId),
    ]);

    const insightInput: InsightInput = { weekStats, streak, lastSession: lastSession };

    // Get trade score if enough trades
    let tradeScore: number | null = null;
    try {
        const stats = await getKeyStats(userId, accountId);
        if (stats.totalTrades >= 30) {
            const { getIntelligenceData } = await import("@/lib/smart-analytics");
            const intelligence = await getIntelligenceData(userId, accountId);
            tradeScore = intelligence.tradeScore.score;
        }
    } catch {
        // Ignore
    }

    return {
        userName: userName?.name || "Trader",
        currentStreak: streak,
        lastTradingSession: lastSession,
        yesterdayVsAvg,
        weeklyResults,
        weekStats,
        todayEvents,
        insight: generateInsight(insightInput),
        dailyFocus: generateDailyFocus(insightInput),
        tradeScore,
        quote,
    };
}
