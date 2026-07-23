"use client";

import {
    TrendingUp,
    Brain,
    ChevronRight,
    Sparkles,
    Crosshair,
    Gauge,
    ArrowUpRight,
    ArrowDownRight,
    Minus,
    Activity,
} from "lucide-react";
import Link from "next/link";
import {
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    AreaChart,
    ReferenceLine,
} from "recharts";
import type {
    IntelligenceData,
    ScoreHistoryPoint,
} from "@/lib/smart-analytics";
import { format, parseISO } from "date-fns";
import { BehavioralRadarChart } from "./BehavioralRadarChart";
import { AiCoachCard } from "./AiCoachCard";
import { BiasProfileWidget } from "@/components/dashboard/BiasProfileWidget";

// ============================================================================
// PERIOD COMPARISON BANNER
// ============================================================================
function PeriodComparison({
    current,
    previous,
    prevDateFrom,
    prevDateTo,
}: {
    current: IntelligenceData;
    previous: IntelligenceData;
    prevDateFrom?: string;
    prevDateTo?: string;
}) {
    if (!previous.hasEnoughData) return null;

    // Format previous period label
    let prevPeriodLabel = "vs previous period";
    if (prevDateFrom && prevDateTo) {
        try {
            const from = format(parseISO(prevDateFrom), "MMM d");
            const to = format(parseISO(prevDateTo), "MMM d, yyyy");
            prevPeriodLabel = from === to ? `vs ${to}` : `vs ${from} – ${to}`;
        } catch {
            prevPeriodLabel = `vs ${prevDateFrom} – ${prevDateTo}`;
        }
    }

    const scoreDelta = current.tradeScore.score - previous.tradeScore.score;
    const issuesDelta = current.issues.length - previous.issues.length;
    const strengthsDelta = current.strengths.length - previous.strengths.length;
    const winRateDelta =
        current.quickStats.winRate - previous.quickStats.winRate;
    const rrDelta = current.quickStats.avgRR - previous.quickStats.avgRR;

    const DeltaBadge = ({
        value,
        invert = false,
        suffix = "",
    }: {
        value: number;
        invert?: boolean;
        suffix?: string;
    }) => {
        const isPositive = invert ? value < 0 : value > 0;
        const displayVal = Math.abs(value);

        if (value === 0) {
            return (
                <span className="inline-flex items-center gap-1 text-sm font-bold text-gray-400 dark:text-gray-500">
                    <Minus size={14} /> 0{suffix}
                </span>
            );
        }

        return (
            <span
                className={`inline-flex items-center gap-0.5 text-sm font-bold ${isPositive ? "text-emerald-500" : "text-red-500"}`}
            >
                {isPositive ? (
                    <ArrowUpRight size={14} />
                ) : (
                    <ArrowDownRight size={14} />
                )}
                {value > 0 ? "+" : "-"}
                {suffix === "%" ? displayVal.toFixed(1) : displayVal}
                {suffix}
            </span>
        );
    };

    const cards = [
        {
            label: "Score",
            value: String(current.tradeScore.score),
            prev: String(previous.tradeScore.score),
            delta: <DeltaBadge value={scoreDelta} />,
            accent: "border-t-indigo-500",
        },
        {
            label: "Win Rate",
            value: `${current.quickStats.winRate.toFixed(1)}%`,
            prev: `${previous.quickStats.winRate.toFixed(1)}%`,
            delta: <DeltaBadge value={winRateDelta} suffix="%" />,
            accent: "border-t-blue-500",
        },
        {
            label: "Risk:Reward",
            value: current.quickStats.avgRR.toFixed(2),
            prev: previous.quickStats.avgRR.toFixed(2),
            delta: <DeltaBadge value={Math.round(rrDelta * 100) / 100} />,
            accent: "border-t-cyan-500",
        },
        {
            label: "Issues",
            value: String(current.issues.length),
            prev: String(previous.issues.length),
            delta: <DeltaBadge value={issuesDelta} invert />,
            accent: "border-t-red-500",
        },
        {
            label: "Strengths",
            value: String(current.strengths.length),
            prev: String(previous.strengths.length),
            delta: <DeltaBadge value={strengthsDelta} />,
            accent: "border-t-emerald-500",
        },
    ];

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-sm p-6">
            <div className="flex items-center gap-2.5 mb-5">
                <div className="p-2 rounded-lg bg-indigo-500/10">
                    <Activity size={18} className="text-indigo-500" />
                </div>
                <div>
                    <h3 className="text-sm font-bold text-gray-700 dark:text-white">
                        Period Comparison
                    </h3>
                    <p className="text-xs text-gray-500">{prevPeriodLabel}</p>
                </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
                {cards.map((card) => (
                    <div
                        key={card.label}
                        className={`text-center p-4 rounded-xl bg-gray-50 dark:bg-white/[0.03] border-t-[3px] ${card.accent} ${
                            card.label === "Strengths"
                                ? "col-span-2 sm:col-span-1"
                                : ""
                        }`}
                    >
                        <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">
                            {card.label}
                        </p>
                        <div className="flex items-center justify-center gap-2 mb-1">
                            <span className="text-2xl font-black text-gray-800 dark:text-white">
                                {card.value}
                            </span>
                            {card.delta}
                        </div>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            was {card.prev}
                        </p>
                    </div>
                ))}
            </div>
        </div>
    );
}

// ============================================================================
// SCORE HISTORY CHART
// ============================================================================
function ScoreHistoryChart({ data }: { data: ScoreHistoryPoint[] }) {
    // Filter out weeks with no trades (score = -1)
    const validData = data.filter((d) => d.score >= 0);

    if (validData.length < 3) return null;

    const chartData = validData.map((d) => ({
        ...d,
        weekLabel: format(parseISO(d.weekStart), "MMM d"),
    }));

    const avgScore = Math.round(
        chartData.reduce((sum, d) => sum + d.score, 0) / chartData.length
    );
    const latestScore = chartData[chartData.length - 1]?.score ?? 0;
    const firstScore = chartData[0]?.score ?? 0;
    const trend = latestScore - firstScore;

    const getScoreColor = (score: number) => {
        if (score >= 75) return "#10B981";
        if (score >= 60) return "#3B82F6";
        if (score >= 40) return "#F59E0B";
        return "#EF4444";
    };

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-violet-500/10">
                        <TrendingUp size={16} className="text-violet-500" />
                    </div>
                    <div>
                        <h3 className="text-sm font-bold text-gray-700 dark:text-white">
                            Score Trend
                        </h3>
                        <p className="text-xs text-gray-500">
                            Weekly score over {validData.length} weeks
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            Average
                        </p>
                        <p className="text-base font-black text-gray-700 dark:text-white">
                            {avgScore}
                        </p>
                    </div>
                    <div className="text-right">
                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">
                            Trend
                        </p>
                        <div className="flex items-center gap-1 justify-end">
                            {trend >= 0 ? (
                                <ArrowUpRight
                                    size={14}
                                    className="text-emerald-500"
                                />
                            ) : (
                                <ArrowDownRight
                                    size={14}
                                    className="text-red-500"
                                />
                            )}
                            <p
                                className={`text-base font-black ${trend >= 0 ? "text-emerald-500" : "text-red-500"}`}
                            >
                                {trend >= 0 ? "+" : ""}
                                {trend}
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient
                                id="scoreGradient"
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="#8B5CF6"
                                    stopOpacity={0.2}
                                />
                                <stop
                                    offset="100%"
                                    stopColor="#8B5CF6"
                                    stopOpacity={0}
                                />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            vertical={false}
                            stroke="rgba(156,163,175,0.1)"
                        />
                        <XAxis
                            dataKey="weekLabel"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fontSize: 11,
                                fill: "#9CA3AF",
                                fontWeight: 500,
                            }}
                            dy={10}
                        />
                        <YAxis
                            domain={[0, 100]}
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fontSize: 11,
                                fill: "#9CA3AF",
                                fontWeight: 500,
                            }}
                            width={40}
                        />
                        <ReferenceLine
                            y={50}
                            stroke="rgba(156,163,175,0.2)"
                            strokeDasharray="3 3"
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0]
                                        .payload as ScoreHistoryPoint & {
                                        weekLabel: string;
                                    };
                                    return (
                                        <div className="bg-white dark:bg-[#1E2028] p-3 border border-dashboard rounded-xl shadow-xl">
                                            <p className="text-[11px] font-bold text-gray-500 uppercase mb-1">
                                                Week of {d.weekLabel}
                                            </p>
                                            <p
                                                className="text-sm font-black"
                                                style={{
                                                    color: getScoreColor(
                                                        d.score
                                                    ),
                                                }}
                                            >
                                                Score: {d.score}
                                            </p>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {d.trades} trades · {d.label}
                                            </p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Area
                            type="monotone"
                            dataKey="score"
                            stroke="#8B5CF6"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#scoreGradient)"
                            animationDuration={1500}
                            dot={(props: any) => {
                                const { cx, cy, payload } = props;
                                return (
                                    <circle
                                        key={`dot-${payload.weekStart}`}
                                        cx={cx}
                                        cy={cy}
                                        r={4}
                                        fill={getScoreColor(payload.score)}
                                        stroke="white"
                                        strokeWidth={2}
                                    />
                                );
                            }}
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}

// ============================================================================
// UNIFIED SCORE & RISK PANEL — Full-width, 3 columns
// ============================================================================
function ScoreAndRiskPanel({ data }: { data: IntelligenceData }) {
    const { tradeScore, scoreFactors } = data;

    // ── Score Gauge math ──
    const radius = 70;
    const strokeWidth = 12;
    const circumference = 2 * Math.PI * radius;
    const progress = (tradeScore.score / 100) * circumference;

    const colorMap: Record<
        string,
        { stroke: string; text: string; bg: string }
    > = {
        emerald: {
            stroke: "stroke-emerald-500",
            text: "text-emerald-500",
            bg: "bg-emerald-500/10",
        },
        blue: {
            stroke: "stroke-blue-500",
            text: "text-blue-500",
            bg: "bg-blue-500/10",
        },
        yellow: {
            stroke: "stroke-yellow-500",
            text: "text-yellow-500",
            bg: "bg-yellow-500/10",
        },
        orange: {
            stroke: "stroke-orange-500",
            text: "text-orange-500",
            bg: "bg-orange-500/10",
        },
        red: {
            stroke: "stroke-red-500",
            text: "text-red-500",
            bg: "bg-red-500/10",
        },
        gray: {
            stroke: "stroke-gray-400",
            text: "text-gray-500",
            bg: "bg-gray-500/10",
        },
    };
    const c = colorMap[tradeScore.color] || colorMap.gray;

    const impactColors = {
        positive: "text-emerald-500",
        negative: "text-red-500",
        neutral: "text-gray-600 dark:text-gray-300",
    };
    const impactBg = {
        positive: "bg-emerald-500",
        negative: "bg-red-500",
        neutral: "bg-gray-300 dark:bg-gray-600",
    };

    // ── Risk math ──
    const criticalCount = data.issues.filter(
        (i) => i.severity === "critical"
    ).length;
    const warningCount = data.issues.filter(
        (i) => i.severity === "warning"
    ).length;
    const riskScore = Math.min(100, criticalCount * 30 + warningCount * 15);
    const healthScore = 100 - riskScore;

    let riskLabel = "Low Risk";
    let riskColor = "text-emerald-500";
    let barColor = "bg-emerald-500";
    let riskBg = "bg-emerald-500/10";
    if (healthScore < 40) {
        riskLabel = "High Risk";
        riskColor = "text-red-500";
        barColor = "bg-red-500";
        riskBg = "bg-red-500/10";
    } else if (healthScore < 70) {
        riskLabel = "Moderate Risk";
        riskColor = "text-yellow-500";
        barColor = "bg-yellow-500";
        riskBg = "bg-yellow-500/10";
    }

    const riskSummary =
        criticalCount > 0
            ? `${criticalCount} critical pattern${criticalCount > 1 ? "s" : ""} detected. These are actively hurting your performance.`
            : warningCount > 0
              ? `${warningCount} warning${warningCount > 1 ? "s" : ""} found. Room to improve.`
              : "No significant behavioral risks detected. Keep it up.";

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-dashboard shadow-sm overflow-hidden">
            <div className="p-4 sm:p-6">
                {/* Responsive grid: 1 col → 2 col → 3 col */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
                    {/* ═══ COL 1: Score Gauge ═══ */}
                    <div className="flex flex-col items-center justify-center md:border-r md:border-dashboard md: md:pr-6 lg:pr-8 pb-4 md:pb-0 border-b md:border-b-0 border-dashboard">
                        <div className="flex items-center gap-2 mb-4 self-start">
                            <div className="p-1.5 rounded-lg bg-cyan-500/10">
                                <Brain size={16} className="text-cyan-500" />
                            </div>
                            <h2 className="text-sm font-bold text-gray-700 dark:text-white">
                                Trade Score
                            </h2>
                        </div>

                        <div className="relative w-28 h-28 sm:w-36 sm:h-36 shrink-0">
                            <svg
                                className="w-full h-full -rotate-90"
                                viewBox="0 0 180 180"
                            >
                                <circle
                                    cx="90"
                                    cy="90"
                                    r={radius}
                                    fill="none"
                                    strokeWidth={strokeWidth}
                                    className="stroke-gray-100 dark:stroke-white/5"
                                />
                                <circle
                                    cx="90"
                                    cy="90"
                                    r={radius}
                                    fill="none"
                                    strokeWidth={strokeWidth}
                                    strokeLinecap="round"
                                    className={`${c.stroke} transition-all duration-1000 ease-out`}
                                    strokeDasharray={circumference}
                                    strokeDashoffset={circumference - progress}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span
                                    className={`text-3xl sm:text-4xl font-black ${c.text}`}
                                >
                                    {tradeScore.score}
                                </span>
                                <span className="text-xs font-bold text-gray-500">
                                    / 100
                                </span>
                            </div>
                        </div>

                        <span
                            className={`mt-3 px-4 py-1.5 rounded-full text-xs font-bold ${c.bg} ${c.text}`}
                        >
                            {tradeScore.label}
                        </span>
                    </div>

                    {/* ═══ COL 2: Score Breakdown ═══ */}
                    <div className="flex flex-col lg:border-r lg:border-dashboard lg: lg:pr-8">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">
                            Score Breakdown
                        </h3>
                        <div className="flex-1 space-y-3">
                            {scoreFactors
                                .filter((f) => f.value >= 0)
                                .map((factor) => (
                                    <div
                                        key={factor.name}
                                        className="flex items-center gap-2 sm:gap-3"
                                    >
                                        <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-500 w-20 sm:w-28 shrink-0">
                                            {factor.name}
                                        </span>
                                        <div className="flex-1 h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full rounded-full transition-all duration-700 ${impactBg[factor.impact]}`}
                                                style={{
                                                    width: `${Math.min(100, factor.name === "Revenge Trades" ? Math.max(0, 100 - factor.value * 10) : Math.round(factor.value))}%`,
                                                }}
                                            />
                                        </div>
                                        <span
                                            className={`text-sm font-black w-14 text-right ${impactColors[factor.impact]}`}
                                        >
                                            {factor.name === "Revenge Trades"
                                                ? factor.value
                                                : `${Math.round(factor.value)}%`}
                                        </span>
                                    </div>
                                ))}
                        </div>
                    </div>

                    {/* ═══ COL 3: Behavior Risk ═══ */}
                    <div className="flex flex-col md:col-span-2 lg:col-span-1">
                        <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                                <Gauge size={16} className="text-primary" />
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">
                                    Behavior Risk
                                </h3>
                            </div>
                            <span
                                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${riskBg} ${riskColor}`}
                            >
                                {riskLabel}
                            </span>
                        </div>

                        {/* Risk gauge bar */}
                        <div className="w-full h-3 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden relative">
                            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-500 via-yellow-500 to-red-500 opacity-20" />
                            <div
                                className={`h-full rounded-full ${barColor} transition-all duration-700 relative z-10`}
                                style={{ width: `${100 - healthScore}%` }}
                            />
                        </div>
                        <div className="flex items-center justify-between mt-1.5 text-[10px] font-bold text-gray-500">
                            <span>Low</span>
                            <span>Moderate</span>
                            <span>High</span>
                        </div>

                        {/* Summary */}
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-4 leading-relaxed flex-1">
                            {riskSummary}
                        </p>

                        {/* Quick stats */}
                        <div className="mt-4 pt-4 border-t border-dashboard grid grid-cols-3 gap-3">
                            <div className="text-center">
                                <p className="text-lg font-black text-gray-700 dark:text-white">
                                    {data.issues.length}
                                </p>
                                <p className="text-[11px] font-bold text-gray-500">
                                    Issues
                                </p>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-black text-gray-700 dark:text-white">
                                    {data.strengths.length}
                                </p>
                                <p className="text-[11px] font-bold text-gray-500">
                                    Strengths
                                </p>
                            </div>
                            <div className="text-center">
                                <p className={`text-lg font-black ${c.text}`}>
                                    {tradeScore.score}
                                </p>
                                <p className="text-[11px] font-bold text-gray-500">
                                    Score
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// AI RECOMMENDATION — Data-driven intelligence brief
// ============================================================================
// ============================================================================
// EMPTY STATE
// ============================================================================
function EmptyState({ totalTrades }: { totalTrades: number }) {
    const progress = Math.min(100, (totalTrades / 30) * 100);
    return (
        <div className="text-center py-16 bg-white dark:bg-[#1E2028] rounded-xl border-2 border-dashed border-dashboard mt-8">
            {/* Animated Brain Icon */}
            <div className="relative w-20 h-20 mb-6 mx-auto">
                <div className="absolute inset-0 rounded-full bg-cyan-500/10 dark:bg-cyan-500/5 animate-[intel-ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
                <div className="relative w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center animate-[intel-float_3s_ease-in-out_infinite]">
                    <Brain
                        size={32}
                        className="text-cyan-500 dark:text-cyan-400"
                        strokeWidth={1.5}
                    />
                    {/* Neural pulse dots */}
                    <div className="absolute -top-1 right-2 w-1.5 h-1.5 rounded-full bg-cyan-400/50 animate-[intel-neuron_2s_ease-in-out_infinite]" />
                    <div className="absolute -bottom-1 left-4 w-1 h-1 rounded-full bg-cyan-400/30 animate-[intel-neuron_2.5s_ease-in-out_infinite_0.5s]" />
                    <div className="absolute top-1 -left-2 w-1 h-1 rounded-full bg-cyan-400/40 animate-[intel-neuron_3s_ease-in-out_infinite_1s]" />
                    {/* Sparkle dots */}
                    <div className="absolute -top-2 left-3 w-1.5 h-1.5 rounded-full bg-primary/40 animate-[intel-sparkle_2.5s_ease-in-out_infinite_1.2s]" />
                    <div className="absolute -bottom-1 -right-1 w-1 h-1 rounded-full bg-primary/30 animate-[intel-sparkle_3s_ease-in-out_infinite_0.8s]" />
                </div>
            </div>

            <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">
                More Trades Needed
            </h3>
            <p className="text-gray-600 dark:text-gray-300 px-6 max-w-sm mx-auto mb-6">
                Complete at least 30 closed trades to unlock Trading
                Intelligence.
            </p>
            <div className="max-w-xs mx-auto mb-6">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-600">
                        {totalTrades} / 30 trades
                    </span>
                    <span className="text-sm font-bold text-primary">
                        {Math.round(progress)}%
                    </span>
                </div>
                <div className="w-full h-3 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-primary to-cyan-500 rounded-full"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
            <Link
                href="/dashboard/journal"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white text-sm font-bold rounded-xl hover:opacity-90 transition-opacity"
            >
                Log a Trade <ChevronRight size={16} />
            </Link>

            <style jsx>{`
                @keyframes intel-float {
                    0%,
                    100% {
                        transform: translateY(0px);
                    }
                    50% {
                        transform: translateY(-6px);
                    }
                }
                @keyframes intel-ping {
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
                @keyframes intel-neuron {
                    0%,
                    100% {
                        opacity: 0;
                        transform: scale(0.5);
                    }
                    50% {
                        opacity: 1;
                        transform: scale(1.2);
                    }
                }
                @keyframes intel-sparkle {
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

// ============================================================================
// MAIN DASHBOARD
// ============================================================================
export function IntelligenceDashboard({
    data,
    previousData,
    scoreHistory,
    accountId,
    timezone,
    dateFrom,
    dateTo,
    prevDateFrom,
    prevDateTo,
}: {
    data: IntelligenceData;
    previousData?: IntelligenceData | null;
    scoreHistory?: ScoreHistoryPoint[];
    accountId?: string;
    timezone?: string;
    dateFrom?: string;
    dateTo?: string;
    prevDateFrom?: string;
    prevDateTo?: string;
}) {
    if (!data.hasEnoughData) {
        return <EmptyState totalTrades={data.totalAnalyzed} />;
    }

    // Format date range for display
    let dateRangeLabel = "";
    if (dateFrom && dateTo) {
        try {
            const from = format(parseISO(dateFrom), "MMM d, yyyy");
            const to = format(parseISO(dateTo), "MMM d, yyyy");
            dateRangeLabel = from === to ? from : `${from} – ${to}`;
        } catch {
            dateRangeLabel = `${dateFrom} – ${dateTo}`;
        }
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 dark:text-gray-300 mb-6">
                <div className="flex items-center gap-1.5">
                    <Crosshair size={14} className="text-primary" />
                    <span>
                        Analyzed{" "}
                        <span className="font-bold text-gray-700 dark:text-white">
                            {data.totalAnalyzed.toLocaleString()}
                        </span>{" "}
                        trades
                        {dateRangeLabel && (
                            <span className="text-gray-500">
                                {" "}
                                · {dateRangeLabel}
                            </span>
                        )}
                        {!dateRangeLabel && data.periodDays > 0 && (
                            <span className="text-gray-500">
                                {" "}
                                over {data.periodDays} days
                            </span>
                        )}
                    </span>
                </div>
            </div>

            {/* TheNextTrade AI Coach */}
            <div className="mb-6">
                <AiCoachCard
                    accountId={accountId}
                    timezone={timezone}
                    dateFrom={dateFrom}
                    dateTo={dateTo}
                />
            </div>

            {/* Insights Grid — Issues + Strengths removed to avoid duplication with EdgeLeakDetector */}
            {data.issues.length === 0 && data.strengths.length === 0 && (
                <div className="bg-white dark:bg-[#1E2028] rounded-xl p-8 border border-dashboard shadow-sm text-center">
                    <Sparkles size={24} className="text-primary mx-auto mb-3" />
                    <p className="text-gray-600 dark:text-gray-300">
                        No significant patterns detected yet.
                    </p>
                </div>
            )}

            {/* Period Comparison — only when previous data available */}
            {previousData && previousData.hasEnoughData && (
                <PeriodComparison
                    current={data}
                    previous={previousData}
                    prevDateFrom={prevDateFrom}
                    prevDateTo={prevDateTo}
                />
            )}

            {/* Unified Score & Risk Panel — full width, 3 columns */}
            <ScoreAndRiskPanel data={data} />

            {/* Radar Charts Grid (50% / 50% split) */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <BehavioralRadarChart data={data} />
                <BiasProfileWidget />
            </div>

            {/* Score History Chart — rendered below as full width if available */}
            {scoreHistory && scoreHistory.length >= 3 && (
                <div className="mt-2">
                    <ScoreHistoryChart data={scoreHistory} />
                </div>
            )}
        </div>
    );
}

export type { IntelligenceData };
