"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { BarChart3 } from "lucide-react";

import { EquityCurve } from "./EquityCurve";
import { ProfitCalendar } from "./ProfitCalendar";
import { PairPerformance } from "./PairPerformance";
import { DayPerformance } from "./DayPerformance";

export interface AnalyticsData {
    summary: {
        totalTrades: number;
        winRate: number;
        profitFactor: number;
        totalPnL: number;
        avgRRR: number;
        currentStreak: {
            type: 'win' | 'loss';
            count: number;
        };
        avgWin: number;
        avgLoss: number;
    };
    equityCurve: Array<{ date: string; balance: number; pnl: number }>;
    dailyPnL: Array<{
        date: string;
        pnl: number;
        growth: number;
        tradeCount: number;
        trades: Array<{ id: string; symbol: string; type: string; pnl: number; result: string | null }>;
    }>;
    pairPerformance: Array<{ symbol: string; pnl: number; tradeCount: number; winRate: number }>;
    dayOfWeekPerformance: Array<{ day: string; dayIndex: number; pnl: number; tradeCount: number }>;
    recentTrades: Array<{ id: string; symbol: string; type: string; pnl: number; entryDate: string; result: string }>;
}

interface AnalyticsDashboardProps {
    data: AnalyticsData;
    accountId?: string;
    dateRange: {
        start?: Date;
        end?: Date;
    };
}

export function AnalyticsDashboard({ data, accountId, dateRange }: AnalyticsDashboardProps) {
    const isEmpty = !data || data.summary.totalTrades === 0;

    return (
        <div className="space-y-4">

            {isEmpty ? (
                <AnalyticsEmptyState />
            ) : (
                <>
                    {/* Charts Row 1 - Full Width */}
                    <div className="grid grid-cols-1 gap-4">
                        <EquityCurve data={data.equityCurve} />
                        <ProfitCalendar data={data.dailyPnL} equityCurve={data.equityCurve} accountId={accountId || undefined} />
                    </div>

                    {/* Charts Row 2 - Two Columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <PairPerformance data={data.pairPerformance} />
                        <DayPerformance data={data.dayOfWeekPerformance} />
                    </div>
                </>
            )}
        </div>
    );
}

export function AnalyticsLoadingSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
            <div className="grid grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                ))}
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl" />
                <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-xl" />
            </div>
        </div>
    );
}

function AnalyticsEmptyState() {
    return (
        <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                <BarChart3 className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No trading data yet
            </h3>
            <p className="text-gray-600 text-center max-w-md">
                Start logging trades in your journal to see analytics here.
            </p>
        </div>
    );
}
