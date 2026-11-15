import { Metadata } from "next";
import {
    AnalyticsDashboard,
    AnalyticsData,
    AnalyticsLoadingSkeleton,
} from "@/components/analytics/AnalyticsDashboard";
import { DashboardFilter } from "@/components/dashboard/DashboardFilter";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { parseLocalStartOfDay, parseLocalEndOfDay } from "@/lib/utils";
import {
    convertToUsdEquivalent,
    normalizeCurrencyCode,
} from "@/lib/utils/cent-account";
import { getUserTradingDataState } from "@/lib/trading-data-state";
import {
    getKeyStats,
    getDailyPerformance,
    getSymbolPerformance,
    getDayOfWeekPerformance,
    getCurrentStreak,
} from "@/lib/analytics-queries";

import { TabBar } from "@/components/ui/TabBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { ANALYTICS_TABS } from "@/config/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Performance Analytics & Trade Telemetry | TheNextTrade",
    description:
        "Comprehensive execution metrics, risk-reward ratios, expectancy curves, and behavioral leak analytics.",
};

interface AnalyticsWrapperProps {
    user: { id: string };
    accountId?: string;
    startDate?: Date;
    endDate?: Date;
    timezone?: string;
}

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
    const tradingDataState = await getUserTradingDataState(user.id);

    // 1. Account & Date Filters
    const userAccounts = await prisma.tradingAccount.findMany({
        where: { userId: user.id },
        select: { id: true, timezone: true },
    });

    const rawAccountId =
        typeof resolvedParams?.accountId === "string"
            ? resolvedParams.accountId
            : undefined;
    const normalizedAccountId =
        rawAccountId && rawAccountId !== "all" ? rawAccountId : undefined;

    let accountId: string | undefined;
    if (rawAccountId === "all") {
        accountId = undefined;
    } else if (normalizedAccountId) {
        accountId = userAccounts.some((a) => a.id === normalizedAccountId)
            ? normalizedAccountId
            : undefined;
    } else {
        const cookieStore = await cookies();
        const rawLastAccountId = cookieStore.get("last_account_id")?.value;
        const validLastAccountId =
            rawLastAccountId &&
            userAccounts.some((a) => a.id === rawLastAccountId)
                ? rawLastAccountId
                : undefined;
        const { resolveDefaultAccountId } = await import(
            "@/actions/main-account"
        );
        const resolvedDefault = await resolveDefaultAccountId(
            user.id,
            validLastAccountId
        );
        accountId =
            resolvedDefault &&
            userAccounts.some((a) => a.id === resolvedDefault)
                ? resolvedDefault
                : undefined;
    }

    // Date Range Logic (All-Time by default when omitted)
    const startDateParam =
        typeof resolvedParams?.from === "string"
            ? resolvedParams.from
            : undefined;
    const endDateParam =
        typeof resolvedParams?.to === "string" ? resolvedParams.to : undefined;

    // Resolve account timezone for date boundary alignment
    const accountTimezone = accountId
        ? userAccounts.find((a) => a.id === accountId)?.timezone || undefined
        : undefined;

    const startDate = parseLocalStartOfDay(startDateParam, accountTimezone);
    const endDate = parseLocalEndOfDay(endDateParam, accountTimezone);

    return (
        <div className="space-y-4">
            <PageHeader
                title="Analytics"
                description="Analyze your trading performance."
            >
                {tradingDataState.hasTradeData && (
                    <DashboardFilter
                        currentAccountId={
                            rawAccountId === "all"
                                ? "all"
                                : (accountId ?? undefined)
                        }
                        hideDateFilter
                    />
                )}
            </PageHeader>
            <div id="onborda-analytics-tabs" className="mb-4">
                <TabBar tabs={ANALYTICS_TABS} />
            </div>
            <Suspense
                key={JSON.stringify(resolvedParams)}
                fallback={<AnalyticsLoadingSkeleton />}
            >
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

async function AnalyticsDataWrapper({
    user,
    accountId,
    startDate,
    endDate,
    timezone,
}: AnalyticsWrapperProps) {
    const exitDateFilter =
        startDate || endDate
            ? {
                  exitDate: {
                      ...(startDate ? { gte: startDate } : {}),
                      ...(endDate ? { lte: endDate } : {}),
                  },
              }
            : {};

    // 2. Parallel Data Fetching — ALL queries in one Promise.all
    const [
        stats,
        dailyPerformance,
        pairPerformance,
        dayOfWeekPerformance,
        streak,
        accounts,
        recentTradesRaw,
        postEndTradesRaw,
    ] = await Promise.all([
        getKeyStats(user.id, accountId, startDate, endDate),
        getDailyPerformance(user.id, accountId, startDate, endDate, timezone),
        getSymbolPerformance(user.id, accountId, startDate, endDate),
        getDayOfWeekPerformance(
            user.id,
            accountId,
            startDate,
            endDate,
            timezone
        ),
        getCurrentStreak(user.id, accountId),
        prisma.tradingAccount.findMany({
            where: { userId: user.id, ...(accountId ? { id: accountId } : {}) },
            select: {
                balance: true,
                lastSync: true,
                currency: true,
                server: true,
            },
            orderBy: { createdAt: "asc" },
        }),
        prisma.journalEntry.findMany({
            where: {
                userId: user.id,
                status: "CLOSED",
                ...(accountId ? { accountId } : {}),
                ...exitDateFilter,
            },
            orderBy: { exitDate: "desc" },
            take: 10,
            select: {
                id: true,
                symbol: true,
                type: true,
                pnl: true,
                commission: true,
                swap: true,
                entryDate: true,
                exitDate: true,
                result: true,
                account: {
                    select: {
                        currency: true,
                        server: true,
                    },
                },
            },
        }),
        endDate
            ? prisma.journalEntry.findMany({
                  where: {
                      userId: user.id,
                      status: "CLOSED",
                      ...(accountId ? { accountId } : {}),
                      exitDate: { gt: endDate },
                  },
                  select: {
                      pnl: true,
                      commission: true,
                      swap: true,
                      account: {
                          select: {
                              currency: true,
                              server: true,
                          },
                      },
                  },
              })
            : Promise.resolve([]),
    ]);

    // 3. Transform Data (All-Accounts mode normalizes Cent/FX balances & trades to USD)
    const isMultiAccount = !accountId;
    const resolvedCurrency = isMultiAccount
        ? "USD"
        : normalizeCurrencyCode(accounts[0]?.currency, accounts[0]?.server);

    const currentBalance = isMultiAccount
        ? accounts.reduce(
              (sum, acc) =>
                  sum +
                  convertToUsdEquivalent(
                      acc.balance || 0,
                      acc.currency,
                      acc.server
                  ),
              0
          )
        : accounts.reduce((sum, acc) => sum + (acc.balance || 0), 0);

    // Subtract closed trades realized AFTER endDate so historical date filters show accurate historical equity
    const postPeriodPnL = postEndTradesRaw.reduce((sum, t) => {
        const rawNet = (t.pnl || 0) + (t.commission || 0) + (t.swap || 0);
        return (
            sum +
            (isMultiAccount
                ? convertToUsdEquivalent(
                      rawNet,
                      t.account?.currency,
                      t.account?.server
                  )
                : rawNet)
        );
    }, 0);

    const periodEndBalance = currentBalance - postPeriodPnL;
    const totalPeriodPnL = stats.totalPnL;

    // Equity Curve (backtracking from period-end balance)
    let runningBalance = periodEndBalance - totalPeriodPnL;
    const equityCurve = dailyPerformance.map((day) => {
        runningBalance += day.value;
        return {
            date: day.date,
            balance: Number(runningBalance.toFixed(2)),
            pnl: day.value,
        };
    });

    const recentTrades = recentTradesRaw.map((t) => {
        const scaleVal = (val: number) =>
            isMultiAccount
                ? convertToUsdEquivalent(
                      val,
                      t.account?.currency,
                      t.account?.server
                  )
                : Number(val.toFixed(2));
        const rawGross = t.pnl || 0;
        const rawComm = t.commission || 0;
        const rawSwap = t.swap || 0;
        const rawNet = rawGross + rawComm + rawSwap;

        return {
            id: t.id,
            symbol: t.symbol,
            type: t.type as "BUY" | "SELL",
            grossProfit: scaleVal(rawGross),
            commission: scaleVal(rawComm),
            swap: scaleVal(rawSwap),
            pnl: scaleVal(rawNet),
            entryDate: t.entryDate.toISOString(),
            exitDate: t.exitDate ? t.exitDate.toISOString() : null,
            result: t.result || "BREAK_EVEN",
        };
    });

    // Daily PnL (Format match & Calculate Growth based on previous period balance)
    let rBalance = periodEndBalance - totalPeriodPnL;
    const dailyPnL = dailyPerformance.map((d) => {
        const prevBalance = rBalance;
        rBalance += d.value;
        const growth = prevBalance > 0 ? (d.value / prevBalance) * 100 : 0;

        return {
            date: d.date,
            pnl: d.value,
            growth,
            tradeCount: d.tradeCount,
            trades: [],
        };
    });

    const pairPerfFormatted = pairPerformance.map((p) => ({
        symbol: p.symbol,
        pnl: p.pnl,
        tradeCount: p.trades,
        winRate: p.winRate,
    }));

    // 4. Construct Final Data Object
    const data: AnalyticsData = {
        currency: resolvedCurrency,
        summary: {
            totalTrades: stats.totalTrades,
            winRate: stats.winRate ?? 0,
            profitFactor: stats.profitFactor,
            totalPnL: stats.totalPnL,
            totalCommission: stats.commission,
            totalSwap: stats.swap,
            avgRRR: stats.avgLoss > 0 ? stats.avgWin / stats.avgLoss : 0,
            currentStreak:
                streak.type === "none"
                    ? { type: "win", count: 0 }
                    : (streak as { type: "win" | "loss"; count: number }),
            avgWin: stats.avgWin,
            avgLoss: stats.avgLoss,
        },
        equityCurve,
        dailyPnL,
        pairPerformance: pairPerfFormatted,
        dayOfWeekPerformance,
        recentTrades,
    };

    if (stats.totalTrades === 0) {
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

    // 5. Calculate Psychology Diagnostic & Intraday Heatmap only when closed trades exist
    const { calculatePsychologyDiagnostic } = await import(
        "@/lib/analytics/psychology-engine.server"
    );
    const { computeDataConfidence } = await import(
        "@/lib/insights/data-confidence"
    );

    const latestSyncAt = accounts.reduce<Date | null>((latest, acc) => {
        if (!acc.lastSync) return latest;
        if (!latest) return acc.lastSync;
        return new Date(acc.lastSync) > new Date(latest)
            ? acc.lastSync
            : latest;
    }, null);

    const confidence = computeDataConfidence({
        usableClosedTradeCount: stats.totalTrades,
        sampleSize: stats.totalTrades,
        periodStart: startDate,
        periodEnd: endDate,
        latestSyncAt,
        accountScope: accountId ? [accountId] : [],
    });

    const psychologyData = await calculatePsychologyDiagnostic(
        user.id,
        accountId
    );

    const { TradingPsychologyPanel } = await import(
        "@/components/analytics/TradingPsychologyPanel"
    );
    const { IntradayHeatmapChart } = await import(
        "@/components/analytics/IntradayHeatmapChart"
    );

    return (
        <div className="space-y-6">
            <AnalyticsDashboard
                data={data}
                accountId={accountId}
                dateRange={{ start: startDate, end: endDate }}
            />
            <TradingPsychologyPanel
                data={psychologyData}
                confidence={confidence}
            />
            <IntradayHeatmapChart data={psychologyData.heatmap} />
        </div>
    );
}
