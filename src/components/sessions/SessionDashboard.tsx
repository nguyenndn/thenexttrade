"use client";

import { useState, useEffect, useCallback } from "react";

import { toast } from "sonner";
import {
    Clock,
    Sun,
    Moon,
    TrendingUp,
    TrendingDown,
    type LucideIcon,
} from "lucide-react";
import dynamic from "next/dynamic";
import { SessionRecommendations } from "./SessionRecommendations";
import { useSearchParams } from "next/navigation";
import { EmptyStateCTAs } from "@/components/ui/EmptyStateCTAs";

const SessionPerformance = dynamic(
    () => import("./SessionPerformance").then((m) => m.SessionPerformance),
    {
        loading: () => (
            <div className="h-[400px] bg-gray-50 dark:bg-white/5 animate-pulse rounded-lg" />
        ),
        ssr: false,
    }
);

const HourlyHeatmap = dynamic(
    () => import("./HourlyHeatmap").then((m) => m.HourlyHeatmap),
    {
        loading: () => (
            <div className="h-[200px] bg-gray-50 dark:bg-white/5 animate-pulse rounded-lg" />
        ),
        ssr: false,
    }
);

const SessionClock = dynamic(
    () => import("./SessionClock").then((m) => m.SessionClock),
    {
        loading: () => (
            <div className="h-[400px] bg-gray-50 dark:bg-white/5 animate-pulse rounded-lg" />
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
    currency?: string;
}

export function SessionDashboard({
    currentAccountId,
}: {
    currentAccountId?: string;
} = {}) {
    const searchParams = useSearchParams();
    const accountId = searchParams?.get("accountId") || currentAccountId;
    const fromStr = searchParams?.get("from");
    const toStr = searchParams?.get("to");

    const [data, setData] = useState<SessionData | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const fetchData = useCallback(
        async (signal: AbortSignal) => {
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
            } catch (error: unknown) {
                if (
                    error instanceof DOMException &&
                    error.name === "AbortError"
                ) {
                    return;
                }
                if (error instanceof Error && error.name === "AbortError") {
                    return;
                }
                toast.error(
                    error instanceof Error
                        ? error.message
                        : "Failed to load session data"
                );
            } finally {
                setIsLoading(false);
            }
        },
        [fromStr, toStr, accountId]
    );

    useEffect(() => {
        const controller = new AbortController();
        fetchData(controller.signal);

        return () => {
            controller.abort();
        };
    }, [fetchData]);

    return (
        <div className="space-y-2 md:space-y-4">
            {isLoading ? (
                <SessionLoadingSkeleton />
            ) : !data || data.sessionStats.length === 0 ? (
                <div className="text-center py-16 bg-white dark:bg-[#1E2028] rounded-xl border-2 border-dashed border-dashboard mt-2 md:mt-8">
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

                    {/* Quick Stats — Mobile Unified 2x2 Matrix (< sm) */}
                    <div className="sm:hidden grid grid-cols-2 rounded-xl border border-dashboard bg-white dark:bg-[#1E2028] shadow-sm overflow-hidden [&>*:nth-child(even)]:border-l [&>*:nth-child(n+3)]:border-t [&>*]:border-dashboard/70 dark:[&>*]:border-white/[0.06]">
                        {[
                            {
                                label: "Best Session",
                                value: data.bestSession
                                    ? data.sessionStats.find(
                                          (s) => s.session === data.bestSession
                                      )?.displayName || ""
                                    : "-",
                                icon: TrendingUp,
                                color: "text-green-500",
                            },
                            {
                                label: "Worst Session",
                                value: data.worstSession
                                    ? data.sessionStats.find(
                                          (s) => s.session === data.worstSession
                                      )?.displayName || ""
                                    : "-",
                                icon: TrendingDown,
                                color: "text-red-500",
                            },
                            {
                                label: "Best Hour",
                                value:
                                    data.bestHour !== null
                                        ? `${data.bestHour.toString().padStart(2, "0")}:00 UTC`
                                        : "-",
                                icon: Sun,
                                color: "text-yellow-500",
                            },
                            {
                                label: "Worst Hour",
                                value:
                                    data.worstHour !== null
                                        ? `${data.worstHour.toString().padStart(2, "0")}:00 UTC`
                                        : "-",
                                icon: Moon,
                                color: "text-gray-600",
                            },
                        ].map((stat) => {
                            const Icon = stat.icon;
                            return (
                                <div
                                    key={stat.label}
                                    className="py-2 px-2.5 min-w-0 flex items-center gap-2"
                                >
                                    <div
                                        className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center bg-gray-50 dark:bg-white/5 ${stat.color}`}
                                    >
                                        <Icon size={15} />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <span className="text-[10px] text-gray-500 dark:text-gray-400 uppercase tracking-wider font-bold block truncate">
                                            {stat.label}
                                        </span>
                                        <p className="text-sm font-bold tabular-nums text-gray-700 dark:text-white truncate">
                                            {stat.value}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Quick Stats — Desktop Grid (>= sm) */}
                    <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-4 sm:gap-4">
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
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-4">
                        <div className="lg:col-span-2">
                            <SessionPerformance
                                data={data.sessionStats}
                                currency={data.currency}
                            />
                        </div>
                        <div className="lg:col-span-1">
                            <SessionClock
                                data={data.sessionStats}
                                currency={data.currency}
                            />
                        </div>
                    </div>

                    {/* Hourly Heatmap */}
                    <HourlyHeatmap
                        data={data.hourlyStats}
                        currency={data.currency}
                    />
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
    icon: LucideIcon;
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
        <div className="space-y-2 md:space-y-4 animate-pulse">
            <div className="h-24 bg-gray-100 dark:bg-white/5 rounded-lg w-full" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div
                        key={i}
                        className="h-24 bg-gray-100 dark:bg-white/5 rounded-lg"
                    />
                ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 md:gap-4">
                <div className="lg:col-span-2 h-80 bg-gray-100 dark:bg-white/5 rounded-lg" />
                <div className="lg:col-span-1 h-80 bg-gray-100 dark:bg-white/5 rounded-lg" />
            </div>
        </div>
    );
}
