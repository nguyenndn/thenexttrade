"use client";

import {
    Flame,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    Target,
    RefreshCw,
    Sparkles,
    Calendar as CalendarIcon,
    BarChart3,
    BookOpen,
    ChevronRight,
    Clock,
    Trophy,
    Brain,
    CheckCircle2,
    Circle,
    ArrowUpRight,
    ArrowDownRight,
} from "lucide-react";
import Link from "next/link";
import { format } from "date-fns";
import type { BriefingData } from "@/lib/briefing-queries";

// ============================================================================
// HERO INSIGHT — Kept as is, it's unique
// ============================================================================
function HeroInsight({ data }: { data: BriefingData }) {
    const today = format(new Date(), "EEEE, MMMM d, yyyy");
    let headline = "";
    let subtext = "";
    let severity: "positive" | "warning" = "positive";

    if (data.insight) {
        headline = data.insight.title;
        subtext = data.insight.description;
        const warningIcons = ["AlertTriangle", "Target", "RefreshCw"];
        severity = warningIcons.includes(data.insight.icon) ? "warning" : "positive";
    } else {
        headline = "Ready to Trade";
        subtext = "Check the market events and review your plan before your first trade today.";
    }

    const gradientMap = {
        positive: "from-emerald-500/20 via-teal-500/10 to-cyan-500/5 dark:from-emerald-500/25 dark:via-teal-500/15 dark:to-cyan-500/8",
        warning: "from-amber-500/20 via-orange-500/10 to-red-500/5 dark:from-amber-500/25 dark:via-orange-500/15 dark:to-red-500/8",
    };

    const accentColor = severity === "warning" ? "bg-orange-500" : "bg-emerald-500";

    return (
        <div className={`bg-gradient-to-br ${gradientMap[severity]} rounded-2xl p-6 md:p-8 lg:p-10 border border-gray-200/80 dark:border-white/10 col-span-full relative overflow-hidden shadow-sm`}>
            {/* Glow orb */}
            <div className={`absolute -right-16 -top-16 w-72 h-72 ${severity === "warning" ? "bg-orange-400/15" : "bg-emerald-400/15"} rounded-full blur-3xl pointer-events-none animate-pulse`} />
            <div className="absolute right-0 top-0 w-80 h-80 bg-gradient-to-bl from-white/20 dark:from-white/5 to-transparent rounded-bl-full pointer-events-none" />
            {/* Left accent bar */}
            <div className={`absolute left-0 top-6 bottom-6 w-1.5 ${accentColor} rounded-r-full`} />
            <div className="relative z-10 pl-4">
                <div className="flex items-center gap-2.5 mb-4">
                    <div className={`p-1.5 rounded-lg ${severity === "warning" ? "bg-orange-500/15" : "bg-emerald-500/15"}`}>
                        <Brain size={16} className={severity === "warning" ? "text-orange-500" : "text-emerald-600"} />
                    </div>
                    <span className="text-xs font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest">{today}</span>
                </div>
                <h1 className={`text-3xl md:text-4xl font-black tracking-tight mb-3 ${severity === "warning" ? "text-orange-600 dark:text-orange-400" : "text-gray-900 dark:text-white"}`}>
                    {headline}
                </h1>
                <p className="text-base md:text-lg text-gray-700 dark:text-gray-300 leading-relaxed max-w-2xl font-medium">
                    {subtext}
                </p>
                {data.currentStreak.type !== "none" && data.currentStreak.count >= 2 && (
                    <div className="mt-5">
                        {data.currentStreak.type === "win" ? (
                            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 shadow-sm">
                                <Flame size={14} /> {data.currentStreak.count}-win streak
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 shadow-sm">
                                <TrendingDown size={14} /> {data.currentStreak.count}-loss streak
                            </span>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}

// ============================================================================
// YESTERDAY VS AVERAGE — Mini bar chart (UNIQUE to Briefing)
// ============================================================================
function YesterdayVsAvgChart({ data }: { data: BriefingData["yesterdayVsAvg"] }) {
    if (!data.hasData) {
        return (
            <div className="bg-white dark:bg-[#1E2028] rounded-xl p-5 border border-gray-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <BarChart3 size={14} className="text-cyan-500" />
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Yesterday vs Average</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">No trades yesterday.</p>
            </div>
        );
    }

    const wrDelta = data.yesterdayWR - data.avgWR;
    const maxWR = Math.max(data.yesterdayWR, data.avgWR, 1);
    const tradesDelta = data.yesterdayTrades - data.avgDailyTrades;

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl p-5 border border-gray-200 dark:border-white/10 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <BarChart3 size={14} className="text-cyan-500" />
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Yesterday vs Average</span>
                </div>
                {wrDelta !== 0 && (
                    <span className={`flex items-center gap-0.5 text-xs font-bold ${wrDelta > 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {wrDelta > 0 ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
                        {wrDelta > 0 ? "+" : ""}{Math.round(wrDelta)}%
                    </span>
                )}
            </div>

            {/* Win Rate comparison */}
            <div className="space-y-3">
                <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-gray-900 dark:text-white">Yesterday</span>
                        <span className={`font-black ${data.yesterdayWR >= data.avgWR ? "text-emerald-500" : "text-red-500"}`}>
                            {Math.round(data.yesterdayWR)}% WR
                        </span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-700 ${data.yesterdayWR >= data.avgWR ? "bg-emerald-500" : "bg-red-500"}`}
                            style={{ width: `${(data.yesterdayWR / maxWR) * 100}%` }}
                        />
                    </div>
                </div>
                <div>
                    <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-gray-500 dark:text-gray-400">All-time Avg</span>
                        <span className="font-black text-gray-500 dark:text-gray-400">{Math.round(data.avgWR)}% WR</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full bg-gray-300 dark:bg-gray-600 transition-all duration-700"
                            style={{ width: `${(data.avgWR / maxWR) * 100}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Trade count + PnL */}
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-white/5">
                <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">Trades</p>
                    <p className="text-sm font-black text-gray-900 dark:text-white">
                        {data.yesterdayTrades}
                        <span className="text-[10px] text-gray-500 dark:text-gray-400 font-medium ml-1">
                            (avg {data.avgDailyTrades}/day)
                        </span>
                    </p>
                </div>
                <div>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 uppercase font-bold">P&L</p>
                    <p className={`text-sm font-black ${data.yesterdayPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        {data.yesterdayPnl >= 0 ? "+" : ""}{data.yesterdayPnl.toFixed(2)}
                    </p>
                </div>
            </div>
        </div>
    );
}

// ============================================================================
// WEEKLY SPARKLINE — Last 7 trading days (UNIQUE to Briefing)
// ============================================================================
function WeeklySparkline({ results }: { results: BriefingData["weeklyResults"] }) {
    if (results.length === 0) {
        return (
            <div className="bg-white dark:bg-[#1E2028] rounded-xl p-5 border border-gray-200 dark:border-white/10 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                    <TrendingUp size={14} className="text-primary" />
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">7-Day Results</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400">No trades in the last 7 days.</p>
            </div>
        );
    }

    const maxPnl = Math.max(...results.map(r => Math.abs(r.pnl)), 1);
    const totalPnl = results.reduce((s, r) => s + r.pnl, 0);
    const winDays = results.filter(r => r.pnl > 0).length;

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl p-5 border border-gray-200 dark:border-white/10 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-primary" />
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">7-Day Results</span>
                </div>
                <span className={`text-xs font-bold ${totalPnl >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                    {totalPnl >= 0 ? "+" : ""}{totalPnl.toFixed(0)}
                </span>
            </div>

            {/* Bar chart */}
            <div className="flex items-end gap-1.5 h-20">
                {results.map((day, i) => {
                    const height = Math.max(8, (Math.abs(day.pnl) / maxPnl) * 100);
                    const isPositive = day.pnl >= 0;
                    return (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1" title={`${day.date}: ${day.wins}W/${day.losses}L, ${day.pnl >= 0 ? "+" : ""}${day.pnl.toFixed(0)}`}>
                            <div className="w-full flex items-end justify-center" style={{ height: "64px" }}>
                                <div
                                    className={`w-full max-w-[28px] rounded-t-md transition-all duration-500 ${isPositive ? "bg-emerald-500" : "bg-red-500"}`}
                                    style={{ height: `${height}%` }}
                                />
                            </div>
                            <span className="text-[9px] font-bold text-gray-500 dark:text-gray-400">{day.date}</span>
                        </div>
                    );
                })}
            </div>

            {/* Summary */}
            <div className="mt-3 pt-3 border-t border-gray-100 dark:border-white/5 flex items-center gap-4 text-xs">
                <span className="text-gray-600 dark:text-gray-400">
                    <span className="font-black text-emerald-500">{winDays}</span> green / <span className="font-black text-red-500">{results.length - winDays}</span> red days
                </span>
            </div>
        </div>
    );
}

// ============================================================================
// PRE-TRADE CHECKLIST (UNIQUE to Briefing — actionable, not data)
// ============================================================================
function PreTradeChecklist({ hasEvents, focus }: { hasEvents: boolean; focus: string | null }) {
    const items = [
        { text: "Review trading plan for today", icon: BookOpen },
        { text: focus || "Set entry/exit rules before trading", icon: Target },
        { text: hasEvents ? "Check economic calendar — events today" : "No high-impact events. Lower volatility expected", icon: CalendarIcon },
        { text: "Set max loss limit for the day", icon: AlertTriangle },
    ];

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl p-5 border border-gray-200 dark:border-white/10 shadow-sm">
            <div className="flex items-center gap-2 mb-4">
                <CheckCircle2 size={14} className="text-emerald-500" />
                <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Pre-Trade Checklist</span>
            </div>
            <div className="space-y-2.5">
                {items.map((item, i) => {
                    const Icon = item.icon;
                    return (
                        <div key={i} className="flex items-start gap-3 group">
                            <Circle size={14} className="text-gray-300 dark:text-gray-600 mt-0.5 shrink-0 group-hover:text-primary transition-colors" />
                            <span className="text-sm text-gray-700 dark:text-gray-300 leading-snug">{item.text}</span>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

// ============================================================================
// MARKET EVENTS
// ============================================================================
function EventsSection({ events }: { events: BriefingData["todayEvents"] }) {
    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl p-5 border border-gray-200 dark:border-white/10 shadow-sm h-full">
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                    <CalendarIcon size={14} className="text-yellow-500" />
                    <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">Market Events</span>
                </div>
                <Link href="/tools/economic-calendar" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                    Calendar <ChevronRight size={12} />
                </Link>
            </div>
            {events.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400">No high-impact events today.</p>
            ) : (
                <div className="space-y-2">
                    {events.slice(0, 5).map((event, i) => (
                        <div key={i} className="flex items-center gap-3 py-1">
                            <span className={`w-2 h-2 rounded-full shrink-0 ${event.impact === "HIGH" ? "bg-red-500" : event.impact === "MEDIUM" ? "bg-yellow-500" : "bg-emerald-500"}`} />
                            <span className="text-xs font-mono text-gray-600 dark:text-gray-400 w-12 shrink-0">{event.time}</span>
                            <span className="text-[11px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded shrink-0">{event.currency}</span>
                            <span className="text-sm text-gray-700 dark:text-gray-300 truncate">{event.event}</span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}


// ============================================================================
// MAIN
// ============================================================================
export function BriefingClient({ data }: { data: BriefingData }) {
    return (
        <div className="space-y-4 py-2">
            {/* ═══ ROW 1: Hero Insight — full width ═══ */}
            <HeroInsight data={data} />

            {/* ═══ ROW 2: Trade Score — compact strip ═══ */}
            {data.tradeScore !== null && (
                <div className="bg-white dark:bg-[#1E2028] rounded-xl p-5 border border-gray-200 dark:border-white/10 shadow-sm">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Trophy size={16} className="text-cyan-500" />
                            <span className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Trade Score</span>
                        </div>
                        <div className="flex items-center gap-4 flex-1">
                            <span className={`text-3xl font-black ${data.tradeScore < 40 ? "text-red-500" : data.tradeScore < 60 ? "text-orange-500" : data.tradeScore < 75 ? "text-yellow-500" : data.tradeScore < 90 ? "text-blue-500" : "text-emerald-500"}`}>
                                {data.tradeScore}
                            </span>
                            <div className="flex-1 max-w-xs">
                                <div className="w-full h-2.5 bg-gray-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full rounded-full transition-all duration-700 ${data.tradeScore < 40 ? "bg-red-500" : data.tradeScore < 60 ? "bg-orange-500" : data.tradeScore < 75 ? "bg-yellow-500" : data.tradeScore < 90 ? "bg-blue-500" : "bg-emerald-500"}`}
                                        style={{ width: `${data.tradeScore}%` }}
                                    />
                                </div>
                                <p className={`text-xs font-bold mt-1 ${data.tradeScore < 40 ? "text-red-500" : data.tradeScore < 60 ? "text-orange-500" : data.tradeScore < 75 ? "text-yellow-500" : data.tradeScore < 90 ? "text-blue-500" : "text-emerald-500"}`}>
                                    {data.tradeScore < 40 ? "Critical" : data.tradeScore < 60 ? "Needs Work" : data.tradeScore < 75 ? "Average" : data.tradeScore < 90 ? "Good" : "Excellent"}
                                </p>
                            </div>
                        </div>
                        <Link href="/dashboard/intelligence" className="text-xs font-bold text-primary hover:underline flex items-center gap-1 shrink-0">
                            View Details <ChevronRight size={12} />
                        </Link>
                    </div>
                </div>
            )}

            {/* ═══ ROW 3: 4-column Data Grid ═══ */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <YesterdayVsAvgChart data={data.yesterdayVsAvg} />
                <WeeklySparkline results={data.weeklyResults} />
                <EventsSection events={data.todayEvents} />
                <PreTradeChecklist hasEvents={data.todayEvents.length > 0} focus={data.dailyFocus} />
            </div>

            {/* ═══ ROW 4: Action Buttons — standalone, 3 distinct colors ═══ */}
            <div className="flex justify-end gap-2.5">
                <Link href="/dashboard" className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-primary text-white font-bold text-xs hover:bg-primary/90 transition-all hover:shadow-md">
                    <BarChart3 size={14} /> Dashboard
                </Link>
                <Link href="/tools/economic-calendar" className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-amber-500 text-white font-bold text-xs hover:bg-amber-600 transition-all hover:shadow-md">
                    <CalendarIcon size={14} /> Calendar
                </Link>
                <Link href="/dashboard/journal" className="flex items-center gap-1.5 px-5 py-2.5 rounded-lg bg-cyan-500 text-white font-bold text-xs hover:bg-cyan-600 transition-all hover:shadow-md">
                    <BookOpen size={14} /> Journal
                </Link>
            </div>
        </div>
    );
}

