"use client";

import { useSearchParams, useRouter } from "next/navigation";
import { format } from "date-fns";
import { BarChart3 } from "lucide-react";
import { EmptyStateCTAs } from "@/components/ui/EmptyStateCTAs";

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
            type: "win" | "loss";
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
        trades: Array<{
            id: string;
            symbol: string;
            type: string;
            pnl: number;
            result: string | null;
        }>;
    }>;
    pairPerformance: Array<{
        symbol: string;
        pnl: number;
        tradeCount: number;
        winRate: number;
    }>;
    dayOfWeekPerformance: Array<{
        day: string;
        dayIndex: number;
        pnl: number;
        tradeCount: number;
    }>;
    recentTrades: Array<{
        id: string;
        symbol: string;
        type: string;
        pnl: number;
        entryDate: string;
        result: string;
    }>;
}

interface AnalyticsDashboardProps {
    data: AnalyticsData;
    accountId?: string;
    dateRange: {
        start?: Date;
        end?: Date;
    };
}

export function AnalyticsDashboard({
    data,
    accountId,
    dateRange,
}: AnalyticsDashboardProps) {
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
                        <ProfitCalendar
                            data={data.dailyPnL}
                            equityCurve={data.equityCurve}
                            accountId={accountId || undefined}
                        />
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
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded-lg w-48" />
            <div className="grid grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                    <div
                        key={i}
                        className="h-28 bg-gray-200 dark:bg-gray-700 rounded-xl"
                    />
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
        <div className="text-center py-16 bg-white dark:bg-[#1E2028] rounded-xl border-2 border-dashed border-dashboard mt-8">
            {/* Animated BarChart Icon */}
            <div className="relative w-20 h-20 mb-6 mx-auto">
                <div className="absolute inset-0 rounded-full bg-primary/10 dark:bg-primary/5 animate-[analytics-ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
                <div className="relative w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center animate-[analytics-float_3s_ease-in-out_infinite]">
                    <BarChart3
                        size={32}
                        className="text-gray-500 dark:text-gray-300"
                        strokeWidth={1.5}
                    />
                    {/* Pulse bars */}
                    <div className="absolute -top-1 right-2 w-1 h-3 rounded-full bg-primary/30 animate-[analytics-bar1_2s_ease-in-out_infinite]" />
                    <div className="absolute -top-2 right-5 w-1 h-4 rounded-full bg-primary/20 animate-[analytics-bar2_2s_ease-in-out_infinite_0.3s]" />
                    <div className="absolute -top-1 right-8 w-1 h-2.5 rounded-full bg-primary/25 animate-[analytics-bar3_2s_ease-in-out_infinite_0.6s]" />
                    {/* Sparkle dots */}
                    <div className="absolute -top-2 -left-1 w-1.5 h-1.5 rounded-full bg-primary/40 animate-[analytics-sparkle_2.5s_ease-in-out_infinite_1.2s]" />
                    <div className="absolute -bottom-1 -right-2 w-1 h-1 rounded-full bg-primary/30 animate-[analytics-sparkle_3s_ease-in-out_infinite_0.8s]" />
                </div>
            </div>

            <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">
                No Trading Data Yet
            </h3>
            <p className="text-gray-600 dark:text-gray-300 px-6 max-w-sm mx-auto mb-2">
                Start logging trades in your journal to unlock powerful
                analytics and performance insights.
            </p>

            <EmptyStateCTAs />

            <style jsx>{`
                @keyframes analytics-float {
                    0%,
                    100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-6px);
                    }
                }
                @keyframes analytics-ping {
                    0% {
                        transform: scale(1);
                        opacity: 0.3;
                    }
                    75%,
                    100% {
                        transform: scale(1.3);
                        opacity: 0;
                    }
                }
                @keyframes analytics-bar1 {
                    0%,
                    100% {
                        height: 12px;
                        opacity: 0.3;
                    }
                    50% {
                        height: 18px;
                        opacity: 0.6;
                    }
                }
                @keyframes analytics-bar2 {
                    0%,
                    100% {
                        height: 16px;
                        opacity: 0.2;
                    }
                    50% {
                        height: 10px;
                        opacity: 0.5;
                    }
                }
                @keyframes analytics-bar3 {
                    0%,
                    100% {
                        height: 10px;
                        opacity: 0.25;
                    }
                    50% {
                        height: 14px;
                        opacity: 0.5;
                    }
                }
                @keyframes analytics-sparkle {
                    0%,
                    100% {
                        opacity: 0;
                        transform: scale(0);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1);
                    }
                }
            `}</style>
        </div>
    );
}
