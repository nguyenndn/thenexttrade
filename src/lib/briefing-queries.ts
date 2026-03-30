import { prisma } from "@/lib/prisma";
import { getCurrentStreak } from "@/lib/analytics-queries";
import { startOfWeek, format } from "date-fns";

// ============================================================================
// INTERNAL QUERIES (used by getDashboardInsight)
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

    return {
        date: format(new Date(row.tradeDate), "EEE, MMM d"),
        trades: Number(row.trades),
        wins: Number(row.wins),
        losses: Number(row.losses),
        pnl: Number(row.pnl || 0),
        bestPair: null,
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

    return {
        trades,
        winRate: trades > 0 ? (wins / trades) * 100 : 0,
        profitFactor: grossLoss > 0 ? grossProfit / grossLoss : grossProfit > 0 ? 999 : 0,
        bestPair: null,
    };
}

// ============================================================================
// INSIGHT RULES
// ============================================================================

interface InsightInput {
    weekStats: { trades: number; winRate: number; profitFactor: number; bestPair: string | null };
    streak: { type: "win" | "loss" | "none"; count: number };
    lastSession: {
        date: string;
        trades: number;
        wins: number;
        losses: number;
        pnl: number;
        bestPair: string | null;
    } | null;
}

function generateInsight(data: InsightInput): { icon: string; title: string; description: string } {
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

// ============================================================================
// EXPORT: Dashboard Insight (used by /dashboard page)
// ============================================================================

export async function getDashboardInsight(userId: string, accountId?: string) {
    const [weekStats, streak, lastSession] = await Promise.all([
        getWeekStats(userId, accountId),
        getCurrentStreak(userId, accountId),
        getLastTradingSession(userId, accountId),
    ]);
    return generateInsight({ weekStats, streak, lastSession });
}
