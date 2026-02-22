import { Metadata } from "next";
import { AnalyticsDashboard, AnalyticsData } from "@/components/analytics/AnalyticsDashboard";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, parseISO } from "date-fns";
import {
    getKeyStats,
    getMonthlyAnalytics,
    getDailyPerformance,
    getSymbolPerformance,
    getDayOfWeekPerformance,
    getCurrentStreak
} from "@/lib/analytics-queries";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Analytics | Trading Dashboard",
    description: "Analyze your trading performance",
};

export default async function AnalyticsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    const user = await getAuthUser();

    if (!user) {
        redirect("/auth/signin");
    }

    // 1. Account & Date Filters
    let accountId = resolvedParams?.accountId as string | undefined;

    // Default Account Logic if not provided
    if (!accountId) {
        const cookieStore = await cookies();
        const lastAccountId = cookieStore.get("last_account_id")?.value;

        // Validate cookie account ID actually exists for this user
        if (lastAccountId) {
            const cookieAccountExists = await prisma.tradingAccount.findFirst({
                where: { id: lastAccountId, userId: user.id },
                select: { id: true }
            });
            if (cookieAccountExists) {
                accountId = lastAccountId;
            }
        }

        // Fallback: Get the most recent account from DB
        if (!accountId) {
            const firstAccount = await prisma.tradingAccount.findFirst({
                where: { userId: user.id },
                orderBy: { createdAt: 'desc' },
                select: { id: true }
            });
            if (firstAccount) {
                accountId = firstAccount.id;
            }
        }
    }

    // Date Range Logic
    const startDateParam = resolvedParams?.startDate as string;
    const endDateParam = resolvedParams?.endDate as string;

    const now = new Date();
    const startDate = startDateParam ? parseISO(startDateParam) : startOfMonth(now);
    const endDate = endDateParam ? endOfDay(parseISO(endDateParam)) : endOfMonth(now);

    // 2. Parallel Data Fetching
    const [
        stats,
        dailyPerformance,
        pairPerformance,
        dayOfWeekPerformance,
        streak,
    ] = await Promise.all([
        getKeyStats(user.id, accountId, startDate, endDate),
        getDailyPerformance(user.id, accountId, startDate, endDate),
        getSymbolPerformance(user.id, accountId, startDate, endDate),
        getDayOfWeekPerformance(user.id, accountId, startDate, endDate),
        getCurrentStreak(user.id, accountId)
    ]);

    // 3. Transform Data to match AnalyticsData Interface

    // Equity Curve: Needs to be calculated from Daily Performance + Current Balance?
    // The previous API calculated it by backtracking from current balance.
    // Let's query Current Balance to do the same.
    const accounts = await prisma.tradingAccount.findMany({
        where: { userId: user.id, ...(accountId ? { id: accountId } : {}) },
        select: { balance: true }
    });
    const currentBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    // Calculate Equity Curve (Backtracking method similar to API)
    // Daily Performance returns { date, value (pnl) }
    // Sort descending by date to backtrack? DailyPerformance is sorted ASC by default.

    // We need TOTAL PnL for the period to find Starting Balance.
    const totalPeriodPnL = stats.totalPnL;
    let runningBalance = currentBalance - totalPeriodPnL; // Approx start balance (excluding deposits/withdrawals)

    // Note: This is an approximation if deposits/withdrawals occurred. 
    // Ideally we'd have a Transaction table. For now, we stick to PnL based curve.

    const equityCurve = dailyPerformance.map((day: any) => {
        runningBalance += day.value;
        return {
            date: day.date,
            balance: Number(runningBalance.toFixed(2)),
            pnl: day.value
        };
    });

    // Recent Trades
    // We need a specific query for this or reuse getTopTrades but we need generic recent list
    const recentTradesRaw = await prisma.journalEntry.findMany({
        where: {
            userId: user.id,
            status: "CLOSED",
            ...(accountId ? { accountId } : {}),
            exitDate: { gte: startDate, lte: endDate }
        },
        orderBy: { exitDate: "desc" },
        take: 10,
        select: { id: true, symbol: true, type: true, pnl: true, entryDate: true, exitDate: true, result: true }
    });

    const recentTrades = recentTradesRaw.map((t: any) => ({
        id: t.id,
        symbol: t.symbol,
        type: t.type,
        pnl: Number(t.pnl),
        entryDate: t.entryDate.toISOString(),
        exitDate: t.exitDate?.toISOString(),
        result: t.result || "BREAK_EVEN"
    }));

    // Daily PnL (Format match)
    const dailyPnL = dailyPerformance.map((d: any) => ({
        date: d.date,
        pnl: d.value,
        growth: 0, // Simplified for now
        tradeCount: d.tradeCount,
        trades: [] // We don't load nested trades for the calendar view in V1 to save size
    }));

    // Pair Performance (Format match — winRate now comes from query)
    const pairPerfFormatted = pairPerformance.map((p: any) => ({
        symbol: p.symbol,
        pnl: p.pnl,
        tradeCount: p.trades,
        winRate: p.winRate
    }));

    // 4. Construct Final Data Object
    const data: AnalyticsData = {
        summary: {
            totalTrades: stats.totalTrades,
            winRate: stats.winRate,
            profitFactor: stats.profitFactor,
            totalPnL: stats.totalPnL,
            avgRRR: stats.lossCount > 0 ? stats.avgWin / stats.avgLoss : 0,
            currentStreak: streak.type === 'none' ? { type: 'win', count: 0 } : streak as { type: 'win' | 'loss'; count: number },
            avgWin: stats.winCount > 0 ? stats.grossProfit / stats.winCount : 0,
            avgLoss: stats.lossCount > 0 ? stats.grossLoss / stats.lossCount : 0,
        },
        equityCurve,
        dailyPnL,
        pairPerformance: pairPerfFormatted,
        dayOfWeekPerformance: dayOfWeekPerformance,
        recentTrades
    };

    return (
        <div className="space-y-6">
            <AnalyticsDashboard
                data={data}
                accountId={accountId}
                dateRange={{ start: startDate, end: endDate }}
            />
        </div>
    );
}
