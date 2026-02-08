import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { BADGES } from "@/lib/gamification";
import DashboardClient from "./DashboardClient";
import { cookies } from "next/headers";
import { DashboardFilter } from "@/components/dashboard/DashboardFilter";
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

    // 1. Account Config
    const cookieStore = await cookies();
    const lastAccountId = cookieStore.get("last_account_id")?.value;
    const accountId = typeof searchParams?.accountId === 'string' ? searchParams.accountId : lastAccountId;
    const accountFilter = accountId ? { userId: user.id, id: accountId } : { userId: user.id };

    // 2. Date Filter Config
    // Match logic with /api/analytics/route.ts
    const now = new Date();
    const paramFrom = typeof searchParams?.from === 'string' ? searchParams.from : null;
    const paramTo = typeof searchParams?.to === 'string' ? searchParams.to : null;

    const BROKER_OFFSET_HOURS = 2; // Fixed broker offset (For Charting/Grouping Only)

    // Default to All Time if no params
    // We filter by UTC Date Range corresponding to the selected string.
    // Explicitly construct UTC ISO string to ignore Server/Local Timezone.
    // e.g. "2026-02-06" -> 2026-02-06T00:00:00.000Z to 2026-02-06T23:59:59.999Z
    const startDate = paramFrom ? new Date(`${paramFrom}T00:00:00.000Z`) : new Date("2000-01-01T00:00:00.000Z");
    const endDate = paramTo ? new Date(`${paramTo}T23:59:59.999Z`) : endOfDay(now);

    const entryFilter = {
        userId: user.id,
        ...(accountId ? { tradingAccountId: accountId } : {}),
        exitDate: {
            gte: startDate,
            lte: endDate
        }
    };

    // ============================================
    // Data Fetching
    // ============================================
    const [userData, accounts, filteredEntries, allHistoryEntries] = await Promise.all([
        // 1. User
        prisma.user.findUnique({
            where: { id: user.id },
            select: { xp: true, level: true, badges: true, streak: true }
        }),

        // 2. Accounts (Total Balance is ALWAYS Current)
        prisma.tradingAccount.findMany({
            where: accountFilter,
            select: { balance: true }
        }),

        // 3. Entries in Range (For Stats, Charts, Lists)
        prisma.journalEntry.findMany({
            where: entryFilter,
            orderBy: { exitDate: 'desc' }
        }),

        // 4. All History (For Monthly Analytics)
        prisma.journalEntry.findMany({
            where: {
                userId: user.id,
                ...(accountId ? { tradingAccountId: accountId } : {}),
                exitDate: { not: null }
            },
            select: { exitDate: true, pnl: true },
            orderBy: { exitDate: 'asc' }
        })
    ]);

    // --- Calculations ---

    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    // Monthly Analytics Data (All Time)
    const monthlyStatsMap = new Map<string, number>();
    allHistoryEntries.forEach(e => {
        if (!e.exitDate) return;
        // Group by YYYY-MM
        const monthKey = format(e.exitDate, "yyyy-MM-01");
        // Sum PnL ($)
        monthlyStatsMap.set(monthKey, (monthlyStatsMap.get(monthKey) || 0) + (e.pnl || 0));
    });

    // Convert to % Gain approx or just $ Gain?
    // Let's go with $ Gain for accuracy as requested by logic constraints.
    // If user REALLY wants %, we need a base. Let's assume CurrentBalance is the end state.
    // We can reconstruct approximate Start Balance for each month.
    // let runningBalance = totalBalance;
    // We iterate BACKWARDS from now? No, we have the map.
    // Let's just stick to $ Gain for V1 to avoid confusing math errors.
    // Let's just stick to $ Gain for V1 to avoid confusing math errors.
    const monthlyAnalyticsData = Array.from(monthlyStatsMap.entries()).map(([date, value]) => ({
        date,
        value: Number(value.toFixed(2)) // This is $
    }));

    // Stats based on Filtered Range
    const wins = filteredEntries.filter(t => t.result === 'WIN');
    const losses = filteredEntries.filter(t => t.result === 'LOSS');
    const grossProfit = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0));

    const totalTrades = wins.length + losses.length;
    const winRate = totalTrades > 0 ? (wins.length / totalTrades) * 100 : 0;

    // Profit Factor
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 0);

    // Averages
    const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;

    // Today's PnL (Calculated relative to Real Today, regardless of filter, OR relative to filter?)
    // "Today's PnL" usually means literally Today.
    // 6. Period PnL (Net Profit for selected range)
    const periodPnL = filteredEntries.reduce((sum, e) => sum + (e.pnl || 0), 0);

    // 7. Today's PnL (Strictly Today, for reference or if filter includes today)
    const startOfRealToday = startOfDay(new Date());
    const todayEntries = filteredEntries.filter(e => e.exitDate && e.exitDate >= startOfRealToday);
    const todayPnL = todayEntries.reduce((sum, e) => sum + (e.pnl || 0), 0);

    // Top Trades (Best 3 & Worst 3)
    const bestTrades = [...wins].sort((a, b) => (b.pnl || 0) - (a.pnl || 0)).slice(0, 3);
    const worstTrades = [...losses].sort((a, b) => (a.pnl || 0) - (b.pnl || 0)).slice(0, 3);

    // Symbol Performance for Pie Chart (Gross Profit Distribution)
    const symbolMap = new Map<string, number>();
    filteredEntries.forEach(t => {
        if (t.pnl && t.pnl > 0) {
            symbolMap.set(t.symbol, (symbolMap.get(t.symbol) || 0) + t.pnl);
        }
    });

    const symbolPerformance = Array.from(symbolMap.entries())
        .sort((a, b) => b[1] - a[1]) // Sort by profit descending
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

    // Recent Activity (List)
    // Just map the filtered entries
    const recentActivity = filteredEntries.slice(0, 5).map(e => {
        let type = "CLOSE";
        if (e.result === 'WIN') type = "TP";
        if (e.result === 'LOSS') type = "SL";

        // Calc time ago
        const exitDate = e.exitDate || new Date();
        const diffMs = now.getTime() - exitDate.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHrs = Math.floor(diffMins / 60);
        const diffDays = Math.floor(diffHrs / 24);

        let timeAgo = "Just now";
        if (diffDays > 0) timeAgo = `${diffDays}d ago`;
        else if (diffHrs > 0) timeAgo = `${diffHrs}h ago`;
        else timeAgo = `${diffMins}m ago`;

        return {
            id: e.id, symbol: e.symbol, type,
            title: `${type === 'TP' ? 'Take Profit' : type === 'SL' ? 'Stop Loss' : 'Closed'} ${e.symbol}`,
            timeAgo
        };
    });

    // Chart Data (Balance History in Range)
    // Daily PnL Map (Broker Time Adjusted)
    const dailyPnLMap = new Map<string, number>();
    filteredEntries.forEach(e => {
        if (!e.exitDate) return;
        const brokerDate = addHours(e.exitDate, BROKER_OFFSET_HOURS);
        // Use ISO String splits to get YYYY-MM-DD in UTC (which represents our Shifted Broker Date)
        // This avoids any Local Timezone interference from format()
        const dayStr = brokerDate.toISOString().split('T')[0];
        dailyPnLMap.set(dayStr, (dailyPnLMap.get(dayStr) || 0) + (e.pnl || 0));
    });

    // Create chart points from startDate to endDate
    const chartPoints = [];
    let cumulativePnL = 0;

    // Daily Win Rate Data
    // We already have dailyPnLMap, but we need Win Rate.
    // Let's create a dailyStatsMap for Win Rate
    const dailyStatsMap = new Map<string, { wins: number; total: number }>();
    filteredEntries.forEach(e => {
        if (!e.exitDate) return;
        const brokerDate = addHours(e.exitDate, BROKER_OFFSET_HOURS);
        const dayStr = brokerDate.toISOString().split('T')[0];

        const current = dailyStatsMap.get(dayStr) || { wins: 0, total: 0 };
        current.total += 1;
        if (e.result === 'WIN') current.wins += 1;
        dailyStatsMap.set(dayStr, current);
    });

    const dailyWinRates = [];

    // Loop days
    const dayIterator = new Date(startDate);
    const stopDate = (endDate > now) ? now : endDate; // Don't project into future

    while (dayIterator <= stopDate) {
        const dayStr = format(dayIterator, "yyyy-MM-dd");
        const daysPnL = dailyPnLMap.get(dayStr) || 0;
        cumulativePnL += daysPnL;

        // Balance Chart Point
        chartPoints.push({
            date: dayIterator.toISOString(), // Component handles formatting
            balance: Number(cumulativePnL.toFixed(2)) // We chart Cumulative PnL
        });

        // Win Rate Chart Point
        const dayStats = dailyStatsMap.get(dayStr) || { wins: 0, total: 0 };
        const dayWinRate = dayStats.total > 0 ? (dayStats.wins / dayStats.total) * 100 : 0;

        dailyWinRates.push({
            date: dayIterator.toISOString(),
            winRate: Number(dayWinRate.toFixed(1)),
            trades: dayStats.total,
            wins: dayStats.wins
        });

        dayIterator.setDate(dayIterator.getDate() + 1);
    }

    // Dashboard Data Object
    const dashboardData = {
        totalBalance, // Current Real Balance
        winRate,
        winRateChange: 0,
        streak: userData?.streak || 0,
        periodPnL, // Replaces todayPnL in importance
        todayPnL,  // Keep for legacy or specific "Today" display if needed
        profitFactor,
        avgWin,
        avgLoss
    };

    const allBadges = Object.values(BADGES).map(b => ({
        id: b.code, code: b.code, name: b.name, description: b.description, icon: b.icon
    }));

    return (
        <DashboardClient
            userData={userData || undefined}
            allBadges={allBadges}
            userName={user.name || "Trader"}
            dashboardData={dashboardData}
            chartData={chartPoints}
            recentActivity={[]} // Deprecated
            recentTrades={filteredEntries}
            symbolPerformance={symbolPerformance}
            currentAccountId={accountId}
            monthlyAnalytics={monthlyAnalyticsData}
            dailyWinRates={dailyWinRates}
            bestTrades={bestTrades}
            worstTrades={worstTrades}
        />
    );
}
