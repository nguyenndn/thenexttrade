import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import {
    getKeyStats,
    getCurrentStreak,
    getDayOfWeekPerformance,
    getSymbolPerformance,
} from "@/lib/analytics-queries";

// ============================================================================
// TYPES
// ============================================================================

export type InsightSeverity = "critical" | "warning" | "strength";

export interface Insight {
    id: string;
    severity: InsightSeverity;
    title: string;
    description: string;
    metric: string;
    icon: string;
    filterUrl?: string;
}

export interface TradeScoreResult {
    score: number;
    label: string;
    color: string;
}

export interface IntelligenceData {
    totalAnalyzed: number;
    periodDays: number;
    tradeScore: TradeScoreResult;
    issues: Insight[];
    strengths: Insight[];
    hasEnoughData: boolean;
    quickStats: {
        winRate: number;
        avgRR: number;
        slUsageRate: number;
        planComplianceRate: number;
        revengeCount: number;
        bestSession: string | null;
    };
    scoreFactors: Array<{
        name: string;
        value: number;
        impact: "positive" | "negative" | "neutral";
    }>;
}

// ============================================================================
// MINIMUM DATA THRESHOLD
// ============================================================================
const MIN_TRADES = 30;

// ============================================================================
// ADDITIONAL QUERIES (not in analytics-queries.ts)
// ============================================================================

interface SessionPerf {
    session: string;
    tradeCount: number;
    winRate: number;
    pnl: number;
}

async function getSessionPerformance(
    userId: string,
    accountId?: string,
    startDate?: Date,
    endDate?: Date
): Promise<SessionPerf[]> {
    const dateFilter =
        startDate && endDate
            ? Prisma.sql`AND "exitDate" >= ${startDate} AND "exitDate" <= ${endDate}`
            : Prisma.empty;

    const result = await prisma.$queryRaw`
        SELECT 
            "trading_session" as "session",
            COUNT(*) as "tradeCount",
            SUM(CASE WHEN "result" = 'WIN' THEN 1 ELSE 0 END) as "winCount",
            SUM(COALESCE("pnl", 0) + COALESCE("commission", 0) + COALESCE("swap", 0)) as "pnl"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND "trading_session" IS NOT NULL
        AND (${accountId ? accountId : "1"} = '1' OR "accountId" = ${accountId})
        ${dateFilter}
        GROUP BY "trading_session"
        HAVING COUNT(*) >= 5
        ORDER BY "tradeCount" DESC
    `;

    return (result as any[]).map((r) => ({
        session: r.session,
        tradeCount: Number(r.tradeCount),
        winRate:
            Number(r.tradeCount) > 0
                ? (Number(r.winCount) / Number(r.tradeCount)) * 100
                : 0,
        pnl: Number(r.pnl || 0),
    }));
}

interface RevengeTrade {
    count: number;
    lossRate: number;
}

async function getRevengeTradePatterns(
    userId: string,
    accountId?: string,
    startDate?: Date,
    endDate?: Date
): Promise<RevengeTrade> {
    const dateFilter =
        startDate && endDate
            ? Prisma.sql`AND t2."exitDate" >= ${startDate} AND t2."exitDate" <= ${endDate}`
            : Prisma.empty;

    const result = await prisma.$queryRaw`
        WITH ordered_trades AS (
            SELECT 
                "id",
                "entryDate",
                "exitDate",
                "result",
                "pnl",
                LAG("exitDate") OVER (ORDER BY "entryDate" ASC) as "prevExitDate",
                LAG("result") OVER (ORDER BY "entryDate" ASC) as "prevResult"
            FROM "JournalEntry"
            WHERE "userId" = ${userId}::uuid
            AND "status" = 'CLOSED'
            AND (${accountId ? accountId : "1"} = '1' OR "accountId" = ${accountId})
        )
        SELECT 
            COUNT(*) as "revengeCount",
            SUM(CASE WHEN "result" = 'LOSS' THEN 1 ELSE 0 END) as "revengeLosses"
        FROM ordered_trades t2
        WHERE "prevResult" = 'LOSS'
        AND "entryDate" - "prevExitDate" < INTERVAL '60 minutes'
        AND "prevExitDate" IS NOT NULL
        ${dateFilter}
    `;

    const row = (result as any[])[0] || {};
    const count = Number(row.revengeCount || 0);
    const losses = Number(row.revengeLosses || 0);

    return {
        count,
        lossRate: count > 0 ? (losses / count) * 100 : 0,
    };
}

interface ComplianceData {
    planComplianceRate: number;
    totalWithPlan: number;
}

async function getPlanCompliance(
    userId: string,
    accountId?: string,
    startDate?: Date,
    endDate?: Date
): Promise<ComplianceData> {
    const dateFilter =
        startDate && endDate
            ? Prisma.sql`AND "exitDate" >= ${startDate} AND "exitDate" <= ${endDate}`
            : Prisma.empty;

    const result = await prisma.$queryRaw`
        SELECT
            COUNT(*) FILTER (WHERE "followedPlan" IS NOT NULL) as "totalWithPlan",
            COUNT(*) FILTER (WHERE "followedPlan" = true) as "followedCount"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND (${accountId ? accountId : "1"} = '1' OR "accountId" = ${accountId})
        ${dateFilter}
    `;

    const row = (result as any[])[0] || {};
    const totalWithPlan = Number(row.totalWithPlan || 0);
    const followedCount = Number(row.followedCount || 0);

    return {
        planComplianceRate: totalWithPlan > 0 ? (followedCount / totalWithPlan) * 100 : -1,
        totalWithPlan,
    };
}

interface EmotionPattern {
    emotion: string;
    tradeCount: number;
    lossRate: number;
}

async function getEmotionCorrelation(
    userId: string,
    accountId?: string,
    startDate?: Date,
    endDate?: Date
): Promise<EmotionPattern[]> {
    const dateFilter =
        startDate && endDate
            ? Prisma.sql`AND "exitDate" >= ${startDate} AND "exitDate" <= ${endDate}`
            : Prisma.empty;

    const result = await prisma.$queryRaw`
        SELECT
            "emotionBefore" as "emotion",
            COUNT(*) as "tradeCount",
            SUM(CASE WHEN "result" = 'LOSS' THEN 1 ELSE 0 END) as "lossCount"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND "emotionBefore" IS NOT NULL
        AND (${accountId ? accountId : "1"} = '1' OR "accountId" = ${accountId})
        ${dateFilter}
        GROUP BY "emotionBefore"
        HAVING COUNT(*) >= 5
        ORDER BY "tradeCount" DESC
    `;

    return (result as any[]).map((r) => ({
        emotion: r.emotion,
        tradeCount: Number(r.tradeCount),
        lossRate:
            Number(r.tradeCount) > 0
                ? (Number(r.lossCount) / Number(r.tradeCount)) * 100
                : 0,
    }));
}

async function getRiskDiscipline(
    userId: string,
    accountId?: string,
    startDate?: Date,
    endDate?: Date
): Promise<number> {
    const dateFilter =
        startDate && endDate
            ? Prisma.sql`AND "exitDate" >= ${startDate} AND "exitDate" <= ${endDate}`
            : Prisma.empty;

    const result = await prisma.$queryRaw`
        SELECT
            COUNT(*) as "total",
            COUNT(*) FILTER (WHERE "stopLoss" IS NOT NULL) as "withSL"
        FROM "JournalEntry"
        WHERE "userId" = ${userId}::uuid
        AND "status" = 'CLOSED'
        AND (${accountId ? accountId : "1"} = '1' OR "accountId" = ${accountId})
        ${dateFilter}
    `;

    const row = (result as any[])[0] || {};
    const total = Number(row.total || 0);
    const withSL = Number(row.withSL || 0);

    return total > 0 ? (withSL / total) * 100 : 0;
}

// ============================================================================
// TRADE SCORE
// ============================================================================

function calculateTradeScore(data: {
    winRate: number;
    avgRR: number;
    planCompliance: number;
    slUsageRate: number;
    revengeTradeCount: number;
    overtradingDays: number;
    weakPairCount: number;
    emotionLossRate: number;
}): TradeScoreResult {
    let score = 50;

    // Positive factors
    if (data.winRate > 50) score += Math.min(15, (data.winRate - 50) * 0.5);
    if (data.avgRR > 1.5) score += 10;
    else if (data.avgRR > 1.0) score += 5;
    if (data.planCompliance > 80) score += 10;
    else if (data.planCompliance > 60) score += 5;
    if (data.slUsageRate > 90) score += 5;
    else if (data.slUsageRate > 75) score += 3;

    // Negative factors
    if (data.revengeTradeCount > 5) score -= 15;
    else if (data.revengeTradeCount > 2) score -= 8;
    if (data.overtradingDays > 2) score -= 10;
    else if (data.overtradingDays > 0) score -= 5;
    if (data.weakPairCount > 1) score -= 10;
    else if (data.weakPairCount === 1) score -= 5;
    if (data.emotionLossRate > 70) score -= 8;
    else if (data.emotionLossRate > 55) score -= 4;
    if (data.planCompliance >= 0 && data.planCompliance < 50) score -= 10;

    const finalScore = Math.max(0, Math.min(100, Math.round(score)));

    let label: string;
    let color: string;
    if (finalScore >= 90) {
        label = "Excellent";
        color = "emerald";
    } else if (finalScore >= 75) {
        label = "Good";
        color = "blue";
    } else if (finalScore >= 60) {
        label = "Average";
        color = "yellow";
    } else if (finalScore >= 40) {
        label = "Needs Work";
        color = "orange";
    } else {
        label = "Critical";
        color = "red";
    }

    return { score: finalScore, label, color };
}

// ============================================================================
// INSIGHT DETECTION RULES
// ============================================================================

function detectInsights(data: {
    stats: Awaited<ReturnType<typeof getKeyStats>>;
    revenge: RevengeTrade;
    dayOfWeek: Awaited<ReturnType<typeof getDayOfWeekPerformance>>;
    sessions: SessionPerf[];
    symbols: Awaited<ReturnType<typeof getSymbolPerformance>>;
    planCompliance: ComplianceData;
    emotions: EmotionPattern[];
    riskDiscipline: number;
}): { issues: Insight[]; strengths: Insight[] } {
    const issues: Insight[] = [];
    const strengths: Insight[] = [];
    const overallWR = data.stats.winRate;

    // Rule 1: Revenge Trading
    if (data.revenge.count >= 3) {
        issues.push({
            id: "revenge-trading",
            severity: data.revenge.count >= 5 ? "critical" : "warning",
            title: "Revenge Trading Detected",
            description: `You opened ${data.revenge.count} trades within 1 hour after a loss. ${Math.round(data.revenge.lossRate)}% of those were also losses.`,
            metric: `${data.revenge.count} revenge trades`,
            icon: "AlertTriangle",
        });
    }

    // Rule 2: Overtrading Day
    const overtradingDays = data.dayOfWeek.filter(
        (d) => d.tradeCount >= 5 && d.winRate < overallWR - 15
    );
    if (overtradingDays.length > 0) {
        const worstDay = overtradingDays.sort((a, b) => a.winRate - b.winRate)[0];
        issues.push({
            id: "overtrading-day",
            severity: "warning",
            title: `Underperforming on ${worstDay.day}s`,
            description: `Your ${worstDay.day} win rate is ${Math.round(worstDay.winRate)}% vs ${Math.round(overallWR)}% overall. You lose more on this day.`,
            metric: `${Math.round(worstDay.winRate)}% WR on ${worstDay.day}`,
            icon: "TrendingDown",
            filterUrl: `/dashboard/journal?dayOfWeek=${worstDay.dayIndex}`,
        });
    }

    // Rule 3: Pair Weakness
    const weakPairs = data.symbols.filter(
        (s) => s.trades >= 8 && s.winRate < 40
    );
    for (const pair of weakPairs.slice(0, 2)) {
        issues.push({
            id: `weak-pair-${pair.symbol}`,
            severity: "warning",
            title: `Low Win Rate on ${pair.symbol}`,
            description: `${pair.symbol} has a ${Math.round(pair.winRate)}% win rate across ${pair.trades} trades. Consider reviewing your strategy for this pair.`,
            metric: `${Math.round(pair.winRate)}% WR (${pair.trades} trades)`,
            icon: "BarChart3",
            filterUrl: `/dashboard/journal?symbol=${pair.symbol}`,
        });
    }

    // Rule 4: Emotion-Loss Pattern
    const badEmotions = data.emotions.filter((e) => e.lossRate > 65);
    if (badEmotions.length > 0) {
        const worst = badEmotions.sort((a, b) => b.lossRate - a.lossRate)[0];
        issues.push({
            id: "emotion-pattern",
            severity: "warning",
            title: `"${worst.emotion}" Leads to Losses`,
            description: `When you feel "${worst.emotion}" before trading, ${Math.round(worst.lossRate)}% of trades result in losses (${worst.tradeCount} trades analyzed).`,
            metric: `${Math.round(worst.lossRate)}% loss rate`,
            icon: "Frown",
        });
    }

    // Rule 5: Session Edge (Strength)
    if (data.sessions.length >= 2) {
        const best = data.sessions.sort((a, b) => b.winRate - a.winRate)[0];
        if (best.winRate > overallWR + 10) {
            strengths.push({
                id: "session-edge",
                severity: "strength",
                title: `${best.session} Session Specialist`,
                description: `Your win rate in ${best.session} session is ${Math.round(best.winRate)}% vs ${Math.round(overallWR)}% overall. This is your strongest edge.`,
                metric: `${Math.round(best.winRate)}% WR`,
                icon: "Clock",
            });
        }
    }

    // Rule 6: Best Trading Day (Strength)
    if (data.dayOfWeek.length >= 3) {
        const bestDay = [...data.dayOfWeek]
            .filter((d) => d.tradeCount >= 5)
            .sort((a, b) => b.winRate - a.winRate)[0];
        if (bestDay && bestDay.winRate > overallWR + 10) {
            strengths.push({
                id: "best-day",
                severity: "strength",
                title: `${bestDay.day} is Your Best Day`,
                description: `You have a ${Math.round(bestDay.winRate)}% win rate on ${bestDay.day}s with ${bestDay.tradeCount} trades. Consider concentrating your trading here.`,
                metric: `${Math.round(bestDay.winRate)}% WR`,
                icon: "Calendar",
            });
        }
    }

    // Rule 7: Plan Compliance
    if (data.planCompliance.totalWithPlan >= 10) {
        const rate = data.planCompliance.planComplianceRate;
        if (rate >= 80) {
            strengths.push({
                id: "plan-compliance",
                severity: "strength",
                title: "Strong Plan Discipline",
                description: `You follow your trading plan ${Math.round(rate)}% of the time. Discipline is key to long-term success.`,
                metric: `${Math.round(rate)}% compliance`,
                icon: "ClipboardCheck",
            });
        } else if (rate < 60) {
            issues.push({
                id: "plan-compliance",
                severity: "warning",
                title: "Low Plan Compliance",
                description: `Only ${Math.round(rate)}% of your trades follow your plan. Trades outside your plan tend to perform worse.`,
                metric: `${Math.round(rate)}% compliance`,
                icon: "ClipboardX",
            });
        }
    }

    // Rule 8: Risk Discipline
    if (data.riskDiscipline >= 90) {
        strengths.push({
            id: "risk-discipline",
            severity: "strength",
            title: "Excellent Risk Management",
            description: `${Math.round(data.riskDiscipline)}% of your trades have a stop loss set. Great risk management discipline.`,
            metric: `${Math.round(data.riskDiscipline)}% SL usage`,
            icon: "Shield",
        });
    } else if (data.riskDiscipline < 70) {
        issues.push({
            id: "risk-discipline",
            severity: "warning",
            title: "Stop Loss Often Missing",
            description: `Only ${Math.round(data.riskDiscipline)}% of trades have a stop loss. Trading without SL increases your risk exposure significantly.`,
            metric: `${Math.round(data.riskDiscipline)}% SL usage`,
            icon: "ShieldOff",
        });
    }

    // Sort: critical first, then warning
    issues.sort((a, b) => {
        const order: Record<InsightSeverity, number> = { critical: 0, warning: 1, strength: 2 };
        return order[a.severity] - order[b.severity];
    });

    return { issues, strengths };
}

// ============================================================================
// SCORE HISTORY — Lightweight score computation for trend tracking
// ============================================================================

export interface ScoreHistoryPoint {
    weekStart: string;
    weekEnd: string;
    score: number;
    trades: number;
    label: string;
    color: string;
}

/**
 * Lightweight score calculation — only 5 queries instead of 9.
 * Used for score history chart where we don't need full insight detection.
 */
async function getQuickScore(
    userId: string,
    accountId?: string,
    startDate?: Date,
    endDate?: Date
): Promise<{ score: number; trades: number; label: string; color: string }> {
    const [stats, revenge, planCompliance, riskDiscipline] = await Promise.all([
        getKeyStats(userId, accountId, startDate, endDate),
        getRevengeTradePatterns(userId, accountId, startDate, endDate),
        getPlanCompliance(userId, accountId, startDate, endDate),
        getRiskDiscipline(userId, accountId, startDate, endDate),
    ]);

    if (stats.totalTrades < 5) {
        return { score: -1, trades: stats.totalTrades, label: "N/A", color: "gray" };
    }

    const avgRR = stats.avgLoss > 0 ? stats.avgWin / stats.avgLoss : 0;

    const result = calculateTradeScore({
        winRate: stats.winRate,
        avgRR,
        planCompliance: planCompliance.planComplianceRate >= 0 ? planCompliance.planComplianceRate : 70,
        slUsageRate: riskDiscipline,
        revengeTradeCount: revenge.count,
        overtradingDays: 0, // Skip day-of-week analysis for speed
        weakPairCount: 0,   // Skip symbol analysis for speed
        emotionLossRate: 0,  // Skip emotion analysis for speed
    });

    return { score: result.score, trades: stats.totalTrades, label: result.label, color: result.color };
}

/**
 * Get score history for the last N weeks.
 * Returns weekly score data points for trend chart.
 */
export async function getScoreHistory(
    userId: string,
    accountId?: string,
    weeks: number = 12
): Promise<ScoreHistoryPoint[]> {
    const now = new Date();
    const weekRanges: Array<{ start: Date; end: Date }> = [];

    for (let i = weeks - 1; i >= 0; i--) {
        const weekEnd = new Date(now);
        weekEnd.setDate(weekEnd.getDate() - i * 7);
        weekEnd.setHours(23, 59, 59, 999);

        const weekStart = new Date(weekEnd);
        weekStart.setDate(weekStart.getDate() - 6);
        weekStart.setHours(0, 0, 0, 0);

        weekRanges.push({ start: weekStart, end: weekEnd });
    }

    const results = await Promise.all(
        weekRanges.map(({ start, end }) => getQuickScore(userId, accountId, start, end))
    );

    return results.map((r, i) => ({
        weekStart: weekRanges[i].start.toISOString().split("T")[0],
        weekEnd: weekRanges[i].end.toISOString().split("T")[0],
        score: r.score,
        trades: r.trades,
        label: r.label,
        color: r.color,
    }));
}

// ============================================================================
// MAIN ORCHESTRATOR
// ============================================================================

export async function getIntelligenceData(
    userId: string,
    accountId?: string,
    startDate?: Date,
    endDate?: Date,
    timezone?: string
): Promise<IntelligenceData> {
    // Run all queries in parallel
    const [stats, _streak, dayOfWeek, symbols, sessions, revenge, planCompliance, emotions, riskDiscipline] =
        await Promise.all([
            getKeyStats(userId, accountId, startDate, endDate),
            getCurrentStreak(userId, accountId),
            getDayOfWeekPerformance(userId, accountId, startDate, endDate, timezone),
            getSymbolPerformance(userId, accountId, startDate, endDate),
            getSessionPerformance(userId, accountId, startDate, endDate),
            getRevengeTradePatterns(userId, accountId, startDate, endDate),
            getPlanCompliance(userId, accountId, startDate, endDate),
            getEmotionCorrelation(userId, accountId, startDate, endDate),
            getRiskDiscipline(userId, accountId, startDate, endDate),
        ]);

    const hasEnoughData = stats.totalTrades >= MIN_TRADES;

    if (!hasEnoughData) {
        return {
            totalAnalyzed: stats.totalTrades,
            periodDays: startDate && endDate
                ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
                : 0,
            tradeScore: { score: 0, label: "N/A", color: "gray" },
            issues: [],
            strengths: [],
            hasEnoughData: false,
            quickStats: {
                winRate: 0, avgRR: 0, slUsageRate: 0,
                planComplianceRate: -1, revengeCount: 0, bestSession: null,
            },
            scoreFactors: [],
        };
    }

    // Detect insights
    const { issues, strengths } = detectInsights({
        stats,
        revenge,
        dayOfWeek,
        sessions,
        symbols,
        planCompliance,
        emotions,
        riskDiscipline,
    });

    // Calculate Trade Score
    const overtradingDays = dayOfWeek.filter(
        (d) => d.tradeCount >= 5 && d.winRate < stats.winRate - 15
    ).length;
    const weakPairCount = symbols.filter((s) => s.trades >= 8 && s.winRate < 40).length;
    const worstEmotion = emotions.sort((a, b) => b.lossRate - a.lossRate)[0];

    const avgRR = stats.avgLoss > 0 ? stats.avgWin / stats.avgLoss : 0;

    const tradeScore = calculateTradeScore({
        winRate: stats.winRate,
        avgRR,
        planCompliance: planCompliance.planComplianceRate >= 0 ? planCompliance.planComplianceRate : 70,
        slUsageRate: riskDiscipline,
        revengeTradeCount: revenge.count,
        overtradingDays,
        weakPairCount,
        emotionLossRate: worstEmotion?.lossRate || 0,
    });

    const periodDays =
        startDate && endDate
            ? Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
            : 0;

    // Best session
    const bestSession = sessions.length > 0
        ? sessions.sort((a, b) => b.winRate - a.winRate)[0]?.session || null
        : null;

    // Score factors for breakdown UI
    const scoreFactors: IntelligenceData["scoreFactors"] = [
        { name: "Win Rate", value: stats.winRate, impact: stats.winRate > 50 ? "positive" : stats.winRate < 40 ? "negative" : "neutral" },
        { name: "Risk:Reward", value: Math.round(avgRR * 10) / 10, impact: avgRR > 1.5 ? "positive" : avgRR < 1 ? "negative" : "neutral" },
        { name: "SL Discipline", value: Math.round(riskDiscipline), impact: riskDiscipline > 90 ? "positive" : riskDiscipline < 70 ? "negative" : "neutral" },
        { name: "Plan Compliance", value: Math.round(planCompliance.planComplianceRate >= 0 ? planCompliance.planComplianceRate : -1), impact: planCompliance.planComplianceRate > 80 ? "positive" : planCompliance.planComplianceRate < 60 ? "negative" : "neutral" },
        { name: "Revenge Trades", value: revenge.count, impact: revenge.count > 5 ? "negative" : revenge.count > 2 ? "negative" : "positive" },
    ];

    return {
        totalAnalyzed: stats.totalTrades,
        periodDays,
        tradeScore,
        issues,
        strengths,
        hasEnoughData: true,
        quickStats: {
            winRate: stats.winRate,
            avgRR,
            slUsageRate: riskDiscipline,
            planComplianceRate: planCompliance.planComplianceRate,
            revengeCount: revenge.count,
            bestSession,
        },
        scoreFactors,
    };
}
