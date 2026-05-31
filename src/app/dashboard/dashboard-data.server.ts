/**
 * Dashboard Data Layer
 *
 * Extracts all database queries and data transformations from page.tsx
 * into a clean, testable module. The page.tsx becomes a thin
 * orchestrator that calls these functions and passes results to the client.
 */

import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import {
    getCachedDashboardStats,
    getDailyPerformance,
    getSymbolPerformance,
    getTopTrades,
    getLotDistribution,
    getSessionPerformance,
    getDayOfWeekPerformance,
    getIntradayPerformance,
} from "@/lib/analytics-queries";
import { getIntelligenceData } from "@/lib/smart-analytics";
import { getActivationState } from "@/lib/activation/activation.server";
import { format, subDays } from "date-fns";
import { parseLocalStartOfDay, parseLocalEndOfDay } from "@/lib/utils";
import { measurePerformance } from "@/lib/performance/timing";
import { getNextBestAction } from "@/lib/coach/next-action.server";
import { computeTraderSignals } from "@/lib/coach/signal-engine.server";
import { getLearningRecommendations } from "@/lib/coach/lesson-recommendations.server";
import { getFirstSessionState } from "@/lib/onboarding/first-session.server";
import { checkAndTriggerMilestones } from "@/lib/milestones/milestones.server";
import type { ActivationState } from "@/lib/activation/activation-types";
import type { FirstSessionComputedState } from "@/lib/onboarding/first-session.server";
import { redirect } from "next/navigation";

// ─── Types ──────────────────────────────────────────────────────────────

export interface DashboardData {
    totalBalance: number;
    winRate: number;
    winRateChange: number;
    streak: number;
    todayPnL: number;
    periodPnL: number;
    profitFactor: number;
    avgWin: number;
    avgLoss: number;
    winCount: number;
    lossCount: number;
    breakEvenCount: number;
}

export interface DashboardPageData {
    userName: string;
    dashboardData: DashboardData;
    chartData: { date: string; balance: number }[];
    recentTrades: any[];
    symbolPerformance: { name: string; value: number }[];
    currentAccountId?: string;
    monthlyAnalytics: { date: string; value: number }[];
    dailyWinRates: { date: string; winRate: number; trades: number; wins: number }[];
    selectedDates?: { from?: string; to?: string };
    bestTrades: any[];
    worstTrades: any[];
    symbolAnalytics: any[];
    lotDistribution: { name: string; value: number }[];
    tradeScore: number | null;
    insight: { icon: string; title: string; description: string } | null;
    intelligenceScore?: number | null;
    sessionPerformance: { session: string; trades: number; pnl: number; winRate: number }[];
    dayOfWeekPerformance: { day: string; dayIndex: number; pnl: number; tradeCount: number; winRate: number }[];
    activationState: ActivationState;
    daysSinceLastReport?: number | null;
    nextBestAction?: any;
    learningRecommendations?: any[];
    firstSessionState?: FirstSessionComputedState;
    tradingGoal?: string | null;
}

// ─── Account & Date Resolution ──────────────────────────────────────────

export interface ResolvedParams {
    accountId?: string;
    fromParam: string;
    toParam: string;
    accountFilter: { userId: string; id?: string };
    accountTimezone?: string;
    startDate: Date;
    endDate: Date;
}

/**
 * Resolve accountId and date params from searchParams + cookies.
 * Redirects if params are missing.
 */
export async function resolveAccountAndDates(
    userId: string,
    searchParams: { [key: string]: string | string[] | undefined }
): Promise<ResolvedParams> {
    const cookieStore = await cookies();
    const lastAccountId = cookieStore.get("last_account_id")?.value;

    let accountId = typeof searchParams?.accountId === "string" ? searchParams.accountId : undefined;
    let fromParam = typeof searchParams?.from === "string" ? searchParams.from : undefined;
    let toParam = typeof searchParams?.to === "string" ? searchParams.to : undefined;
    let needsRedirect = false;

    // Resolve accountId if missing
    if (!accountId) {
        let targetId: string | undefined;

        // Priority 1: User's chosen main account
        const profileMain = await prisma.profile.findUnique({
            where: { userId },
            select: { mainTradingAccountId: true },
        });
        if (profileMain?.mainTradingAccountId) {
            const mainExists = await prisma.tradingAccount.findFirst({
                where: { id: profileMain.mainTradingAccountId, userId },
                select: { id: true },
            });
            if (mainExists) targetId = profileMain.mainTradingAccountId;
        }

        // Priority 2: Cookie account
        if (!targetId && lastAccountId) {
            const cookieAccountExists = await prisma.tradingAccount.findFirst({
                where: { id: lastAccountId, userId },
                select: { id: true },
            });
            if (cookieAccountExists) targetId = lastAccountId;
        }

        // Priority 3: Most recent account
        if (!targetId) {
            const defaultAccount = await prisma.tradingAccount.findFirst({
                where: { userId },
                orderBy: { createdAt: "desc" },
                select: { id: true },
            });
            targetId = defaultAccount?.id;
        }

        if (targetId) {
            accountId = targetId;
            needsRedirect = true;
        }
    }

    // Resolve date params if missing
    if (!fromParam || !toParam) {
        const todayStr = format(new Date(), "yyyy-MM-dd");
        fromParam = fromParam || todayStr;
        toParam = toParam || todayStr;
        needsRedirect = true;
    }

    // Single consolidated redirect
    if (needsRedirect && accountId) {
        const newParams = new URLSearchParams();
        if (searchParams) {
            Object.entries(searchParams).forEach(([key, value]) => {
                if (typeof value === "string" && key !== "accountId" && key !== "from" && key !== "to") {
                    newParams.set(key, value);
                }
            });
        }
        newParams.set("accountId", accountId);
        newParams.set("from", fromParam!);
        newParams.set("to", toParam!);
        redirect(`/dashboard?${newParams.toString()}`);
    }

    const accountFilter = accountId ? { userId, id: accountId } : { userId };

    // Fetch account timezone
    let accountTimezone: string | undefined;
    if (accountId) {
        const acc = await prisma.tradingAccount.findFirst({
            where: { id: accountId, userId },
            select: { timezone: true },
        });
        accountTimezone = acc?.timezone || undefined;
    }

    const startDate = parseLocalStartOfDay(fromParam, accountTimezone);
    const endDate = parseLocalEndOfDay(toParam, accountTimezone);

    return {
        accountId,
        fromParam: fromParam!,
        toParam: toParam!,
        accountFilter,
        accountTimezone,
        startDate: startDate!,
        endDate: endDate!,
    };
}

// ─── Empty Dashboard (Zero Trades) ─────────────────────────────────────

export async function getEmptyDashboardData(
    userId: string,
    accountId: string | undefined,
    fromParam: string,
    toParam: string
): Promise<DashboardPageData> {
    const [userData, activationState, firstSessionState] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: { streak: true, name: true, settings: true },
        }),
        getActivationState(userId),
        getFirstSessionState(userId),
    ]);

    const settings = (userData?.settings as Record<string, any>) || {};
    const tradingGoal = (settings.onboarding as any)?.tradingGoal || null;

    return {
        userName: userData?.name || "Trader",
        dashboardData: {
            totalBalance: 0,
            winRate: 0,
            winRateChange: 0,
            streak: userData?.streak || 0,
            periodPnL: 0,
            todayPnL: 0,
            profitFactor: 0,
            avgWin: 0,
            avgLoss: 0,
            winCount: 0,
            lossCount: 0,
            breakEvenCount: 0,
        },
        chartData: [],
        recentTrades: [],
        symbolPerformance: [],
        currentAccountId: accountId,
        monthlyAnalytics: [],
        dailyWinRates: Array.from({ length: 7 }, (_, i) => ({
            date: format(subDays(new Date(), 6 - i), "yyyy-MM-dd"),
            winRate: 0,
            trades: 0,
            wins: 0,
        })),
        selectedDates: { from: fromParam, to: toParam },
        bestTrades: [],
        worstTrades: [],
        symbolAnalytics: [],
        lotDistribution: [],
        tradeScore: null,
        insight: null,
        sessionPerformance: [],
        dayOfWeekPerformance: [],
        activationState,
        firstSessionState,
        tradingGoal,
    };
}

// ─── Full Dashboard Data ────────────────────────────────────────────────

export async function getFullDashboardData(
    userId: string,
    params: ResolvedParams,
    globalTradeCount: number
): Promise<DashboardPageData> {
    const { accountId, fromParam, toParam, accountFilter, accountTimezone, startDate, endDate } = params;

    // Parallel data fetch
    const [
        userData,
        accounts,
        recentTrades,
        dashboardStats,
        dailyPerformance,
        symbolStats,
        topTrades,
        lotDistribution,
        sessionPerformance,
        dayOfWeekPerformance,
        intelligenceData,
        dailyWinRateLast7,
        activationState,
        latestReport,
    ] = await measurePerformance("dashboard_data_fetch", "db", () =>
        Promise.all([
            prisma.user.findUnique({
                where: { id: userId },
                select: { streak: true, name: true, settings: true },
            }),
            prisma.tradingAccount.findMany({
                where: accountFilter,
                select: { balance: true },
            }),
            prisma.journalEntry.findMany({
                where: { userId, status: "CLOSED", entryDate: { gte: startDate, lte: endDate }, ...(accountId ? { accountId } : {}) },
                orderBy: { entryDate: "desc" },
                take: 10,
            }),
            getCachedDashboardStats(userId, accountId, startDate.toISOString(), endDate.toISOString()),
            getDailyPerformance(userId, accountId, startDate, endDate),
            getSymbolPerformance(userId, accountId, startDate, endDate),
            getTopTrades(userId, accountId, startDate, endDate),
            getLotDistribution(userId, accountId, startDate, endDate),
            getSessionPerformance(userId, accountId, startDate, endDate),
            getDayOfWeekPerformance(userId, accountId, startDate, endDate, accountTimezone),
            getIntelligenceData(userId, accountId, startDate, endDate, accountTimezone).catch(() => null),
            getDailyPerformance(userId, accountId, subDays(new Date(), 6), new Date(), accountTimezone),
            getActivationState(userId),
            prisma.tradingReport.findFirst({
                where: { userId },
                orderBy: { createdAt: "desc" },
                select: { createdAt: true },
            }),
        ])
    );

    // Destructure stats
    const { stats, monthly } = dashboardStats;

    // Insight data from intelligence
    const tradeScore = intelligenceData?.hasEnoughData ? intelligenceData.tradeScore.score : null;
    const insightData = buildInsightData(intelligenceData);

    // Balances
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    // Chart data
    const chartData = await buildChartData(userId, accountId, fromParam, toParam, startDate, endDate, dailyPerformance);

    // Daily win rates (always last 7 days)
    const dailyWinRates = buildDailyWinRates(dailyWinRateLast7);

    // Symbol performance for pie chart
    const symbolPerformance = symbolStats
        .sort((a, b) => b.grossProfit - a.grossProfit)
        .slice(0, 5)
        .map((s) => ({ name: s.symbol, value: s.grossProfit }));

    // Symbol analytics for table
    const symbolAnalytics = symbolStats.map((s) => ({
        symbol: s.symbol,
        trades: s.trades,
        pnl: s.pnl,
    }));

    // Dashboard data object
    const dashboardData: DashboardData = {
        totalBalance,
        winRate: stats.winRate ?? 0,
        winRateChange: 0,
        streak: userData?.streak || 0,
        periodPnL: stats.totalPnL,
        todayPnL: 0,
        profitFactor: stats.profitFactor,
        avgWin: stats.winCount > 0 ? stats.grossProfit / stats.winCount : 0,
        avgLoss: stats.lossCount > 0 ? stats.grossLoss / stats.lossCount : 0,
        winCount: stats.winCount,
        lossCount: stats.lossCount,
        breakEvenCount: Math.max(0, stats.totalTrades - stats.winCount - stats.lossCount),
    };

    // Extract trading goal for content personalization
    const userSettings = (userData?.settings as Record<string, any>) || {};
    const tradingGoal = (userSettings.onboarding as any)?.tradingGoal || null;

    // Coach & recommendations
    const [nextBestAction, signals, firstSessionState] = await Promise.all([
        getNextBestAction(userId, tradingGoal),
        computeTraderSignals(userId, { persist: true }),
        getFirstSessionState(userId),
    ]);

    const learningRecommendations = await getLearningRecommendations(userId, signals, tradingGoal);

    // Fire-and-forget milestone check
    checkAndTriggerMilestones(userId, {
        tradeCount: recentTrades.length > 0 ? globalTradeCount : 0,
        accountCount: accounts.length,
    }).catch(() => { /* silent */ });

    return {
        userName: userData?.name || "Trader",
        dashboardData,
        chartData,
        recentTrades,
        symbolPerformance,
        currentAccountId: accountId,
        monthlyAnalytics: monthly.map((m) => ({ date: m.date, value: m.profit })),
        dailyWinRates,
        selectedDates: { from: fromParam, to: toParam },
        bestTrades: topTrades.best,
        worstTrades: topTrades.worst,
        symbolAnalytics,
        lotDistribution,
        tradeScore,
        insight: insightData,
        intelligenceScore: tradeScore,
        sessionPerformance,
        dayOfWeekPerformance,
        activationState,
        daysSinceLastReport: latestReport
            ? Math.floor((new Date().getTime() - latestReport.createdAt.getTime()) / (1000 * 60 * 60 * 24))
            : null,
        nextBestAction,
        learningRecommendations,
        firstSessionState,
        tradingGoal,
    };
}

// ─── Helpers ────────────────────────────────────────────────────────────

function buildInsightData(
    intelligenceData: any
): { icon: string; title: string; description: string } | null {
    if (!intelligenceData?.hasEnoughData) return null;

    const topIssue = intelligenceData.issues[0];
    if (topIssue) {
        let headline = "";
        let context = "";
        if (topIssue.id.includes("revenge")) {
            headline = "Emotional control is your #1 growth area";
            context = `${topIssue.metric} detected — directly impacting your score.`;
        } else if (topIssue.id.includes("overtrading")) {
            headline = "Trade frequency is hurting your edge";
            context = `${topIssue.metric}. Quality over quantity.`;
        } else if (topIssue.id.includes("weak")) {
            headline = "Pair selection is diluting your performance";
            context = topIssue.metric;
        } else if (topIssue.id.includes("emotion")) {
            headline = "Emotions are a leading indicator of losses";
            context = topIssue.metric;
        } else if (topIssue.id.includes("risk") || topIssue.id.includes("sl")) {
            headline = "Risk management gaps detected";
            context = topIssue.metric;
        } else if (topIssue.id.includes("plan")) {
            headline = "Trading without a plan is costing you";
            context = topIssue.metric;
        } else {
            headline = topIssue.title;
            context = topIssue.metric;
        }
        return {
            icon: topIssue.severity === "critical" ? "AlertTriangle" : topIssue.icon || "Brain",
            title: headline,
            description: context,
        };
    } else if (intelligenceData.strengths.length > 0) {
        return {
            icon: "Sparkles",
            title: "No critical issues — keep it up!",
            description: intelligenceData.strengths[0].title,
        };
    }
    return {
        icon: "Brain",
        title: "Consistent execution detected",
        description: "No significant behavioral issues found.",
    };
}

async function buildChartData(
    userId: string,
    accountId: string | undefined,
    fromParam: string,
    toParam: string,
    startDate: Date,
    endDate: Date,
    dailyPerformance: any[]
): Promise<{ date: string; balance: number }[]> {
    const isSingleDay = fromParam === toParam;

    if (isSingleDay) {
        const intradayTrades = await getIntradayPerformance(userId, accountId, startDate, endDate);
        const BUCKET_MS = 15 * 60 * 1000;
        const dayStartTime = new Date(`${fromParam}T00:00:00`).getTime();
        const nowTime = Date.now();

        let cumPnl = 0;
        const tradePoints = intradayTrades.map((t) => {
            cumPnl += t.pnl;
            return { time: new Date(t.date).getTime(), balance: cumPnl };
        });

        const chartData: { date: string; balance: number }[] = [
            { date: `${fromParam}T00:00:00`, balance: 0 },
        ];
        let lastBalance = 0;

        for (let bucketTime = dayStartTime + BUCKET_MS; bucketTime <= nowTime; bucketTime += BUCKET_MS) {
            const tradesBeforeBucket = tradePoints.filter((tp) => tp.time <= bucketTime);
            if (tradesBeforeBucket.length > 0) {
                lastBalance = tradesBeforeBucket[tradesBeforeBucket.length - 1].balance;
            }
            chartData.push({
                date: new Date(bucketTime).toISOString(),
                balance: Number(lastBalance.toFixed(2)),
            });
        }

        if (tradePoints.length > 0) {
            const finalBalance = tradePoints[tradePoints.length - 1].balance;
            chartData.push({
                date: new Date(nowTime).toISOString(),
                balance: Number(finalBalance.toFixed(2)),
            });
        }

        return chartData;
    }

    // Multi-day: cumulative growth
    let cumulativePnL = 0;
    return dailyPerformance.map((day) => {
        cumulativePnL += day.value;
        return {
            date: day.date,
            balance: Number(cumulativePnL.toFixed(2)),
        };
    });
}

function buildDailyWinRates(
    dailyWinRateLast7: any[]
): { date: string; winRate: number; trades: number; wins: number }[] {
    const winRateMap7 = new Map(dailyWinRateLast7.map((day) => [day.date, day]));
    const dailyWinRates: { date: string; winRate: number; trades: number; wins: number }[] = [];
    for (let i = 6; i >= 0; i--) {
        const dateStr = format(subDays(new Date(), i), "yyyy-MM-dd");
        const existing = winRateMap7.get(dateStr);
        dailyWinRates.push({
            date: dateStr,
            winRate: existing?.winRate || 0,
            trades: existing?.tradeCount || 0,
            wins: existing?.winCount || 0,
        });
    }
    return dailyWinRates;
}
