"use client";

import { useEffect, useRef, useState } from "react";
import {
    Zap,
    CheckCircle2,
    AlertTriangle,
    Flame,
    ArrowRight,
    TrendingUp,
    ShieldAlert,
    Sparkles,
    BarChart3,
} from "lucide-react";
import { useInView } from "framer-motion";
import Link from "next/link";

interface TrustMetricsProps {
    metrics?: {
        tradingGuides?: number;
        academyLessons?: number;
        connectedAccounts?: number;
        syncedTrades?: number;
        coachReports?: number;
    };
}

export function HomeTrustMetrics({ metrics }: TrustMetricsProps) {
    const syncedCount =
        metrics?.syncedTrades && metrics.syncedTrades > 0
            ? metrics.syncedTrades
            : 26400;

    const [activeBay, setActiveBay] = useState<number | null>(null);

    return (
        <div className="relative w-full overflow-hidden bg-white dark:bg-transparent pt-0 pb-12 sm:pb-16">
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* ========================================================================= */}
                {/* 🚀 THE PRO TRADER WORKFLOW COCKPIT                                       */}
                {/* ========================================================================= */}
                <div className="relative isolate overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/10 bg-slate-50/80 dark:bg-[#0c0e14]/95 backdrop-blur-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]">
                    {/* Ambient Background Glow Spotlights */}
                    <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-amber-500/10 blur-[90px]" />
                    <div className="pointer-events-none absolute left-1/3 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-[90px]" />
                    <div className="pointer-events-none absolute right-1/3 -top-20 h-64 w-64 rounded-full bg-purple-500/10 blur-[90px]" />
                    <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[90px]" />

                    {/* --------------------------------------------------------------------- */}
                    {/* 1. TOP PRO TRADER STATUS BAR                                          */}
                    {/* --------------------------------------------------------------------- */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/[0.08] px-5 py-3.5 sm:px-7 bg-white/70 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-100 tracking-wide">
                                <div className="w-5 h-5 rounded-md bg-amber-500/15 text-amber-600 dark:text-gold flex items-center justify-center">
                                    <Zap size={13} />
                                </div>
                                <span className="uppercase text-[11px] font-extrabold tracking-wider">
                                    The Pro Trader Workflow
                                </span>
                            </div>

                            <span className="hidden sm:inline-block h-3.5 w-px bg-slate-300 dark:bg-white/10" />

                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    Zero Manual Entry · Live Cloud Sync
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400 font-medium">
                            <span className="hidden md:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[11px] font-bold">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                                MT5 Connected
                            </span>
                            <span className="hidden md:inline-block h-3 w-px bg-slate-300 dark:bg-white/10" />
                            <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-300">
                                Complete Trading System
                            </span>
                        </div>
                    </div>

                    {/* --------------------------------------------------------------------- */}
                    {/* 2. CONTINUOUS PROGRESS ENERGY ACCENT                                 */}
                    {/* --------------------------------------------------------------------- */}
                    <div className="relative h-[2px] w-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        <div
                            className="absolute inset-y-0 h-full w-48 bg-gradient-to-r from-transparent via-amber-400 via-emerald-400 via-purple-400 via-blue-400 to-transparent"
                            style={{
                                animation: "laserFlow 4s linear infinite",
                            }}
                        />
                    </div>

                    {/* --------------------------------------------------------------------- */}
                    {/* 3. THE 4 STAGES OF A DISCIPLINED PRO TRADER                           */}
                    {/* --------------------------------------------------------------------- */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 divide-slate-200/80 dark:divide-white/[0.08] lg:divide-x">
                        {/* ================================================================= */}
                        {/* STEP 01: REAL-TIME MT5 AUTO-SYNC                                  */}
                        {/* ================================================================= */}
                        <div
                            onMouseEnter={() => setActiveBay(1)}
                            onMouseLeave={() => setActiveBay(null)}
                            className={`group relative flex flex-col justify-between p-5 sm:p-6 sm:border-b sm:border-r lg:border-b-0 border-slate-200/80 dark:border-white/[0.08] transition-all duration-300 ${
                                activeBay === 1
                                    ? "bg-amber-500/[0.04] dark:bg-amber-500/[0.03]"
                                    : "hover:bg-slate-100/50 dark:hover:bg-white/[0.01]"
                            }`}
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-yellow-500 dark:from-amber-300 dark:to-yellow-300">
                                            100% Auto
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-gold text-[10px] font-bold uppercase tracking-wider shrink-0">
                                        <span className="font-extrabold">STEP 01</span>
                                        <span>Sync</span>
                                        <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse ml-0.5" />
                                    </div>
                                </div>

                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">
                                    Seamless MT5 Sync
                                </h3>
                                <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400 mb-5 font-normal">
                                    Trade Manager EA streams every MT5 trade, SL/TP change, and partial close directly to your journal in real time.
                                </p>
                            </div>

                            {/* Live Trade Preview Card */}
                            <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-black/40 p-3.5 space-y-2.5 shadow-xs">
                                <div className="flex items-center justify-between text-[11px]">
                                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-bold">
                                        <Zap size={13} className="text-emerald-500" />
                                        <span>Instant Ingestion</span>
                                    </div>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold text-[10px] bg-emerald-500/10 px-2 py-0.5 rounded-md">
                                        Verified
                                    </span>
                                </div>

                                <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-white/[0.04] px-3 py-2 border border-slate-200/60 dark:border-white/[0.05] text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                            BUY
                                        </span>
                                        <span className="font-bold text-gray-900 dark:text-white">XAUUSD</span>
                                        <span className="text-gray-400 text-[11px]">0.50 Lot</span>
                                    </div>
                                    <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                        +$340.00
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ================================================================= */}
                        {/* STEP 02: AUTOMATED PERFORMANCE JOURNAL                            */}
                        {/* ================================================================= */}
                        <div
                            onMouseEnter={() => setActiveBay(2)}
                            onMouseLeave={() => setActiveBay(null)}
                            className={`group relative flex flex-col justify-between p-5 sm:p-6 sm:border-b lg:border-b-0 border-slate-200/80 dark:border-white/[0.08] transition-all duration-300 ${
                                activeBay === 2
                                    ? "bg-emerald-500/[0.04] dark:bg-emerald-500/[0.03]"
                                    : "hover:bg-slate-100/50 dark:hover:bg-white/[0.01]"
                            }`}
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white tabular-nums">
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-400 dark:from-emerald-300 dark:to-teal-300">
                                            <CountUp value={syncedCount} />
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
                                        <span className="font-extrabold">STEP 02</span>
                                        <span>Journal</span>
                                        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                                    </div>
                                </div>

                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">
                                    Automated Trade Journal
                                </h3>
                                <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400 mb-5 font-normal">
                                    Multi-asset breakdown, session win rates, and equity curves compiled automatically to reveal your true edge.
                                </p>
                            </div>

                            {/* Session Win Rate Telemetry */}
                            <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-black/40 p-3.5 space-y-2.5 shadow-xs">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] font-bold">
                                        <span className="text-gray-700 dark:text-gray-300">London Session</span>
                                        <span className="text-emerald-600 dark:text-emerald-400">68% Win Rate</span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 w-[68%]" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-[11px] font-bold">
                                        <span className="text-gray-700 dark:text-gray-300">New York Session</span>
                                        <span className="text-teal-600 dark:text-teal-400">54% Win Rate</span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                                        <div className="h-full rounded-full bg-gradient-to-r from-teal-500 to-cyan-400 w-[54%]" />
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ================================================================= */}
                        {/* STEP 03: PSYCHOLOGY & LEAK RADAR                                  */}
                        {/* ================================================================= */}
                        <div
                            onMouseEnter={() => setActiveBay(3)}
                            onMouseLeave={() => setActiveBay(null)}
                            className={`group relative flex flex-col justify-between p-5 sm:p-6 sm:border-r lg:border-b-0 border-slate-200/80 dark:border-white/[0.08] transition-all duration-300 ${
                                activeBay === 3
                                    ? "bg-purple-500/[0.04] dark:bg-purple-500/[0.03]"
                                    : "hover:bg-slate-100/50 dark:hover:bg-white/[0.01]"
                            }`}
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-400 dark:from-purple-300 dark:to-indigo-300">
                                            10+ Leaks
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
                                        <span className="font-extrabold">STEP 03</span>
                                        <span>Radar</span>
                                        <span className="flex h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse ml-0.5" />
                                    </div>
                                </div>

                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">
                                    Psychology & Risk Radar
                                </h3>
                                <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400 mb-5 font-normal">
                                    Early-warning detection spots revenge sizing, FOMO entries, moving SL prematurely, and discipline leaks.
                                </p>
                            </div>

                            {/* Behavioral Threat Alerts */}
                            <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-black/40 p-3.5 space-y-2 shadow-xs">
                                <div className="flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 text-[11px] font-bold text-amber-700 dark:text-amber-300">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <AlertTriangle size={13} className="text-amber-500 shrink-0" />
                                        <span className="truncate">Early BE Exit: -$180</span>
                                    </div>
                                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-md bg-amber-500/20 font-bold">Flagged</span>
                                </div>

                                <div className="flex items-center justify-between rounded-xl bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 text-[11px] font-bold text-rose-700 dark:text-rose-300">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <Flame size={13} className="text-rose-500 shrink-0" />
                                        <span className="truncate">Revenge 3.5x Lot</span>
                                    </div>
                                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded-md bg-rose-500/20 font-bold">Alert</span>
                                </div>
                            </div>
                        </div>

                        {/* ================================================================= */}
                        {/* STEP 04: 10-TRADE ACTION COACH                                    */}
                        {/* ================================================================= */}
                        <div
                            onMouseEnter={() => setActiveBay(4)}
                            onMouseLeave={() => setActiveBay(null)}
                            className={`group relative flex flex-col justify-between p-5 sm:p-6 transition-all duration-300 ${
                                activeBay === 4
                                    ? "bg-blue-500/[0.04] dark:bg-blue-500/[0.03]"
                                    : "hover:bg-slate-100/50 dark:hover:bg-white/[0.01]"
                            }`}
                        >
                            <div>
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white">
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-400 dark:from-blue-300 dark:to-cyan-300">
                                            10-Trade
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider shrink-0">
                                        <span className="font-extrabold">STEP 04</span>
                                        <span>Coach</span>
                                        <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse ml-0.5" />
                                    </div>
                                </div>

                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">
                                    10-Trade Action Coach
                                </h3>
                                <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400 mb-5 font-normal">
                                    Converts analytical weaknesses into concrete 10-trade improvement cycles to build rock-solid discipline.
                                </p>
                            </div>

                            {/* 10-Trade Habit Ladder */}
                            <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-black/40 p-3.5 space-y-2.5 shadow-xs">
                                <div className="flex items-center justify-between text-[11px] font-bold">
                                    <span className="text-gray-700 dark:text-gray-300 truncate">Wait for H1 Close</span>
                                    <span className="text-blue-600 dark:text-blue-400">8/10 Trades</span>
                                </div>

                                <div className="grid grid-cols-10 gap-1">
                                    {Array.from({ length: 10 }).map((_, idx) => (
                                        <div
                                            key={idx}
                                            className={`h-2 rounded-full transition-all duration-300 ${
                                                idx < 8
                                                    ? "bg-blue-500 shadow-[0_0_6px_rgba(59,130,246,0.6)]"
                                                    : "bg-slate-200 dark:bg-white/10"
                                            }`}
                                        />
                                    ))}
                                </div>

                                <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 dark:text-gray-400 pt-0.5">
                                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1 text-[10px]">
                                        <CheckCircle2 size={12} /> 80% Disciplined
                                    </span>
                                    <span className="text-blue-600 dark:text-blue-400 text-[10px]">On Track</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --------------------------------------------------------------------- */}
                    {/* 4. BOTTOM VALUE FLOW FOOTER                                           */}
                    {/* --------------------------------------------------------------------- */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/80 dark:border-white/[0.08] px-5 py-3.5 sm:px-7 bg-white/70 dark:bg-white/[0.02] text-xs text-gray-600 dark:text-gray-400">
                        <div className="flex flex-wrap items-center gap-3 sm:gap-6 font-semibold">
                            <span className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                1. Auto-Capture
                            </span>
                            <span className="text-gray-300 dark:text-gray-600">→</span>
                            <span className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                2. Unpack Edge
                            </span>
                            <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">→</span>
                            <span className="hidden sm:flex items-center gap-1.5 text-gray-800 dark:text-gray-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                                3. Stop Leaks
                            </span>
                            <span className="text-gray-300 dark:text-gray-600 hidden md:inline">→</span>
                            <span className="hidden md:flex items-center gap-1.5 text-gray-800 dark:text-gray-200">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                4. Scale with AI Coach
                            </span>
                        </div>

                        <Link
                            href="/dashboard"
                            className="flex items-center gap-1 text-xs text-amber-600 dark:text-gold font-bold hover:underline transition-colors"
                        >
                            <span>Explore Platform</span>
                            <ArrowRight size={13} />
                        </Link>
                    </div>
                </div>
            </section>

            {/* Custom CSS Animation Keyframe for Energy Line */}
            <style jsx>{`
                @keyframes laserFlow {
                    0% {
                        transform: translateX(-100%);
                    }
                    100% {
                        transform: translateX(1000%);
                    }
                }
            `}</style>
        </div>
    );
}

/** Counts up from 0 to `value` once when the strip scrolls into view. */
function CountUp({
    value,
    duration = 900,
}: {
    value: number;
    duration?: number;
}) {
    const ref = useRef<HTMLSpanElement>(null);
    const inView = useInView(ref, { once: true, margin: "-10%" });
    const [display, setDisplay] = useState(0);

    useEffect(() => {
        if (!inView) return;
        let raf = 0;
        const start = performance.now();
        const tick = (now: number) => {
            const progress = Math.min((now - start) / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            setDisplay(Math.round(eased * value));
            if (progress < 1) raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [value, inView, duration]);

    return (
        <span ref={ref}>
            {value >= 1000
                ? `${(display / 1000).toFixed(display >= 10000 ? 0 : 1)}k+`
                : display.toLocaleString("en-US")}
        </span>
    );
}
