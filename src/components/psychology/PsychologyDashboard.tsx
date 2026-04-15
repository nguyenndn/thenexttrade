"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth } from "date-fns";
import { toast } from "sonner";
import { Brain, AlertTriangle, Target, TrendingUp, TrendingDown, Heart, Star, Sparkles, ClipboardCheck } from "lucide-react";

import { EmotionPerformanceChart } from "./EmotionPerformanceChart";
import { ConfidenceCorrelation } from "./ConfidenceCorrelation";
import { PlanAdherence } from "./PlanAdherence";
import { TiltIndicators } from "./TiltIndicators";
import { EmotionTrendChart } from "./EmotionTrendChart";
import { TradingMoodHeatmap } from "./TradingMoodHeatmap";
import { DateRangePicker } from "@/components/ui/DateRangePicker";
import { PageHeader } from "@/components/ui/PageHeader";
import { ChartEmptyState } from "@/components/ui/ChartEmptyState";

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
        overtradingDays: number;
        winStreakSizeUp: number;
        notFollowingPlanStreak: number;
    };
    emotionTrend: Array<{
        weekStart: string;
        winRate: number;
        avgPnL: number;
        tradeCount: number;
        dominantEmotion: string;
    }>;
    moodHeatmap: Array<{
        day: string;
        slots: Array<{
            slot: string;
            trades: number;
            winRate: number;
            dominantEmotion: string;
        }>;
    }>;
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
        } catch (error: any) {
            toast.error(error instanceof Error ? error.message : (error?.message || "Failed to load psychology data"));
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
        return (
            <div className="py-20">
                <ChartEmptyState
                    title="No psychology data yet"
                    description="Start tracking emotions when logging trades to see insights here."
                />
            </div>
        );
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
            <PageHeader
                title="Psychology Analysis"
                description="Understand how emotions affect your trading"
                mobileFullWidthButton
            >
                <DateRangePicker
                    value={dateRange}
                    onChange={setDateRange}
                />
            </PageHeader>

            {/* Summary Stats Row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    {
                        label: "Emotions Logged",
                        value: `${data.emotionBeforeStats.reduce((s, e) => s + e.totalTrades, 0)}`,
                        sub: "trades with emotion",
                        color: "text-indigo-500",
                        bg: "bg-indigo-50 dark:bg-indigo-500/10",
                        border: "border-t-indigo-500",
                        icon: Heart,
                    },
                    {
                        label: "Most Frequent",
                        value: data.emotionBeforeStats.length > 0
                            ? data.emotionBeforeStats.reduce((a, b) => a.totalTrades > b.totalTrades ? a : b).emotion
                            : "—",
                        sub: "dominant mood",
                        color: "text-amber-500",
                        bg: "bg-amber-50 dark:bg-amber-500/10",
                        border: "border-t-amber-500",
                        icon: Star,
                    },
                    {
                        label: "Best Emotion",
                        value: bestEmotion ? bestEmotion.emotion : "—",
                        sub: bestEmotion ? `${bestEmotion.winRate.toFixed(0)}% win rate` : "need data",
                        color: "text-primary",
                        bg: "bg-primary/10",
                        border: "border-t-primary",
                        icon: Sparkles,
                    },
                    {
                        label: "Plan Adherence",
                        value: `${data.planAdherenceStats.followed.count + data.planAdherenceStats.notFollowed.count > 0
                            ? ((data.planAdherenceStats.followed.count / (data.planAdherenceStats.followed.count + data.planAdherenceStats.notFollowed.count)) * 100).toFixed(0)
                            : 0}%`,
                        sub: `${data.planAdherenceStats.followed.count} followed`,
                        color: "text-purple-500",
                        bg: "bg-purple-50 dark:bg-purple-500/10",
                        border: "border-t-purple-500",
                        icon: ClipboardCheck,
                    },
                ].map((stat) => {
                    const Icon = stat.icon;
                    return (
                        <div key={stat.label} className={`bg-white dark:bg-[#1E2028] p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-all duration-200 border-t-4 ${stat.border}`}>
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`p-3 rounded-xl ${stat.bg}`}>
                                    <Icon size={20} className={stat.color} />
                                </div>
                                <h3 className="text-gray-600 text-xs font-bold uppercase tracking-wider">{stat.label}</h3>
                            </div>
                            <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                            <p className="text-xs text-gray-500 font-medium mt-1">{stat.sub}</p>
                        </div>
                    );
                })}
            </div>

            {/* Tilt Warning Banner */}
            {hasTiltWarning && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl px-4 py-3 flex gap-3 items-start">
                    <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={16} />
                    <div className="space-y-1 w-full">
                        <h4 className="text-sm font-bold text-red-700 dark:text-red-400">
                            Tilt Warning Detected
                        </h4>
                        <ul className="text-xs text-red-600 dark:text-red-300 list-disc list-inside space-y-0.5">
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
                            {data.tiltIndicators.winStreakSizeUp > 0 && (
                                <li><strong>{data.tiltIndicators.winStreakSizeUp} trades</strong> with size increase after wins (Overconfidence).</li>
                            )}
                        </ul>
                    </div>
                </div>
            )}

            {/* Key Insight Card */}
            {bestEmotion && (
                <div className="bg-gradient-to-r from-primary/10 to-transparent border border-primary/20 rounded-xl px-4 py-3 flex items-center gap-3">
                    <span className="text-[10px] uppercase tracking-widest text-primary font-black shrink-0">Key Insight</span>
                    <p className="text-sm text-gray-700 dark:text-gray-200">
                        You trade best when feeling <span className="font-bold text-primary">{bestEmotion.emotion}</span> with a{" "}
                        <span className="font-bold text-green-500">{bestEmotion.winRate.toFixed(0)}% win rate</span>.
                    </p>
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <EmotionPerformanceChart
                    data={data.emotionBeforeStats}
                    title="Performance by Emotion (Before Trade)"
                />
                <ConfidenceCorrelation data={data.confidenceCorrelation} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <EmotionTrendChart data={data.emotionTrend} />
                <TradingMoodHeatmap data={data.moodHeatmap} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <PlanAdherence data={data.planAdherenceStats} />
                <TiltIndicators data={data.tiltIndicators} />
            </div>
        </>
    );
}

function PsychologyLoadingSkeleton() {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="h-8 bg-gray-200 dark:bg-white/5 rounded w-64 mb-8" />
            <div className="h-24 bg-gray-200 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10" />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="h-[400px] bg-gray-200 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10" />
                <div className="h-[400px] bg-gray-200 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="h-[300px] bg-gray-200 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10" />
                <div className="h-[300px] bg-gray-200 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10" />
            </div>
        </div>
    );
}
