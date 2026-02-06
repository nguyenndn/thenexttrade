import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { BADGES } from "@/lib/gamification";
import DashboardClient from "./DashboardClient";
import { cookies } from "next/headers";

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

    // 1. Determine Effective Account ID Logic for Persistence
    const cookieStore = await cookies();
    const lastAccountId = cookieStore.get("last_account_id")?.value;
    const accountId = typeof searchParams?.accountId === 'string' ? searchParams.accountId : lastAccountId;
    const accountFilter = accountId ? { userId: user.id, id: accountId } : { userId: user.id };
    const entryFilter = {
        userId: user.id,
        ...(accountId ? { tradingAccountId: accountId } : {}),
    };

    // Date calculations
    const now = new Date();
    const BROKER_OFFSET_HOURS = 2;
    const startOfCurrentMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const endOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
    const utcMidnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    const startOfToday = new Date(utcMidnight.getTime() - (BROKER_OFFSET_HOURS * 60 * 60 * 1000));
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 7);

    // ============================================
    // OPTIMIZED: Parallel fetch with Promise.all()
    // ============================================
    const [userData, accounts, recentEntries, currentMonthStats, lastMonthStats] = await Promise.all([
        // 1. User Gamification Data
        prisma.user.findUnique({
            where: { id: user.id },
            select: { xp: true, level: true, badges: true, streak: true }
        }),

        // 2. Trading Accounts
        prisma.tradingAccount.findMany({
            where: accountFilter,
            select: { balance: true }
        }),

        // 3. Recent Journal Entries (last 7 days + buffer)
        prisma.journalEntry.findMany({
            where: {
                ...entryFilter,
                exitDate: { gte: new Date(sevenDaysAgo.getTime() - (24 * 60 * 60 * 1000)) }
            },
            orderBy: { exitDate: 'desc' }
        }),

        // 4. Current Month Stats
        prisma.journalEntry.findMany({
            where: {
                ...entryFilter,
                exitDate: { gte: startOfCurrentMonth },
                result: { in: ['WIN', 'LOSS'] }
            },
            select: { result: true, pnl: true, symbol: true }
        }),

        // 5. Last Month Stats
        prisma.journalEntry.groupBy({
            by: ['result'],
            where: {
                ...entryFilter,
                exitDate: { gte: startOfLastMonth, lte: endOfLastMonth },
                result: { in: ['WIN', 'LOSS'] }
            },
            _count: { result: true }
        })
    ]);

    // Total Balance
    const totalBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    // Today's P/L
    const todayEntries = recentEntries.filter(e => e.exitDate && e.exitDate >= startOfToday);
    const todayPnL = todayEntries.reduce((sum, e) => sum + (e.pnl || 0), 0);

    // Win Rate Calculation
    const calculateWinRate = (stats: any[]) => {
        if (stats.length > 0 && 'result' in stats[0] && '_count' in stats[0]) {
            const wins = stats.find(s => s.result === 'WIN')?._count.result || 0;
            const losses = stats.find(s => s.result === 'LOSS')?._count.result || 0;
            const total = wins + losses;
            return total > 0 ? (wins / total) * 100 : 0;
        } else {
            const wins = stats.filter(s => s.result === 'WIN').length;
            const total = stats.length;
            return total > 0 ? (wins / total) * 100 : 0;
        }
    };

    const winRate = calculateWinRate(currentMonthStats);
    const lastMonthWinRate = calculateWinRate(lastMonthStats);
    const winRateChange = winRate - lastMonthWinRate;

    // Pro Metrics (Current Month)
    const wins = currentMonthStats.filter(t => t.result === 'WIN');
    const losses = currentMonthStats.filter(t => t.result === 'LOSS');
    const grossProfit = wins.reduce((sum, t) => sum + (t.pnl || 0), 0);
    const grossLoss = Math.abs(losses.reduce((sum, t) => sum + (t.pnl || 0), 0));
    const profitFactor = grossLoss > 0 ? grossProfit / grossLoss : (grossProfit > 0 ? 999 : 0);
    const avgWin = wins.length > 0 ? grossProfit / wins.length : 0;
    const avgLoss = losses.length > 0 ? grossLoss / losses.length : 0;

    // Symbol Performance for Pie Chart
    const symbolMap = new Map<string, number>();
    currentMonthStats.forEach(t => {
        symbolMap.set(t.symbol, (symbolMap.get(t.symbol) || 0) + 1);
    });
    const symbolPerformance = Array.from(symbolMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, value]) => ({ name, value }));

    // Recent Activity
    const recentActivity = recentEntries.slice(0, 5).map(e => {
        let type = "CLOSE";
        if (e.result === 'WIN') type = "TP";
        if (e.result === 'LOSS') type = "SL";

        const rawDate = e.exitDate || new Date();
        const adjustedDate = new Date(rawDate.getTime() - (BROKER_OFFSET_HOURS * 60 * 60 * 1000));
        const diffMs = now.getTime() - adjustedDate.getTime();

        if (diffMs < 0) {
            return {
                id: e.id, symbol: e.symbol, type,
                title: `${type === 'TP' ? 'Take Profit' : type === 'SL' ? 'Stop Loss' : 'Trade Closed'} on ${e.symbol}`,
                timeAgo: "Just now"
            };
        }

        const diffMins = Math.floor(diffMs / (1000 * 60));
        const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHrs / 24);

        let timeAgo = "Just now";
        if (diffDays > 0) timeAgo = `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        else if (diffHrs > 0) timeAgo = `${diffHrs} hour${diffHrs > 1 ? 's' : ''} ago`;
        else if (diffMins > 0) timeAgo = `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;

        return {
            id: e.id, symbol: e.symbol, type,
            title: `${type === 'TP' ? 'Take Profit' : type === 'SL' ? 'Stop Loss' : 'Trade Closed'} on ${e.symbol}`,
            timeAgo
        };
    });

    // Equity Curve (Last 7 Days)
    const dailyPnLs = new Map<string, number>();
    recentEntries.forEach(e => {
        if (!e.exitDate) return;
        const dayStr = e.exitDate.toLocaleDateString('en-US', { weekday: 'short' });
        dailyPnLs.set(dayStr, (dailyPnLs.get(dayStr) || 0) + (e.pnl || 0));
    });

    const chartDataReversed = [];
    let currentCalcBalance = totalBalance;
    for (let i = 0; i < 7; i++) {
        const d = new Date(now);
        d.setDate(now.getDate() - i);
        const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
        chartDataReversed.push({ name: dayName, balance: currentCalcBalance });
        currentCalcBalance -= dailyPnLs.get(dayName) || 0;
    }
    const chartData = chartDataReversed.reverse();

    const dashboardData = {
        totalBalance,
        winRate,
        winRateChange,
        streak: userData?.streak || 0,
        todayPnL,
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
            chartData={chartData}
            recentActivity={recentActivity}
            recentTrades={recentEntries}
            symbolPerformance={symbolPerformance}
            currentAccountId={accountId}
        />
    );
}
