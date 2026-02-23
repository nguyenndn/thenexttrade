"use client";

import { useState, useEffect } from "react";

import { toast } from "sonner";
import { Clock, Globe, Sun, Moon, TrendingUp, TrendingDown, Loader2 } from "lucide-react";
import dynamic from "next/dynamic";
import { SessionRecommendations } from "./SessionRecommendations";
import { useSearchParams } from "next/navigation";
import { DashboardFilter } from "@/components/dashboard/DashboardFilter";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";

const SessionPerformance = dynamic(() => import("./SessionPerformance").then(m => m.SessionPerformance), {
    loading: () => <div className="h-[400px] bg-gray-50 dark:bg-white/5 animate-pulse rounded-xl" />,
    ssr: false
});

const HourlyHeatmap = dynamic(() => import("./HourlyHeatmap").then(m => m.HourlyHeatmap), {
    loading: () => <div className="h-[200px] bg-gray-50 dark:bg-white/5 animate-pulse rounded-xl" />,
    ssr: false
});

const SessionClock = dynamic(() => import("./SessionClock").then(m => m.SessionClock), {
    loading: () => <div className="h-[400px] bg-gray-50 dark:bg-white/5 animate-pulse rounded-xl" />,
    ssr: false
});


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
    recommendations: { type: 'positive' | 'negative' | 'warning' | 'neutral', text: string }[];
}

export function SessionDashboard() {
    const searchParams = useSearchParams();
    const accountId = searchParams?.get("accountId");
    const fromStr = searchParams?.get("from");
    const toStr = searchParams?.get("to");
    
    const [data, setData] = useState<SessionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();

            if (fromStr) params.append("startDate", fromStr);
            if (toStr) params.append("endDate", toStr);
            if (accountId) params.append("accountId", accountId);

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
    }, [fromStr, toStr, accountId]);

    return (
        <div className="space-y-4">
            {/* Header */}
            <PageHeader 
                title="Session Analysis" 
                description="Optimize your trading schedule by analyzing performance across market sessions."
            >
                <DashboardFilter currentAccountId={accountId || undefined} />
            </PageHeader>

            {isLoading ? (
                <SessionLoadingSkeleton />
            ) : !data || data.sessionStats.length === 0 ? (
                <div className="min-h-[60vh] flex items-center justify-center p-8 bg-white dark:bg-[#1E2028] rounded-xl border border-gray-100 dark:border-white/5">
                    <EmptyState 
                        icon={Clock} 
                        title="No Session Data Available" 
                        description="We rely on the timestamps of your trades to analyze session performance. Log some closed trades to see your optimal trading times." 
                    />
                </div>
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
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
        <div className="bg-white dark:bg-[#1E2028] p-4 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm transition-shadow hover:shadow-md">
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
        <div className="space-y-4 animate-pulse">
            <div className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl w-full" />
            <div className="grid grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl" />
                ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 h-80 bg-gray-100 dark:bg-white/5 rounded-xl" />
                <div className="col-span-1 h-80 bg-gray-100 dark:bg-white/5 rounded-xl" />
            </div>
        </div>
    );
}
