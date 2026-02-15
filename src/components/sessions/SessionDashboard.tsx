"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { Clock, Globe, Sun, Moon, TrendingUp, TrendingDown, Loader2 } from "lucide-react";

import { SessionPerformance } from "./SessionPerformance";
import { HourlyHeatmap } from "./HourlyHeatmap";
import { SessionClock } from "./SessionClock";
import { SessionRecommendations } from "./SessionRecommendations";

interface SessionData {
    sessionStats: Array<{
        session: string;
        displayName: string;
        color: string;
        totalTrades: number;
        winRate: number;
        totalPnL: number;
        profitFactor: number;
    }>;
    hourlyStats: Array<{
        hour: number;
        hourLabel: string;
        totalTrades: number;
        winRate: number;
        totalPnL: number;
    }>;
    bestSession: string | null;
    worstSession: string | null;
    bestHour: number | null;
    worstHour: number | null;
    recommendations: string[];
}

export function SessionDashboard() {
    const [data, setData] = useState<SessionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date()),
    });

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                startDate: format(dateRange.start, "yyyy-MM-dd"),
                endDate: format(dateRange.end, "yyyy-MM-dd"),
            });

            const res = await fetch(`/api/analytics/sessions?${params}`);
            if (!res.ok) throw new Error("Failed to fetch");

            const json = await res.json();
            setData(json);
        } catch (error) {
            console.error(error);
            toast.error("Failed to load session data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col gap-2 border-b border-gray-100 dark:border-white/5 pb-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                            Session Analysis
                        </h1>
                    </div>
                </div>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-medium pl-4.5">
                    Optimize your trading schedule by analyzing performance across market sessions.
                </p>
            </div>

            {isLoading ? (
                <SessionLoadingSkeleton />
            ) : !data || data.sessionStats.length === 0 ? (
                <SessionEmptyState />
            ) : (
                <>
                    {/* AI Insights - Moved to top for visibility */}
                    {data.recommendations.length > 0 && (
                        <SessionRecommendations recommendations={data.recommendations} />
                    )}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <QuickStatCard
                            label="Best Session"
                            value={data.bestSession ? data.sessionStats.find(s => s.session === data.bestSession)?.displayName || "" : "-"}
                            icon={TrendingUp}
                            color="text-green-500"
                        />
                        <QuickStatCard
                            label="Worst Session"
                            value={data.worstSession ? data.sessionStats.find(s => s.session === data.worstSession)?.displayName || "" : "-"}
                            icon={TrendingDown}
                            color="text-red-500"
                        />
                        <QuickStatCard
                            label="Best Hour"
                            value={data.bestHour !== null ? `${data.bestHour.toString().padStart(2, '0')}:00 UTC` : "-"}
                            icon={Sun}
                            color="text-yellow-500"
                        />
                        <QuickStatCard
                            label="Worst Hour"
                            value={data.worstHour !== null ? `${data.worstHour.toString().padStart(2, '0')}:00 UTC` : "-"}
                            icon={Moon}
                            color="text-gray-500"
                        />
                    </div>

                    {/* Main Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2">
                            <SessionPerformance data={data.sessionStats} />
                        </div>
                        <div className="lg:col-span-1">
                            <SessionClock data={data.sessionStats} />
                        </div>
                    </div>

                    {/* Hourly Heatmap */}
                    <HourlyHeatmap data={data.hourlyStats} />
                </>
            )}
        </div>
    );
}

function QuickStatCard({
    label,
    value,
    icon: Icon,
    color,
}: {
    label: string;
    value: string;
    icon: any;
    color: string;
}) {
    return (
        <div className="bg-white dark:bg-[#1E2028] p-4 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
                <div className={`p-1.5 rounded-lg bg-gray-50 dark:bg-white/5 ${color}`}>
                    <Icon size={16} />
                </div>
                <span className="text-xs text-gray-400 uppercase tracking-wider font-bold">
                    {label}
                </span>
            </div>
            <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
                {value}
            </p>
        </div>
    );
}

function SessionLoadingSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl w-full" />
            <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl" />
                ))}
            </div>
            <div className="grid grid-cols-3 gap-6">
                <div className="col-span-2 h-80 bg-gray-100 dark:bg-white/5 rounded-xl" />
                <div className="col-span-1 h-80 bg-gray-100 dark:bg-white/5 rounded-xl" />
            </div>
        </div>
    );
}

function SessionEmptyState() {
    return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center bg-white dark:bg-[#1E2028] rounded-xl border border-gray-100 dark:border-white/5">
            <div className="w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center mb-6 text-gray-400">
                <Clock size={40} />
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                No Session Data Available
            </h3>
            <p className="text-gray-500 max-w-md mx-auto mb-8">
                We rely on the timestamps of your trades to analyze session performance. Log some closed trades to see your optimal trading times.
            </p>
        </div>
    );
}
