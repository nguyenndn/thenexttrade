"use client";

import {
    AlertTriangle,
    TrendingDown,
    BarChart3,
    Frown,
    Clock,
    Calendar,
    ClipboardCheck,
    ClipboardX as ClipboardXIcon,
    Shield,
    ShieldOff,
    Brain,
    ChevronRight,
    Sparkles,
    Crosshair,
    Lightbulb,
    Gauge,
} from "lucide-react";
import Link from "next/link";
import type { IntelligenceData, Insight, InsightSeverity } from "@/lib/smart-analytics";

// ============================================================================
// ICON MAP
// ============================================================================
const iconMap: Record<string, React.ElementType> = {
    AlertTriangle, TrendingDown, BarChart3, Frown,
    Clock, Calendar, ClipboardCheck,
    ClipboardX: ClipboardXIcon, Shield, ShieldOff,
};

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

    const colorMap: Record<string, { stroke: string; text: string; bg: string }> = {
        emerald: { stroke: "stroke-emerald-500", text: "text-emerald-500", bg: "bg-emerald-500/10" },
        blue: { stroke: "stroke-blue-500", text: "text-blue-500", bg: "bg-blue-500/10" },
        yellow: { stroke: "stroke-yellow-500", text: "text-yellow-500", bg: "bg-yellow-500/10" },
        orange: { stroke: "stroke-orange-500", text: "text-orange-500", bg: "bg-orange-500/10" },
        red: { stroke: "stroke-red-500", text: "text-red-500", bg: "bg-red-500/10" },
        gray: { stroke: "stroke-gray-400", text: "text-gray-500", bg: "bg-gray-500/10" },
    };
    const c = colorMap[tradeScore.color] || colorMap.gray;

    const impactColors = {
        positive: "text-emerald-500", negative: "text-red-500",
        neutral: "text-gray-600 dark:text-gray-300",
    };
    const impactBg = {
        positive: "bg-emerald-500", negative: "bg-red-500",
        neutral: "bg-gray-300 dark:bg-gray-600",
    };

    // ── Risk math ──
    const criticalCount = data.issues.filter(i => i.severity === "critical").length;
    const warningCount = data.issues.filter(i => i.severity === "warning").length;
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

    const riskSummary = criticalCount > 0
        ? `${criticalCount} critical pattern${criticalCount > 1 ? "s" : ""} detected. These are actively hurting your performance.`
        : warningCount > 0
        ? `${warningCount} warning${warningCount > 1 ? "s" : ""} found. Room to improve.`
        : "No significant behavioral risks detected. Keep it up.";

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
            <div className="p-6">
                {/* Responsive grid: 1 col → 2 col → 3 col */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">

                    {/* ═══ COL 1: Score Gauge ═══ */}
                    <div className="flex flex-col items-center justify-center md:border-r md:border-gray-100 md:dark:border-white/5 md:pr-6 lg:pr-8">
                        <div className="flex items-center gap-2 mb-4 self-start">
                            <div className="p-1.5 rounded-lg bg-cyan-500/10">
                                <Brain size={16} className="text-cyan-500" />
                            </div>
                            <h2 className="text-sm font-bold text-gray-700 dark:text-white">Trade Score</h2>
                        </div>

                        <div className="relative w-36 h-36 shrink-0">
                            <svg className="w-full h-full -rotate-90" viewBox="0 0 180 180">
                                <circle cx="90" cy="90" r={radius} fill="none" strokeWidth={strokeWidth} className="stroke-gray-100 dark:stroke-white/5" />
                                <circle
                                    cx="90" cy="90" r={radius} fill="none"
                                    strokeWidth={strokeWidth} strokeLinecap="round"
                                    className={`${c.stroke} transition-all duration-1000 ease-out`}
                                    strokeDasharray={circumference}
                                    strokeDashoffset={circumference - progress}
                                />
                            </svg>
                            <div className="absolute inset-0 flex flex-col items-center justify-center">
                                <span className={`text-4xl font-black ${c.text}`}>{tradeScore.score}</span>
                                <span className="text-xs font-bold text-gray-500">/ 100</span>
                            </div>
                        </div>

                        <span className={`mt-3 px-4 py-1.5 rounded-full text-xs font-bold ${c.bg} ${c.text}`}>
                            {tradeScore.label}
                        </span>
                    </div>

                    {/* ═══ COL 2: Score Breakdown ═══ */}
                    <div className="flex flex-col lg:border-r lg:border-gray-100 lg:dark:border-white/5 lg:pr-8">
                        <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Score Breakdown</h3>
                        <div className="flex-1 space-y-3">
                            {scoreFactors.filter(f => f.value >= 0).map((factor) => (
                                <div key={factor.name} className="flex items-center gap-3">
                                    <span className="text-sm font-medium text-gray-600 dark:text-gray-500 w-28 shrink-0">{factor.name}</span>
                                    <div className="flex-1 h-2 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className={`h-full rounded-full transition-all duration-700 ${impactBg[factor.impact]}`}
                                            style={{ width: `${Math.min(100, factor.name === "Revenge Trades" ? Math.max(0, 100 - factor.value * 10) : Math.round(factor.value))}%` }}
                                        />
                                    </div>
                                    <span className={`text-sm font-black w-14 text-right ${impactColors[factor.impact]}`}>
                                        {factor.name === "Revenge Trades" ? factor.value : `${Math.round(factor.value)}%`}
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
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider">Behavior Risk</h3>
                            </div>
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${riskBg} ${riskColor}`}>
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
                        <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5 grid grid-cols-3 gap-3">
                            <div className="text-center">
                                <p className="text-lg font-black text-gray-700 dark:text-white">{data.issues.length}</p>
                                <p className="text-[11px] font-bold text-gray-500">Issues</p>
                            </div>
                            <div className="text-center">
                                <p className="text-lg font-black text-gray-700 dark:text-white">{data.strengths.length}</p>
                                <p className="text-[11px] font-bold text-gray-500">Strengths</p>
                            </div>
                            <div className="text-center">
                                <p className={`text-lg font-black ${c.text}`}>{tradeScore.score}</p>
                                <p className="text-[11px] font-bold text-gray-500">Score</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// AI RECOMMENDATION — Single actionable advice (UNIQUE to Intelligence)
// ============================================================================
function AIRecommendation({ data }: { data: IntelligenceData }) {
    // Pick the most impactful recommendation from issues
    let recommendation = "";
    let context = "";

    const topIssue = data.issues[0];
    if (topIssue) {
        // Generate specific recommendation based on the issue type
        if (topIssue.id.includes("revenge")) {
            recommendation = "After any loss, wait at least 15 minutes before entering a new trade.";
            context = "Revenge trading is your biggest behavioral risk right now.";
        } else if (topIssue.id.includes("overtrading")) {
            recommendation = "Set a maximum of 3-5 trades per day and stop when you hit the limit.";
            context = "Overtrading tends to erode your edge on high-volume days.";
        } else if (topIssue.id.includes("weak_pair")) {
            recommendation = "Remove your weakest pair from your watchlist for the next 2 weeks.";
            context = "Focusing on your strongest pairs increases consistency.";
        } else if (topIssue.id.includes("emotion")) {
            recommendation = "Log your emotional state before each trade. Avoid trading when stressed or frustrated.";
            context = "Your emotional entries correlate with higher loss rates.";
        } else if (topIssue.id.includes("sl") || topIssue.id.includes("risk")) {
            recommendation = "Always set a stop-loss before entry. No exceptions.";
            context = "Missing stop-losses expose your account to outsized risk.";
        } else if (topIssue.id.includes("plan")) {
            recommendation = "Use a written checklist for every trade: setup, entry, stop, target.";
            context = "Trades without a plan have a significantly lower win rate.";
        } else {
            recommendation = topIssue.description;
            context = topIssue.title;
        }
    } else if (data.strengths.length > 0) {
        const topStrength = data.strengths[0];
        recommendation = `Keep leveraging this: ${topStrength.description}`;
        context = "No critical issues found. Focus on maintaining your strengths.";
    } else {
        recommendation = "Continue following your trading plan consistently.";
        context = "Your patterns look balanced. Stay disciplined.";
    }

    return (
        <div className="bg-gradient-to-br from-cyan-500/5 via-primary/5 to-transparent dark:from-cyan-500/10 dark:via-primary/10 dark:to-transparent rounded-xl p-5 border border-gray-200 dark:border-white/10 col-span-full">
            <div className="flex items-start gap-4">
                <div className="p-2.5 rounded-xl bg-primary/10 shrink-0">
                    <Lightbulb size={20} className="text-primary" />
                </div>
                <div>
                    <span className="text-[11px] font-black text-gray-500 uppercase tracking-widest">This Week&apos;s Focus</span>
                    <p className="text-base font-bold text-gray-700 dark:text-white mt-1 leading-relaxed">
                        {recommendation}
                    </p>
                    <p className="text-xs text-gray-600 dark:text-gray-300 mt-1">{context}</p>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// INSIGHT CARD
// ============================================================================
function InsightCard({ insight }: { insight: Insight }) {
    const Icon = iconMap[insight.icon] || AlertTriangle;

    const severityStyles: Record<InsightSeverity, { border: string; iconBg: string; iconColor: string; badge: string; barColor: string }> = {
        critical: {
            border: "border-red-200 dark:border-red-500/20",
            iconBg: "bg-red-500/10", iconColor: "text-red-500",
            badge: "bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400",
            barColor: "bg-red-500",
        },
        warning: {
            border: "border-yellow-200 dark:border-yellow-500/20",
            iconBg: "bg-yellow-500/10", iconColor: "text-yellow-500",
            badge: "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400",
            barColor: "bg-yellow-500",
        },
        strength: {
            border: "border-emerald-200 dark:border-emerald-500/20",
            iconBg: "bg-emerald-500/10", iconColor: "text-emerald-500",
            badge: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400",
            barColor: "bg-emerald-500",
        },
    };

    const s = severityStyles[insight.severity];
    const severityLabel: Record<InsightSeverity, string> = { critical: "Critical", warning: "Warning", strength: "Strength" };

    return (
        <div className={`bg-white dark:bg-[#1E2028] rounded-xl border ${s.border} shadow-sm hover:shadow-md transition-all group`}>
            <div className={`h-0.5 ${s.barColor} rounded-t-xl`} />
            <div className="p-5">
                <div className="flex items-start gap-4">
                    <div className={`p-2.5 rounded-xl ${s.iconBg} shrink-0`}>
                        <Icon size={20} className={s.iconColor} />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-bold text-gray-700 dark:text-white text-sm">{insight.title}</h3>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${s.badge}`}>{severityLabel[insight.severity]}</span>
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-2 leading-relaxed">{insight.description}</p>
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{insight.metric}</span>
                            {insight.filterUrl && (
                                <Link href={insight.filterUrl} className="text-xs font-bold text-primary hover:underline flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                    View Trades <ChevronRight size={12} />
                                </Link>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// EMPTY STATE
// ============================================================================
function EmptyState({ totalTrades }: { totalTrades: number }) {
    const progress = Math.min(100, (totalTrades / 30) * 100);
    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl p-8 md:p-12 border border-gray-200 dark:border-white/10 shadow-sm text-center">
            <div className="inline-flex items-center justify-center p-4 rounded-xl bg-cyan-500/10 text-cyan-500 mb-6 ring-4 ring-cyan-500/5">
                <Brain size={32} />
            </div>
            <h2 className="text-xl font-bold text-gray-700 dark:text-white mb-2">More Trades Needed</h2>
            <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">
                Complete at least 30 closed trades to unlock Trading Intelligence.
            </p>
            <div className="max-w-xs mx-auto">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-bold text-gray-600">{totalTrades} / 30 trades</span>
                    <span className="text-sm font-bold text-primary">{Math.round(progress)}%</span>
                </div>
                <div className="w-full h-3 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-primary to-cyan-500 rounded-full" style={{ width: `${progress}%` }} />
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// MAIN DASHBOARD
// ============================================================================
export function IntelligenceDashboard({ data }: { data: IntelligenceData }) {
    if (!data.hasEnoughData) {
        return <EmptyState totalTrades={data.totalAnalyzed} />;
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-wrap items-center gap-3 text-sm text-gray-600 dark:text-gray-300">
                <div className="flex items-center gap-1.5">
                    <Crosshair size={14} className="text-primary" />
                    <span>
                        Analyzed <span className="font-bold text-gray-700 dark:text-white">{data.totalAnalyzed.toLocaleString()}</span> trades
                        {data.periodDays > 0 && <span className="text-gray-500"> over {data.periodDays} days</span>}
                    </span>
                </div>
                {data.issues.length > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400">
                        {data.issues.length} {data.issues.length === 1 ? "issue" : "issues"}
                    </span>
                )}
                {data.strengths.length > 0 && (
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400">
                        {data.strengths.length} {data.strengths.length === 1 ? "strength" : "strengths"}
                    </span>
                )}
            </div>

            {/* AI Recommendation — top priority, full width */}
            <AIRecommendation data={data} />

            {/* Unified Score & Risk Panel — full width, 3 columns */}
            <ScoreAndRiskPanel data={data} />

            {/* Insights Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {data.issues.length > 0 && (
                    <div className={data.strengths.length === 0 ? "lg:col-span-2" : ""}>
                        <div className="flex items-center gap-2 mb-3">
                            <AlertTriangle size={16} className="text-red-500" />
                            <h3 className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Issues Detected</h3>
                        </div>
                        <div className="space-y-3">
                            {data.issues.map((insight) => <InsightCard key={insight.id} insight={insight} />)}
                        </div>
                    </div>
                )}
                {data.strengths.length > 0 && (
                    <div className={data.issues.length === 0 ? "lg:col-span-2" : ""}>
                        <div className="flex items-center gap-2 mb-3">
                            <Sparkles size={16} className="text-emerald-500" />
                            <h3 className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Your Strengths</h3>
                        </div>
                        <div className="space-y-3">
                            {data.strengths.map((insight) => <InsightCard key={insight.id} insight={insight} />)}
                        </div>
                    </div>
                )}
                {data.issues.length === 0 && data.strengths.length === 0 && (
                    <div className="lg:col-span-2 bg-white dark:bg-[#1E2028] rounded-xl p-8 border border-gray-200 dark:border-white/10 shadow-sm text-center">
                        <Sparkles size={24} className="text-primary mx-auto mb-3" />
                        <p className="text-gray-600 dark:text-gray-300">No significant patterns detected yet.</p>
                    </div>
                )}
            </div>
        </div>
    );
}

export type { IntelligenceData };
