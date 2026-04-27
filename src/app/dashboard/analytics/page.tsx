import { Metadata } from "next";
import { AnalyticsDashboard, AnalyticsData, AnalyticsLoadingSkeleton } from "@/components/analytics/AnalyticsDashboard";
import { DashboardFilter } from "@/components/dashboard/DashboardFilter";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { startOfMonth, endOfMonth, startOfDay, endOfDay, parseISO } from "date-fns";
import { parseLocalStartOfDay, parseLocalEndOfDay } from "@/lib/utils";
import {
    getKeyStats,
    getMonthlyAnalytics,
    getDailyPerformance,
    getSymbolPerformance,
    getDayOfWeekPerformance,
    getCurrentStreak
} from "@/lib/analytics-queries";

import { TabBar } from "@/components/ui/TabBar";
import { PageHeader } from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Analytics | Trading Dashboard",
    description: "Analyze your trading performance",
};

const analyticsTabs = [
    { label: "Analytics", href: "/dashboard/analytics" },
    { label: "Reports", href: "/dashboard/reports" },
    { label: "Mistakes", href: "/dashboard/mistakes" },
    { label: "Intelligence", href: "/dashboard/intelligence" },
];

export default async function AnalyticsPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    const user = await getAuthUser();

    if (!user) {
        redirect("/auth/login");
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

    // Date Range Logic (All-Time by default since Date Filter is removed)
    const startDateParam = resolvedParams?.from as string;
    const endDateParam = resolvedParams?.to as string;

    // Fetch account timezone for date boundary alignment
    let accountTimezone: string | undefined;
    if (accountId) {
        const acc = await prisma.tradingAccount.findFirst({
            where: { id: accountId, userId: user.id },
            select: { timezone: true }
        });
        accountTimezone = acc?.timezone || undefined;
    }

    const startDate = parseLocalStartOfDay(startDateParam, accountTimezone);
    const endDate = parseLocalEndOfDay(endDateParam, accountTimezone);

    return (
        <div className="space-y-4">
            <PageHeader
                title="Analytics"
                description="Analyze your trading performance."
            >
                <DashboardFilter currentAccountId={accountId ?? undefined} hideDateFilter />
            </PageHeader>
            <div id="onborda-analytics-tabs" className="mb-4">
                <TabBar tabs={analyticsTabs} equalWidth />
            </div>
            <Suspense key={JSON.stringify(resolvedParams)} fallback={<AnalyticsLoadingSkeleton />}>
                <AnalyticsDataWrapper 
                    user={user} 
                    accountId={accountId} 
                    startDate={startDate} 
                    endDate={endDate}
                    timezone={accountTimezone}
                />
            </Suspense>
        </div>
    );
}

async function AnalyticsDataWrapper({ user, accountId, startDate, endDate, timezone }: any) {
    // 2. Parallel Data Fetching — ALL queries in one Promise.all
    const [
        stats,
        dailyPerformance,
        pairPerformance,
        dayOfWeekPerformance,
        streak,
        accounts,
        recentTradesRaw,
    ] = await Promise.all([
        getKeyStats(user.id, accountId, startDate, endDate),
        getDailyPerformance(user.id, accountId, startDate, endDate, timezone),
        getSymbolPerformance(user.id, accountId, startDate, endDate),
        getDayOfWeekPerformance(user.id, accountId, startDate, endDate, timezone),
        getCurrentStreak(user.id, accountId),
        prisma.tradingAccount.findMany({
            where: { userId: user.id, ...(accountId ? { id: accountId } : {}) },
            select: { balance: true }
        }),
        prisma.journalEntry.findMany({
            where: {
                userId: user.id,
                status: "CLOSED",
                ...(accountId ? { accountId } : {}),
                exitDate: { gte: startDate, lte: endDate }
            },
            orderBy: { exitDate: "desc" },
            take: 10,
            select: { id: true, symbol: true, type: true, pnl: true, entryDate: true, exitDate: true, result: true }
        }),
    ]);

    // 3. Transform Data
    const currentBalance = accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);
    const totalPeriodPnL = stats.totalPnL;

    // Equity Curve (backtracking from current balance)
    let runningBalance = currentBalance - totalPeriodPnL;
    const equityCurve = dailyPerformance.map((day: any) => {
        runningBalance += day.value;
        return {
            date: day.date,
            balance: Number(runningBalance.toFixed(2)),
            pnl: day.value
        };
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

    // Daily PnL (Format match & Calculate Growth based on previous period balance)
    let rBalance = currentBalance - totalPeriodPnL;
    const dailyPnL = dailyPerformance.map((d: any) => {
        const prevBalance = rBalance;
        rBalance += d.value;
        const growth = prevBalance > 0 ? (d.value / prevBalance) * 100 : 0;
        
        return {
            date: d.date,
            pnl: d.value,
            growth: growth,
            tradeCount: d.tradeCount,
            trades: [] // We don't load nested trades for the calendar view in V1 to save size
        };
    });

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
        <AnalyticsDashboard
            data={data}
            accountId={accountId}
            dateRange={{ start: startDate, end: endDate }}
        />
    );
}
