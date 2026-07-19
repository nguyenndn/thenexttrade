"use client";

import { useState, useEffect } from "react";

import { toast } from "sonner";
import {
    Clock,
    Globe,
    Sun,
    Moon,
    TrendingUp,
    TrendingDown,
    Loader2,
} from "lucide-react";
import dynamic from "next/dynamic";
import { SessionRecommendations } from "./SessionRecommendations";
import { useSearchParams } from "next/navigation";
import { EmptyState } from "@/components/ui/EmptyState";
import { EmptyStateCTAs } from "@/components/ui/EmptyStateCTAs";

const SessionPerformance = dynamic(
    () => import("./SessionPerformance").then((m) => m.SessionPerformance),
    {
        loading: () => (
            <div className="h-[400px] bg-gray-50 dark:bg-white/5 animate-pulse rounded-xl" />
        ),
        ssr: false,
    }
);

const HourlyHeatmap = dynamic(
    () => import("./HourlyHeatmap").then((m) => m.HourlyHeatmap),
    {
        loading: () => (
            <div className="h-[200px] bg-gray-50 dark:bg-white/5 animate-pulse rounded-xl" />
        ),
        ssr: false,
    }
);

const SessionClock = dynamic(
    () => import("./SessionClock").then((m) => m.SessionClock),
    {
        loading: () => (
            <div className="h-[400px] bg-gray-50 dark:bg-white/5 animate-pulse rounded-xl" />
        ),
        ssr: false,
    }
);

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
    recommendations: {
        type: "positive" | "negative" | "warning" | "neutral";
        text: string;
    }[];
}

export function SessionDashboard() {
    const searchParams = useSearchParams();
    const accountId = searchParams?.get("accountId");
    const fromStr = searchParams?.get("from");
    const toStr = searchParams?.get("to");

    const [data, setData] = useState<SessionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = async (signal: AbortSignal) => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams();

            if (fromStr) params.append("startDate", fromStr);
            if (toStr) params.append("endDate", toStr);
            if (accountId) params.append("accountId", accountId);

            const res = await fetch(`/api/analytics/sessions?${params}`, {
                signal,
            });
            if (!res.ok) throw new Error("Failed to fetch");

            const json = await res.json();
            setData(json);
        } catch (error: any) {
            if (error.name === "AbortError") return;
            console.error(error);
            toast.error(
                error instanceof Error
                    ? error.message
                    : error?.message || "Failed to load session data"
            );
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        const controller = new AbortController();
        fetchData(controller.signal);

        return () => {
            controller.abort();
        };
    }, [fromStr, toStr, accountId]);

    return (
        <div className="space-y-4">
            {isLoading ? (
                <SessionLoadingSkeleton />
            ) : !data || data.sessionStats.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[#1E2028] rounded-xl border-2 border-dashed border-dashboard mt-8">
                    {/* Animated Clock Icon */}
                    <div className="relative w-20 h-20 mb-6 mx-auto">
                        <div className="absolute inset-0 rounded-full bg-primary/10 dark:bg-primary/5 animate-[session-ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
                        <div className="relative w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center animate-[session-float_3s_ease-in-out_infinite]">
                            <Clock
                                size={32}
                                className="text-gray-500 dark:text-gray-300"
                                strokeWidth={1.5}
                            />
                            {/* Rotating hour hand */}
                            <div
                                className="absolute w-0.5 h-4 bg-primary/30 rounded-full origin-bottom animate-[session-hand_8s_linear_infinite]"
                                style={{
                                    bottom: "50%",
                                    left: "calc(50% - 1px)",
                                }}
                            />
                            {/* Sparkle dots */}
                            <div className="absolute -top-2 left-3 w-1.5 h-1.5 rounded-full bg-primary/40 animate-[session-sparkle_2.5s_ease-in-out_infinite_1.2s]" />
                            <div className="absolute -bottom-1 -right-1 w-1 h-1 rounded-full bg-primary/30 animate-[session-sparkle_3s_ease-in-out_infinite_0.8s]" />
                            <div className="absolute top-0 -right-2 w-1 h-1 rounded-full bg-primary/25 animate-[session-sparkle_2s_ease-in-out_infinite_1.5s]" />
                        </div>
                    </div>

                    <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">
                        No Session Data Available
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 px-6 max-w-sm mx-auto mb-2">
                        We rely on the timestamps of your trades to analyze
                        session performance. Log some closed trades to see your
                        optimal trading times.
                    </p>

                    <EmptyStateCTAs />

                    <style jsx>{`
                        @keyframes session-float {
                            0%,
                            100% {
                                transform: translateY(0px);
                            }
                            50% {
                                transform: translateY(-6px);
                            }
                        }
                        @keyframes session-ping {
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
                        @keyframes session-hand {
                            from {
                                transform: rotate(0deg);
                            }
                            to {
                                transform: rotate(360deg);
                            }
                        }
                        @keyframes session-sparkle {
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
            ) : (
                <>
                    {/* AI Insights - Moved to top for visibility */}
                    {data.recommendations.length > 0 && (
                        <SessionRecommendations
                            recommendations={data.recommendations}
                        />
                    )}

                    {/* Quick Stats */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <QuickStatCard
                            label="Best Session"
                            value={
                                data.bestSession
                                    ? data.sessionStats.find(
                                          (s) => s.session === data.bestSession
                                      )?.displayName || ""
                                    : "-"
                            }
                            icon={TrendingUp}
                            color="text-green-500"
                        />
                        <QuickStatCard
                            label="Worst Session"
                            value={
                                data.worstSession
                                    ? data.sessionStats.find(
                                          (s) => s.session === data.worstSession
                                      )?.displayName || ""
                                    : "-"
                            }
                            icon={TrendingDown}
                            color="text-red-500"
                        />
                        <QuickStatCard
                            label="Best Hour"
                            value={
                                data.bestHour !== null
                                    ? `${data.bestHour.toString().padStart(2, "0")}:00 UTC`
                                    : "-"
                            }
                            icon={Sun}
                            color="text-yellow-500"
                        />
                        <QuickStatCard
                            label="Worst Hour"
                            value={
                                data.worstHour !== null
                                    ? `${data.worstHour.toString().padStart(2, "0")}:00 UTC`
                                    : "-"
                            }
                            icon={Moon}
                            color="text-gray-600"
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
        <div className="bg-white dark:bg-[#1E2028] p-4 rounded-xl border border-dashboard shadow-sm transition-shadow hover:shadow-md">
            <div className="flex items-center gap-2 mb-2">
                <div
                    className={`p-1.5 rounded-lg bg-gray-50 dark:bg-white/5 ${color}`}
                >
                    <Icon size={16} />
                </div>
                <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">
                    {label}
                </span>
            </div>
            <p className="text-lg font-bold text-gray-700 dark:text-white truncate">
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
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="h-24 bg-gray-100 dark:bg-white/5 rounded-xl"
                    />
                ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
                <div className="col-span-2 h-80 bg-gray-100 dark:bg-white/5 rounded-xl" />
                <div className="col-span-1 h-80 bg-gray-100 dark:bg-white/5 rounded-xl" />
            </div>
        </div>
    );
}
