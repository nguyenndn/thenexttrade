import { Suspense } from "react";
import DashboardSkeleton from "@/components/dashboard/loading/DashboardSkeleton";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";

import DashboardClient from "./DashboardClient";
import { cookies } from "next/headers";
import { getCachedDashboardStats, getDailyPerformance, getSymbolPerformance, getTopTrades, getLotDistribution, getSessionPerformance, getDayOfWeekPerformance, getIntradayPerformance } from "@/lib/analytics-queries";
import { getIntelligenceData } from "@/lib/smart-analytics";
import { getActivationState } from "@/lib/activation/activation.server";
import { format, subDays } from "date-fns";
import { parseLocalStartOfDay, parseLocalEndOfDay } from "@/lib/utils";
import { TradingAlertBanner } from "@/components/dashboard/TradingAlertBanner";
import { measurePerformance } from "@/lib/performance/timing";
import { getNextBestAction } from "@/lib/coach/next-action.server";
import { computeTraderSignals } from "@/lib/coach/signal-engine.server";
import { getLearningRecommendations } from "@/lib/coach/lesson-recommendations.server";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;

    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardLoader searchParams={resolvedParams} />
        </Suspense>
    );
}

async function DashboardLoader({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const user = await getAuthUser();

    if (!user) {
        redirect("/auth/login");
    }

    // 1. Config & Filters
    const cookieStore = await cookies();
    const lastAccountId = cookieStore.get("last_account_id")?.value;

    // Resolve accountId and date params — single redirect for both
    let accountId = typeof searchParams?.accountId === 'string' ? searchParams.accountId : undefined;
    let fromParam = typeof searchParams?.from === 'string' ? searchParams.from : undefined;
    let toParam = typeof searchParams?.to === 'string' ? searchParams.to : undefined;
    let needsRedirect = false;

    // Resolve accountId if missing
    if (!accountId) {
        let targetId: string | undefined;

        // Priority 1: User's chosen main account from Profile
        const profileMain = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { mainTradingAccountId: true },
        });
        if (profileMain?.mainTradingAccountId) {
            const mainExists = await prisma.tradingAccount.findFirst({
                where: { id: profileMain.mainTradingAccountId, userId: user.id },
                select: { id: true },
            });
            if (mainExists) targetId = profileMain.mainTradingAccountId;
        }

        // Priority 2: Validate cookie account ID
        if (!targetId && lastAccountId) {
            const cookieAccountExists = await prisma.tradingAccount.findFirst({
                where: { id: lastAccountId, userId: user.id },
                select: { id: true }
            });
            if (cookieAccountExists) {
                targetId = lastAccountId;
            }
        }

        // Priority 3: Fallback — most recent account
        if (!targetId) {
            const defaultAccount = await prisma.tradingAccount.findFirst({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                select: { id: true }
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
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        fromParam = fromParam || todayStr;
        toParam = toParam || todayStr;
        needsRedirect = true;
    }

    // Single consolidated redirect for both accountId + date params
    if (needsRedirect && accountId) {
        const newParams = new URLSearchParams();
        if (searchParams) {
            Object.entries(searchParams).forEach(([key, value]) => {
                if (typeof value === 'string' && key !== 'accountId' && key !== 'from' && key !== 'to') {
                    newParams.set(key, value);
                }
            });
        }
        newParams.set("accountId", accountId);
        newParams.set("from", fromParam!);
        newParams.set("to", toParam!);
        redirect(`/dashboard?${newParams.toString()}`);
    }

    const accountFilter = accountId ? { userId: user.id, id: accountId } : { userId: user.id };

    // Fetch account timezone for date boundary alignment
    let accountTimezone: string | undefined;
    if (accountId) {
        const acc = await prisma.tradingAccount.findFirst({
            where: { id: accountId, userId: user.id },
            select: { timezone: true }
        });
        accountTimezone = acc?.timezone || undefined;
    }

    const startDate = parseLocalStartOfDay(fromParam, accountTimezone);
    const endDate = parseLocalEndOfDay(toParam, accountTimezone);

    // 2. Optimized Data Fetching (Parallel)
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
    ] = await measurePerformance('dashboard_data_fetch', 'db', () => Promise.all([
        // User Info (name + streak only)
        prisma.user.findUnique({
            where: { id: user.id },
            select: { streak: true, name: true }
        }),
        // Accounts (For Live Balance)
        prisma.tradingAccount.findMany({
            where: accountFilter,
            select: { balance: true }
        }),
        // Recent Trades List (Needs full details, but limited to 10)
        prisma.journalEntry.findMany({
            where: {
                userId: user.id,
                ...(accountId ? { accountId: accountId } : {}),
                status: 'CLOSED'
            },
            orderBy: { exitDate: 'desc' },
            take: 10,
            include: {
                account: { select: { name: true, color: true } }
            }
        }),
        // Stats & Monthly (Cached)
        getCachedDashboardStats(user.id, accountId, startDate?.toISOString(), endDate?.toISOString()),
        // Daily Chart Data (Aggregated via SQL)
        getDailyPerformance(user.id, accountId, startDate, endDate),
        // Symbol Performance (Aggregated via SQL)
        getSymbolPerformance(user.id, accountId, startDate, endDate),
        // Top Trades
        getTopTrades(user.id, accountId, startDate, endDate),
        // Lot Distribution
        getLotDistribution(user.id, accountId, startDate, endDate),
        // Session Performance
        getSessionPerformance(user.id, accountId, startDate, endDate),
        // Day of Week Performance
        getDayOfWeekPerformance(user.id, accountId, startDate, endDate, accountTimezone),
        // Intelligence data (filtered by same date range as dashboard) — used for Trade Score + Insight Banner
        getIntelligenceData(user.id, accountId, startDate, endDate, accountTimezone).catch(() => null),
        // Daily Win Rate: ALWAYS last 7 days (independent of date filter)
        getDailyPerformance(user.id, accountId, subDays(new Date(), 6), new Date(), accountTimezone),
        // Activation checklist state
        getActivationState(user.id),
        // Latest Report for Nudge Card
        prisma.tradingReport.findFirst({
            where: { userId: user.id },
            orderBy: { createdAt: 'desc' },
            select: { createdAt: true }
        }),
    ]));

    // Destructure stats from cached result
    const { stats, monthly } = dashboardStats;

    // Extract Trade Score + Insight from Intelligence data
    const tradeScore = intelligenceData?.hasEnoughData ? intelligenceData.tradeScore.score : null;

    // Generate insight banner from intelligence top issue/recommendation
    let insightData: { icon: string; title: string; description: string } | null = null;
    if (intelligenceData?.hasEnoughData) {
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
            insightData = {
                icon: topIssue.severity === "critical" ? "AlertTriangle" : topIssue.icon || "Brain",
                title: headline,
                description: context,
            };
        } else if (intelligenceData.strengths.length > 0) {
            insightData = {
                icon: "Sparkles",
                title: "No critical issues — keep it up!",
                description: intelligenceData.strengths[0].title,
            };
        } else {
            insightData = {
                icon: "Brain",
                title: "Consistent execution detected",
                description: "No significant behavioral issues found.",
            };
        }
    }

    // 3. Post-Processing & Formatting
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    // Chart Data: Convert to Cumulative Growth
    // For single-day: use trade-level timestamps for intraday line
    const isSingleDay = fromParam === toParam;
    let chartData: { date: string; balance: number }[];

    if (isSingleDay) {
        // Fetch intraday trade-by-trade data
        const intradayTrades = await getIntradayPerformance(user.id, accountId, startDate, endDate);
        
        // Aggregate into 15-minute time buckets for smooth line
        const BUCKET_MS = 15 * 60 * 1000; // 15 minutes
        const dayStartTime = new Date(`${fromParam}T00:00:00`).getTime();
        const nowTime = Date.now();
        
        // Build cumulative PnL per trade first
        let cumPnl = 0;
        const tradePoints = intradayTrades.map(t => {
            cumPnl += t.pnl;
            return { time: new Date(t.date).getTime(), balance: cumPnl };
        });
        
        // Generate time buckets from 00:00 to now
        chartData = [{ date: `${fromParam}T00:00:00`, balance: 0 }];
        let lastBalance = 0;
        
        for (let bucketTime = dayStartTime + BUCKET_MS; bucketTime <= nowTime; bucketTime += BUCKET_MS) {
            // Find the latest trade before/at this bucket time
            const tradesBeforeBucket = tradePoints.filter(tp => tp.time <= bucketTime);
            if (tradesBeforeBucket.length > 0) {
                lastBalance = tradesBeforeBucket[tradesBeforeBucket.length - 1].balance;
            }
            chartData.push({
                date: new Date(bucketTime).toISOString(),
                balance: Number(lastBalance.toFixed(2))
            });
        }
        
        // Ensure final point is at current time with latest balance
        if (tradePoints.length > 0) {
            const finalBalance = tradePoints[tradePoints.length - 1].balance;
            chartData.push({
                date: new Date(nowTime).toISOString(),
                balance: Number(finalBalance.toFixed(2))
            });
        }
    } else {
        // Multi-day: use daily aggregation
        let cumulativePnL = 0;
        chartData = dailyPerformance.map(day => {
            cumulativePnL += day.value;
            return {
                date: day.date,
                balance: Number(cumulativePnL.toFixed(2))
            };
        });
    }

    // Daily Win Rate: use last 7 days data (independent of date filter)
    const winRateMap7 = new Map(dailyWinRateLast7.map(day => [day.date, day]));
    const dailyWinRates: { date: string; winRate: number; trades: number; wins: number }[] = [];
    for (let i = 6; i >= 0; i--) {
        const dateStr = format(subDays(new Date(), i), 'yyyy-MM-dd');
        const existing = winRateMap7.get(dateStr);
        dailyWinRates.push({
            date: dateStr,
            winRate: existing?.winRate || 0,
            trades: existing?.tradeCount || 0,
            wins: existing?.winCount || 0,
        });
    }

    // Symbol Performance for Pie Chart (Top 5 by Gross Profit)
    // symbolStats returns { symbol, grossProfit, pnl, trades }
    const symbolPerformance = symbolStats
        .sort((a, b) => b.grossProfit - a.grossProfit)
        .slice(0, 5)
        .map(s => ({ name: s.symbol, value: s.grossProfit }));

    // Symbol Analytics for Table
    const symbolAnalytics = symbolStats.map(s => ({
        symbol: s.symbol,
        trades: s.trades,
        pnl: s.pnl
    }));

    // Dashboard Data Object
    const dashboardData = {
        totalBalance,
        winRate: stats.winRate ?? 0,
        winRateChange: 0, // Needs comparison with previous period (skipped for speed V1)
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

    // Fetch Coach & Next Action recommendations
    const [nextBestAction, signals] = await Promise.all([
        getNextBestAction(user.id),
        computeTraderSignals(user.id, { persist: true })
    ]);
    const learningRecommendations = await getLearningRecommendations(user.id, signals);

    return (
        <>
            {/* Trading Protection Alerts */}
            <TradingAlertBanner />
            
            <DashboardClient
                userName={userData?.name || "Trader"}
                dashboardData={dashboardData}
                chartData={chartData}
                recentTrades={recentTrades}
                symbolPerformance={symbolPerformance}
                currentAccountId={accountId}
                monthlyAnalytics={monthly.map(m => ({ date: m.date, value: m.profit }))}
                dailyWinRates={dailyWinRates}
                selectedDates={{ from: fromParam, to: toParam }}
                bestTrades={topTrades.best}
                worstTrades={topTrades.worst}
                symbolAnalytics={symbolAnalytics}
                lotDistribution={lotDistribution}
                tradeScore={tradeScore}
                insight={insightData}
                intelligenceScore={tradeScore}
                sessionPerformance={sessionPerformance}
                dayOfWeekPerformance={dayOfWeekPerformance}
                activationState={activationState}
                daysSinceLastReport={latestReport ? Math.floor((new Date().getTime() - latestReport.createdAt.getTime()) / (1000 * 60 * 60 * 24)) : null}
                nextBestAction={nextBestAction}
                learningRecommendations={learningRecommendations}
            />
        </>
    );
}
