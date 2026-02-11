import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { BADGES } from "@/lib/gamification";
import DashboardClient from "./DashboardClient";
import { cookies } from "next/headers";
import { DashboardFilter } from "@/components/dashboard/DashboardFilter";
import { getCachedDashboardStats, getDailyPerformance, getSymbolPerformance, getKeyStats, getMonthlyAnalytics, getTopTrades, getLotDistribution } from "@/lib/analytics-queries";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, subDays, format, addHours, subHours, parseISO } from "date-fns";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    return <DashboardLoader searchParams={resolvedParams} />;
}

async function DashboardLoader({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const user = await getAuthUser();

    if (!user) {
        redirect("/auth/signin");
    }

    // 1. Config & Filters
    const cookieStore = await cookies();
    const lastAccountId = cookieStore.get("last_account_id")?.value;
    const accountId = typeof searchParams?.accountId === 'string' ? searchParams.accountId : lastAccountId;
    const accountFilter = accountId ? { userId: user.id, id: accountId } : { userId: user.id };

    const fromParam = typeof searchParams?.from === 'string' ? searchParams.from : undefined;
    const toParam = typeof searchParams?.to === 'string' ? searchParams.to : undefined;

    const startDate = fromParam ? parseISO(fromParam) : undefined;
    // For endDate, if it's "2025-02-11", we want the END of that day.
    const endDate = toParam ? endOfDay(parseISO(toParam)) : undefined;

    // 2. Optimized Data Fetching (Parallel)
    // 2. Optimized Data Fetching (Parallel)
    const [
        userData,
        accounts,
        recentTrades,
        stats,     // Now individual result
        monthly,   // Now individual result
        dailyPerformance,
        symbolStats,
        topTrades,
        lotDistribution
    ] = await Promise.all([
        // User Info
        prisma.user.findUnique({
            where: { id: user.id },
            select: { xp: true, level: true, badges: true, streak: true, name: true }
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
                ...(accountId ? { tradingAccountId: accountId } : {}),
                status: 'CLOSED'
            },
            orderBy: { exitDate: 'desc' },
            take: 10,
            include: {
                account: { select: { name: true, color: true } }
            }
        }),
        // Stats (Respects Date Filter)
        getKeyStats(user.id, accountId, startDate, endDate),
        
        // Monthly Analytics (Always last 12 months for trend view, or we could filter it too)
        // Keeping it fixed to 12 months for now as per "Monthly Analytics" usually showing trends.
        getMonthlyAnalytics(user.id, accountId),

        
        // Daily Chart Data (Aggregated via SQL)
        getDailyPerformance(user.id, accountId, startDate, endDate),
        // Symbol Performance (Aggregated via SQL)
        getSymbolPerformance(user.id, accountId, startDate, endDate),
        // Top Trades
        getTopTrades(user.id, accountId, startDate, endDate),
        // Lot Distribution
        getLotDistribution(user.id, accountId, startDate, endDate)
    ]);

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
    };

    const allBadges = Object.values(BADGES).map(b => ({
        id: b.code, code: b.code, name: b.name, description: b.description, icon: b.icon
    }));

    return (
        <DashboardClient
            userData={userData || undefined}
            allBadges={allBadges}
            userName={userData?.name || "Trader"}
            dashboardData={dashboardData}
            chartData={chartData}
            recentActivity={[]}
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
