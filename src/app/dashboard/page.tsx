import { Suspense } from "react";
import DashboardSkeleton from "@/components/dashboard/loading/DashboardSkeleton";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";

import DashboardClient from "./DashboardClient";
import { cookies } from "next/headers";
import { getCachedDashboardStats, getDailyPerformance, getSymbolPerformance, getTopTrades, getLotDistribution } from "@/lib/analytics-queries";
import { format } from "date-fns";
import { parseLocalStartOfDay, parseLocalEndOfDay } from "@/lib/utils";


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
        redirect("/auth/signin");
    }

    // 1. Config & Filters
    const cookieStore = await cookies();
    const lastAccountId = cookieStore.get("last_account_id")?.value;

    // Server-Side Redirect to enforce accountId in URL (Prevent Double Load)
    if (!searchParams?.accountId) {
        let targetId: string | undefined;

        // Validate cookie account ID actually exists for this user
        if (lastAccountId) {
            const cookieAccountExists = await prisma.tradingAccount.findFirst({
                where: { id: lastAccountId, userId: user.id },
                select: { id: true }
            });
            if (cookieAccountExists) {
                targetId = lastAccountId;
            }
        }

        // Fallback: Get the most recent account from DB
        if (!targetId) {
            const defaultAccount = await prisma.tradingAccount.findFirst({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                select: { id: true }
            });
            targetId = defaultAccount?.id;
        }

        if (targetId) {
            // Reconstruct params to preserve filters like date range
            const newParams = new URLSearchParams();
            if (searchParams) {
                Object.entries(searchParams).forEach(([key, value]) => {
                    if (typeof value === 'string') newParams.set(key, value);
                });
            }
            newParams.set("accountId", targetId);
            redirect(`/dashboard?${newParams.toString()}`);
        }
    }

    const accountId = searchParams?.accountId as string; // Guaranteed to be set or empty if no accounts
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

    let fromParam = typeof searchParams?.from === 'string' ? searchParams.from : undefined;
    let toParam = typeof searchParams?.to === 'string' ? searchParams.to : undefined;

    // Server-Side Redirect to enforce date range in URL (Today by default)
    if (!fromParam || !toParam) {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        fromParam = fromParam || todayStr;
        toParam = toParam || todayStr;

        const newParams = new URLSearchParams();
        if (searchParams) {
             Object.entries(searchParams).forEach(([key, value]) => {
                if (typeof value === 'string' && key !== 'from' && key !== 'to') newParams.set(key, value);
             });
        }
        newParams.set('from', fromParam);
        newParams.set('to', toParam);
        // Ensure accountId is still kept intact
        newParams.set("accountId", accountId); 
        
        redirect(`/dashboard?${newParams.toString()}`);
    }

    const startDate = parseLocalStartOfDay(fromParam, accountTimezone);
    const endDate = parseLocalEndOfDay(toParam, accountTimezone);

    // 2. Optimized Data Fetching (Parallel)
    const [
        userData,
        accounts,
        recentTrades,
        dashboardStats,     // Cached wrapper result
        dailyPerformance,
        symbolStats,
        topTrades,
        lotDistribution,
    ] = await Promise.all([
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
    ]);

    // Destructure stats from cached result
    const { stats, monthly } = dashboardStats;

    // 3. Post-Processing & Formatting
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    // Chart Data: Convert Daily PnL to Cumulative Growth
    let cumulativePnL = 0;
    const chartData = dailyPerformance.map(day => {
        cumulativePnL += day.value;
        return {
            date: day.date,
            balance: Number(cumulativePnL.toFixed(2)) // Chart expects "balance" key
        };
    });

    // Daily Win Rate for Chart (if needed by component)
    const dailyWinRates = dailyPerformance.map(day => ({
        date: day.date,
        winRate: day.winRate,
        trades: day.tradeCount || 0, // Using returned tradeCount
        wins: day.winCount || 0      // Using returned winCount
    }));

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
        winRate: stats.winRate,
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

    return (
        <DashboardClient
            userName={userData?.name || "Trader"}
            dashboardData={dashboardData}
            chartData={chartData}
            recentTrades={recentTrades}
            symbolPerformance={symbolPerformance}
            currentAccountId={accountId}
            monthlyAnalytics={monthly.map(m => ({ date: m.date, value: m.profit }))}
            dailyWinRates={dailyWinRates}
            bestTrades={topTrades.best}
            worstTrades={topTrades.worst}
            symbolAnalytics={symbolAnalytics}
            lotDistribution={lotDistribution}
        />
    );
}
