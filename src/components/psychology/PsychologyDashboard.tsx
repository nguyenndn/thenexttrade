"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { Brain, AlertTriangle, Target, TrendingUp, TrendingDown } from "lucide-react";

import { EmotionPerformanceChart } from "./EmotionPerformanceChart";
import { ConfidenceCorrelation } from "./ConfidenceCorrelation";
import { PlanAdherence } from "./PlanAdherence";
import { TiltIndicators } from "./TiltIndicators";
import { DateRangePicker } from "@/components/ui/DateRangePicker";

interface PsychologyData {
    emotionBeforeStats: Array<{
        emotion: string;
        totalTrades: number;
        winRate: number;
        totalPnL: number;
        avgPnL: number;
    }>;
    emotionAfterStats: Array<{
        emotion: string;
        totalTrades: number;
        winRate: number;
        totalPnL: number;
    }>;
    confidenceCorrelation: Array<{
        level: number;
        winRate: number;
        avgPnL: number;
        tradeCount: number;
    }>;
    planAdherenceStats: {
        followed: { count: number; winRate: number; totalPnL: number };
        notFollowed: { count: number; winRate: number; totalPnL: number };
    };
    tiltIndicators: {
        revengeTradeCount: number;
        fomoTradeCount: number;
        avgPnLAfterLoss: number;
        avgPnLAfterWin: number;
        currentLossStreak: number;
        maxLossStreak: number;
        sizingUpCount: number;
        // NEW indicators
        overtradingDays: number;
        winStreakSizeUp: number;
        notFollowingPlanStreak: number;
    };
}

export function PsychologyDashboard() {
    const [data, setData] = useState<PsychologyData | null>(null);
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

            const res = await fetch(`/api/analytics/psychology?${params}`);
            if (!res.ok) throw new Error("Failed to fetch");

            const json = await res.json();
            setData(json);
        } catch (error) {
            toast.error("Failed to load psychology data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    if (isLoading) {
        return <PsychologyLoadingSkeleton />;
    }

    if (!data) {
        return <PsychologyEmptyState />;
    }

    // Find best emotion for trading
    const bestEmotion = data.emotionBeforeStats.length > 0
        ? data.emotionBeforeStats.reduce((best, current) =>
            current.winRate > best.winRate ? current : best
        )
        : null;

    // Check for tilt warning
    const hasTiltWarning =
        data.tiltIndicators.revengeTradeCount > 0 ||
        data.tiltIndicators.fomoTradeCount > 0 ||
        data.tiltIndicators.sizingUpCount > 0 ||
        data.tiltIndicators.avgPnLAfterLoss < 0 ||
        data.tiltIndicators.winStreakSizeUp > 0;

    return (

        <>
            {/* Header */}
            <div className="flex flex-col gap-4 border-b border-gray-100 dark:border-white/5 pb-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                            Psychology Analysis
                        </h1>
                    </div>
                    <div className="w-full md:w-auto">
                        <DateRangePicker
                            value={dateRange}
                            onChange={setDateRange}
                        />
                    </div>
                </div>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-medium pl-4.5">
                    Understand how emotions affect your trading
                </p>
            </div>

            {/* Tilt Warning Banner */}
            {hasTiltWarning && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-2xl p-4 flex items-start gap-3">
                    <AlertTriangle className="text-red-500 flex-shrink-0 mt-0.5" size={20} />
                    <div className="space-y-1">
                        <h4 className="font-bold text-red-700 dark:text-red-400">
                            Tilt Warning Detected
                        </h4>
                        <ul className="text-sm text-red-600 dark:text-red-300 list-disc list-inside">
                            {data.tiltIndicators.revengeTradeCount > 0 && (
                                <li>You made <strong>{data.tiltIndicators.revengeTradeCount} revenge trade(s)</strong>. Stop and reset.</li>
                            )}
                            {data.tiltIndicators.fomoTradeCount > 0 && (
                                <li><strong>{data.tiltIndicators.fomoTradeCount} FOMO trade(s)</strong> detected. Stick to your plan.</li>
                            )}
                            {data.tiltIndicators.sizingUpCount > 0 && (
                                <li><strong>{data.tiltIndicators.sizingUpCount} trades</strong> with significant size increase after loss (Martingale behavior?).</li>
                            )}
                            {data.tiltIndicators.avgPnLAfterLoss < 0 && (
                                <li>Performance drops after losses. Take a break to reset mental state.</li>
                            )}
                            {/* NEW indicators */}
                            {data.tiltIndicators.winStreakSizeUp > 0 && (
                                <li><strong>{data.tiltIndicators.winStreakSizeUp} trades</strong> with size increase after wins (Overconfidence).</li>
                            )}
                        </ul>
                    </div>
                </div>
            )}

            {/* Key Insight Card */}
            {bestEmotion && (
                <div className="bg-gradient-to-r from-purple-500/10 to-blue-500/10 border border-purple-200 dark:border-purple-500/20 rounded-2xl p-6">
                    <h3 className="text-sm uppercase tracking-wider text-purple-500 font-bold mb-2">
                        Key Insight
                    </h3>
                    <p className="text-lg text-gray-900 dark:text-white">
                        You trade best when feeling <span className="font-bold text-purple-500">{bestEmotion.emotion}</span> with a{" "}
                        <span className="font-bold text-green-500">{bestEmotion.winRate.toFixed(0)}% win rate</span>.
                    </p>
                </div>
            )}

            {/* Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <EmotionPerformanceChart
                    data={data.emotionBeforeStats}
                    title="Performance by Emotion (Before Trade)"
                />
                <ConfidenceCorrelation data={data.confidenceCorrelation} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <PlanAdherence data={data.planAdherenceStats} />
                <TiltIndicators data={data.tiltIndicators} />
            </div>
        </>
    );
}

function PsychologyLoadingSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64" />
            <div className="h-24 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            <div className="grid grid-cols-2 gap-6">
                <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
                <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-2xl" />
            </div>
        </div>
    );
}

function PsychologyEmptyState() {
    return (
        <div className="text-center py-20">
            <Brain size={48} className="mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                No psychology data yet
            </h3>
            <p className="text-gray-500">
                Start tracking emotions when logging trades to see insights here.
            </p>
        </div>
    );
}
