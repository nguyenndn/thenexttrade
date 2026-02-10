"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { format, startOfMonth, endOfMonth, startOfDay, endOfDay } from "date-fns";
import { toast } from "sonner";
import { BarChart3 } from "lucide-react";

import { KPICards } from "./KPICards";
import { EquityCurve } from "./EquityCurve";
import { ProfitCalendar } from "./ProfitCalendar";
import { PairPerformance } from "./PairPerformance";
import { DayPerformance } from "./DayPerformance";
import { RecentTradesTable } from "./RecentTradesTable";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { AccountSelector } from "@/components/dashboard/AccountSelector";

interface AnalyticsData {
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

export function AnalyticsDashboard() {
    const searchParams = useSearchParams();
    const accountId = searchParams.get("accountId");

    const [data, setData] = useState<AnalyticsData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: startOfDay(new Date()),
        end: endOfDay(new Date()),
    });

    const fetchAnalytics = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                startDate: format(dateRange.start, "yyyy-MM-dd"),
                endDate: format(dateRange.end, "yyyy-MM-dd"),
            });
            if (accountId) params.set("accountId", accountId);

            const res = await fetch(`/api/analytics?${params}`);
            if (!res.ok) throw new Error("Failed to fetch");

            const json = await res.json();
            setData(json);
        } catch (error) {
            toast.error("Failed to load analytics");
            console.error(error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchAnalytics();
    }, [dateRange, accountId]);

    if (isLoading) {
        return <AnalyticsLoadingSkeleton />;
    }

    if (!data) {
        return <AnalyticsEmptyState />;
    }

    return (

        <>
            {/* Header with filters */}
            <div className="flex flex-col gap-4 border-b border-gray-100 dark:border-white/5 pb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                            Analytics
                        </h1>
                    </div>
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto">
                        <DateRangePicker
                            value={dateRange}
                            onChange={setDateRange}
                        />
                        <AccountSelector />
                    </div>
                </div>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-medium pl-4.5">
                    Analyze your trading performance
                </p>
            </div>

            {/* KPI Summary Cards */}
            <KPICards summary={data.summary} />

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EquityCurve data={data.equityCurve} />
                <ProfitCalendar data={data.dailyPnL} />
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PairPerformance data={data.pairPerformance} />
                <DayPerformance data={data.dayOfWeekPerformance} />
            </div>

            {/* Recent Trades */}
            <RecentTradesTable trades={data.recentTrades} />
        </>
    );
}

function AnalyticsLoadingSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-48" />
            <div className="grid grid-cols-5 gap-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="h-28 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
                ))}
            </div>
            <div className="grid grid-cols-2 gap-6">
                <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
                <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
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
            <p className="text-gray-500 text-center max-w-md">
                Start logging trades in your journal to see analytics here.
            </p>
        </div>
    );
}
