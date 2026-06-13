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
import { EmptyStateCTAs } from "@/components/ui/EmptyStateCTAs";

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

interface PsychologyDashboardProps {
 hasTradeData?: boolean;
}

export function PsychologyDashboard({ hasTradeData = true }: PsychologyDashboardProps) {
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

 // Check if data is truly empty (null OR has no meaningful content)
 const totalEmotionTrades = data
 ? data.emotionBeforeStats.reduce((s, e) => s + e.totalTrades, 0)
 : 0;
 const hasNoMeaningfulData = !data || (
 data.emotionBeforeStats.length === 0 &&
 data.emotionAfterStats.length === 0 &&
 data.confidenceCorrelation.length === 0 &&
 data.emotionTrend.length === 0 &&
 totalEmotionTrades === 0
 );

 if (hasNoMeaningfulData) {
 return (
 <>
 <PageHeader
 title="Psychology Analysis"
 description="Understand how emotions affect your trading"
 mobileFullWidthButton
 >
 {hasTradeData && (
 <DateRangePicker
 value={dateRange}
 onChange={setDateRange}
 />
 )}
 </PageHeader>
 <div className="text-center py-16 bg-white dark:bg-[#1E2028] rounded-xl border-2 border-dashed border-dashboard mt-8">
 {/* Animated Brain Icon */}
 <div className="relative w-20 h-20 mb-6 mx-auto">
 <div className="absolute inset-0 rounded-full bg-indigo-500/10 dark:bg-indigo-500/5 animate-[psych-ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
 <div className="relative w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center animate-[psych-float_3s_ease-in-out_infinite]">
 <Brain size={32} className="text-indigo-500 dark:text-indigo-400" strokeWidth={1.5} />
 {/* Thought bubble dots */}
 <div className="absolute -top-1 right-1 w-2 h-2 rounded-full bg-indigo-400/30 animate-[psych-thought_3s_ease-in-out_infinite]" />
 <div className="absolute -top-3 right-3 w-1.5 h-1.5 rounded-full bg-indigo-400/20 animate-[psych-thought_3s_ease-in-out_infinite_0.3s]" />
 <div className="absolute -top-4 right-5 w-1 h-1 rounded-full bg-indigo-400/15 animate-[psych-thought_3s_ease-in-out_infinite_0.6s]" />
 {/* Sparkle dots */}
 <div className="absolute -top-2 left-3 w-1.5 h-1.5 rounded-full bg-primary/40 animate-[psych-sparkle_2.5s_ease-in-out_infinite_1.2s]" />
 <div className="absolute -bottom-1 -right-1 w-1 h-1 rounded-full bg-primary/30 animate-[psych-sparkle_3s_ease-in-out_infinite_0.8s]" />
 </div>
 </div>

 <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">
 No Psychology Data Yet
 </h3>
 <p className="text-gray-600 dark:text-gray-300 px-6 max-w-sm mx-auto mb-2">
 Start tracking emotions and confidence when logging trades to unlock psychology insights here.
 </p>

 <EmptyStateCTAs />

 <style jsx>{`
 @keyframes psych-float {
 0%, 100% { transform: translateY(0px); }
 50% { transform: translateY(-6px); }
 }
 @keyframes psych-ping {
 0% { transform: scale(1); opacity: 0.3; }
 75%, 100% { transform: scale(1.3); opacity: 0; }
 }
 @keyframes psych-thought {
 0%, 100% { opacity: 0; transform: translateY(0) scale(0.5); }
 50% { opacity: 1; transform: translateY(-4px) scale(1); }
 }
 @keyframes psych-sparkle {
 0%, 100% { opacity: 0; transform: scale(0); }
 50% { opacity: 1; transform: scale(1); }
 }
 `}</style>
 </div>
 </>
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
 <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
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
 <div key={stat.label} className="rounded-xl border border-dashboard bg-white dark:bg-[#151925] p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-default">
 <div className="flex items-center gap-3">
 <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${stat.bg} ${stat.color}`}>
 <Icon size={16} aria-hidden="true" />
 </div>
 <div>
 <p className={`text-xl font-black tabular-nums leading-none ${stat.color}`}>
 {stat.value}
 </p>
 <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-1 uppercase tracking-wider">{stat.label}</p>
 </div>
 </div>
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

 {/* Insight: Emotion + Confidence */}
 {(() => {
 const worstEmotion = data.emotionBeforeStats.length > 1
 ? data.emotionBeforeStats.reduce((w, c) => c.winRate < w.winRate ? c : w)
 : null;
 const bestConfidence = data.confidenceCorrelation.length > 0
 ? data.confidenceCorrelation.reduce((b, c) => c.winRate > b.winRate ? c : b)
 : null;
 if (!worstEmotion && !bestConfidence) return null;
 return (
 <div className="flex flex-wrap gap-3">
 {worstEmotion && bestEmotion && worstEmotion.emotion !== bestEmotion.emotion && (
 <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-200/50 dark:border-amber-500/20 text-xs text-gray-600 dark:text-gray-300">
 <TrendingDown size={14} className="text-amber-500 shrink-0" />
 <span>Avoid trading when <strong className="text-amber-600 dark:text-amber-400">{worstEmotion.emotion}</strong> — only {worstEmotion.winRate.toFixed(0)}% win rate</span>
 </div>
 )}
 {bestConfidence && bestConfidence.tradeCount >= 3 && (
 <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-50 dark:bg-blue-500/10 border border-blue-200/50 dark:border-blue-500/20 text-xs text-gray-600 dark:text-gray-300">
 <Target size={14} className="text-blue-500 shrink-0" />
 <span>Optimal confidence level: <strong className="text-blue-600 dark:text-blue-400">{bestConfidence.level}/10</strong> — {bestConfidence.winRate.toFixed(0)}% win rate</span>
 </div>
 )}
 </div>
 );
 })()}

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 <EmotionTrendChart data={data.emotionTrend} />
 <TradingMoodHeatmap data={data.moodHeatmap} />
 </div>

 {/* Insight: Trend direction */}
 {data.emotionTrend.length >= 2 && (() => {
 const recent = data.emotionTrend[data.emotionTrend.length - 1];
 const prev = data.emotionTrend[data.emotionTrend.length - 2];
 const improving = recent.winRate > prev.winRate;
 return (
 <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 dark:bg-white/5 border border-dashboard/50 text-xs text-gray-600 dark:text-gray-300">
 {improving ? <TrendingUp size={14} className="text-primary shrink-0" /> : <TrendingDown size={14} className="text-red-500 shrink-0" />}
 <span>
 Win rate {improving ? "improved" : "declined"} from {prev.winRate.toFixed(0)}% to <strong className={improving ? "text-primary" : "text-red-500"}>{recent.winRate.toFixed(0)}%</strong> this week
 {recent.dominantEmotion && <> — dominant mood: <strong>{recent.dominantEmotion}</strong></>}
 </span>
 </div>
 );
 })()}

 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 <PlanAdherence data={data.planAdherenceStats} />
 <TiltIndicators data={data.tiltIndicators} />
 </div>

 {/* Insight: Plan adherence impact */}
 {data.planAdherenceStats.followed.count > 0 && data.planAdherenceStats.notFollowed.count > 0 && (() => {
 const diff = data.planAdherenceStats.followed.winRate - data.planAdherenceStats.notFollowed.winRate;
 if (Math.abs(diff) < 1) return null;
 return (
 <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-purple-50 dark:bg-purple-500/10 border border-purple-200/50 dark:border-purple-500/20 text-xs text-gray-600 dark:text-gray-300">
 <ClipboardCheck size={14} className="text-purple-500 shrink-0" />
 <span>
 Following your plan gives <strong className="text-purple-600 dark:text-purple-400">{diff > 0 ? "+" : ""}{diff.toFixed(0)}%</strong> higher win rate
 {diff > 0 ? " — discipline pays off!" : " — review your plan quality"}
 </span>
 </div>
 );
 })()}
 </>
 );
}

function PsychologyLoadingSkeleton() {
 return (
 <div className="space-y-4 animate-pulse">
 <div className="h-8 bg-gray-200 dark:bg-white/5 rounded w-64 mb-8" />
 <div className="h-24 bg-gray-200 dark:bg-white/5 rounded-xl border border-dashboard" />
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 <div className="h-[400px] bg-gray-200 dark:bg-white/5 rounded-xl border border-dashboard" />
 <div className="h-[400px] bg-gray-200 dark:bg-white/5 rounded-xl border border-dashboard" />
 </div>
 <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
 <div className="h-[300px] bg-gray-200 dark:bg-white/5 rounded-xl border border-dashboard" />
 <div className="h-[300px] bg-gray-200 dark:bg-white/5 rounded-xl border border-dashboard" />
 </div>
 </div>
 );
}
