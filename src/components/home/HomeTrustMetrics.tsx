"use client";

import { useEffect, useRef, useState } from "react";
import {
    Radio,
    CheckCircle2,
    AlertTriangle,
    Terminal,
    Flame,
    ArrowRight,
    Wifi,
} from "lucide-react";
import { useInView } from "framer-motion";

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
            : 24800;

    const [activeBay, setActiveBay] = useState<number | null>(null);

    return (
        <div className="relative w-full overflow-hidden bg-white dark:bg-transparent pt-0 pb-12 sm:pb-16">
            <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                {/* ========================================================================= */}
                {/* 🚀 THE UNIFIED TRADING COCKPIT CONSOLE & ENERGY PIPELINE                  */}
                {/* ========================================================================= */}
                <div className="relative isolate overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/10 bg-slate-50/80 dark:bg-[#0c0e14]/95 backdrop-blur-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]">
                    {/* Ambient Background Glow Spotlights */}
                    <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-amber-500/10 blur-[90px]" />
                    <div className="pointer-events-none absolute left-1/3 -top-20 h-64 w-64 rounded-full bg-emerald-500/10 blur-[90px]" />
                    <div className="pointer-events-none absolute right-1/3 -top-20 h-64 w-64 rounded-full bg-purple-500/10 blur-[90px]" />
                    <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[90px]" />

                    {/* --------------------------------------------------------------------- */}
                    {/* 1. TOP HUD CONSOLE STATUS BAR                                         */}
                    {/* --------------------------------------------------------------------- */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/[0.08] px-5 py-3.5 sm:px-7 bg-white/70 dark:bg-white/[0.02]">
                        <div className="flex items-center gap-3">
                            <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-gray-700 dark:text-gray-200 tracking-wider">
                                <Terminal size={14} className="text-amber-500 dark:text-gold" />
                                <span>COCKPIT PIPELINE</span>
                                <span className="text-gray-400 dark:text-gray-400">v2.6</span>
                            </div>

                            <span className="hidden sm:inline-block h-3 w-px bg-slate-300 dark:bg-white/10" />

                            <div className="flex items-center gap-2">
                                <span className="relative flex h-2 w-2">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                                </span>
                                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                                    Live Stream Active
                                </span>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 text-[11px] font-mono text-gray-500 dark:text-gray-400">
                            <div className="hidden md:flex items-center gap-1.5">
                                <Wifi size={12} className="text-emerald-500" />
                                <span>EA Latency: 12ms</span>
                            </div>
                            <span className="hidden md:inline-block h-3 w-px bg-slate-300 dark:bg-white/10" />
                            <span className="text-[10px] uppercase font-bold tracking-widest text-gray-600 dark:text-gray-300">
                                Closed-Loop Growth Engine
                            </span>
                        </div>
                    </div>

                    {/* --------------------------------------------------------------------- */}
                    {/* 2. CONTINUOUS LASER ENERGY PIPELINE (Flowing Data Line)               */}
                    {/* --------------------------------------------------------------------- */}
                    <div className="relative h-[2px] w-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                        {/* Flowing Laser Pulse */}
                        <div
                            className="absolute inset-y-0 h-full w-48 bg-gradient-to-r from-transparent via-amber-400 via-emerald-400 via-purple-400 via-blue-400 to-transparent"
                            style={{
                                animation: "laserFlow 4s linear infinite",
                            }}
                        />
                    </div>

                    {/* --------------------------------------------------------------------- */}
                    {/* 3. THE 4 COCKPIT BAYS (4-Stage Pipeline Grid)                         */}
                    {/* --------------------------------------------------------------------- */}
                    <div className="grid grid-cols-1 divide-y divide-slate-200/80 dark:divide-white/[0.08] lg:grid-cols-4 lg:divide-y-0 lg:divide-x">
                        {/* ================================================================= */}
                        {/* BAY 01: REAL-TIME MT5 INGESTION                                   */}
                        {/* ================================================================= */}
                        <div
                            onMouseEnter={() => setActiveBay(1)}
                            onMouseLeave={() => setActiveBay(null)}
                            className={`group relative flex flex-col justify-between p-5 sm:p-6 transition-all duration-300 ${
                                activeBay === 1
                                    ? "bg-amber-500/[0.04] dark:bg-amber-500/[0.03]"
                                    : "hover:bg-slate-100/50 dark:hover:bg-white/[0.01]"
                            }`}
                        >
                            <div>
                                {/* Row 1: Big Latency Metric & Stage Tag on 1 line */}
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white tabular-nums">
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-amber-500 to-yellow-400 dark:from-amber-300 dark:to-yellow-300">
                                            &lt; 1s
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-gold font-mono text-[10px] font-bold uppercase tracking-wider shrink-0">
                                        <span className="font-black">01</span>
                                        <span>Ingestion</span>
                                        <span className="flex h-1.5 w-1.5 rounded-full bg-amber-500 animate-pulse ml-0.5" />
                                    </div>
                                </div>

                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">
                                    Instant MT5 Auto-Sync
                                </h3>
                                <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400 mb-5 font-normal">
                                    Zero manual CSV uploads. Live EA bridge captures every execution event instantly.
                                </p>
                            </div>

                            {/* Cockpit Visual Widget: Sonar Radar & Ticket Scanner */}
                            <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-black/40 p-3.5 space-y-2.5 shadow-xs">
                                <div className="flex items-center justify-between text-[11px] font-mono">
                                    <div className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-bold">
                                        <Radio size={12} className="text-emerald-500 animate-spin" />
                                        <span>Terminal Bridge</span>
                                    </div>
                                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">12ms Ping</span>
                                </div>

                                <div className="flex items-center justify-between rounded-xl bg-slate-50 dark:bg-white/[0.04] px-3 py-2 border border-slate-200/60 dark:border-white/[0.05] text-xs">
                                    <div className="flex items-center gap-2">
                                        <span className="px-1.5 py-0.5 rounded-lg text-[9px] font-black bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                                            BUY
                                        </span>
                                        <span className="font-bold text-gray-900 dark:text-white font-mono">XAUUSD</span>
                                        <span className="text-gray-400 font-mono text-[10px]">0.50</span>
                                    </div>
                                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
                                        +$340.00
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* ================================================================= */}
                        {/* BAY 02: DEEP DATA VAULT INDEXING                                  */}
                        {/* ================================================================= */}
                        <div
                            onMouseEnter={() => setActiveBay(2)}
                            onMouseLeave={() => setActiveBay(null)}
                            className={`group relative flex flex-col justify-between p-5 sm:p-6 transition-all duration-300 ${
                                activeBay === 2
                                    ? "bg-emerald-500/[0.04] dark:bg-emerald-500/[0.03]"
                                    : "hover:bg-slate-100/50 dark:hover:bg-white/[0.01]"
                            }`}
                        >
                            <div>
                                {/* Row 1: Big Count Metric & Stage Tag on 1 line */}
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white tabular-nums">
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-emerald-500 to-teal-400 dark:from-emerald-300 dark:to-teal-300">
                                            <CountUp value={syncedCount} />
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 font-mono text-[10px] font-bold uppercase tracking-wider shrink-0">
                                        <span className="font-black">02</span>
                                        <span>Vault</span>
                                        <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse ml-0.5" />
                                    </div>
                                </div>

                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">
                                    Deep Data Journal
                                </h3>
                                <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400 mb-5 font-normal">
                                    Multi-asset breakdown, session win rates, and drawdown curves automatically compiled.
                                </p>
                            </div>

                            {/* Cockpit Visual Widget: Dual Session Telemetry */}
                            <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-black/40 p-3.5 space-y-2.5 shadow-xs">
                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-mono font-bold">
                                        <span className="text-gray-700 dark:text-gray-300">London Session</span>
                                        <span className="text-emerald-600 dark:text-emerald-400">68% Win Rate</span>
                                    </div>
                                    <div className="h-1.5 w-full rounded-full bg-slate-100 dark:bg-white/10 overflow-hidden">
                                        <div className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 w-[68%]" />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <div className="flex justify-between text-[10px] font-mono font-bold">
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
                        {/* BAY 03: AI PSYCHOLOGY THREAT RADAR                                */}
                        {/* ================================================================= */}
                        <div
                            onMouseEnter={() => setActiveBay(3)}
                            onMouseLeave={() => setActiveBay(null)}
                            className={`group relative flex flex-col justify-between p-5 sm:p-6 transition-all duration-300 ${
                                activeBay === 3
                                    ? "bg-purple-500/[0.04] dark:bg-purple-500/[0.03]"
                                    : "hover:bg-slate-100/50 dark:hover:bg-white/[0.01]"
                            }`}
                        >
                            <div>
                                {/* Row 1: Big Detectors Metric & Stage Tag on 1 line */}
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white tabular-nums">
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-purple-500 to-indigo-400 dark:from-purple-300 dark:to-indigo-300">
                                            10+
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400 font-mono text-[10px] font-bold uppercase tracking-wider shrink-0">
                                        <span className="font-black">03</span>
                                        <span>Radar</span>
                                        <span className="flex h-1.5 w-1.5 rounded-full bg-purple-500 animate-pulse ml-0.5" />
                                    </div>
                                </div>

                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">
                                    AI Behavior & Leak Engine
                                </h3>
                                <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400 mb-5 font-normal">
                                    Automated algorithms catch revenge size-ups, loss streaks, and discipline leaks.
                                </p>
                            </div>

                            {/* Cockpit Visual Widget: Optical Threat Alerts */}
                            <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-black/40 p-3.5 space-y-2 shadow-xs">
                                <div className="flex items-center justify-between rounded-xl bg-amber-500/10 border border-amber-500/20 px-2.5 py-1.5 text-[10px] font-mono font-bold text-amber-700 dark:text-amber-300">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <AlertTriangle size={12} className="text-amber-500 shrink-0" />
                                        <span className="truncate">Early BE Exit: -$180</span>
                                    </div>
                                    <span className="text-[9px] uppercase px-1 rounded-lg bg-amber-500/20">Flagged</span>
                                </div>

                                <div className="flex items-center justify-between rounded-xl bg-rose-500/10 border border-rose-500/20 px-2.5 py-1.5 text-[10px] font-mono font-bold text-rose-700 dark:text-rose-300">
                                    <div className="flex items-center gap-1.5 truncate">
                                        <Flame size={12} className="text-rose-500 shrink-0" />
                                        <span className="truncate">Revenge 3.5x Lot</span>
                                    </div>
                                    <span className="text-[9px] uppercase px-1 rounded-lg bg-rose-500/20">Alert</span>
                                </div>
                            </div>
                        </div>

                        {/* ================================================================= */}
                        {/* BAY 04: SYSTEMATIC 10-TRADE ACTION PLAN                           */}
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
                                {/* Row 1: Big Plan Metric & Stage Tag on 1 line */}
                                <div className="flex items-center justify-between gap-2 mb-2">
                                    <div className="text-3xl sm:text-4xl font-black tracking-tight text-gray-900 dark:text-white tabular-nums">
                                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-500 to-cyan-400 dark:from-blue-300 dark:to-cyan-300">
                                            10-Trade
                                        </span>
                                    </div>

                                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-blue-500/10 border border-blue-500/20 text-blue-600 dark:text-blue-400 font-mono text-[10px] font-bold uppercase tracking-wider shrink-0">
                                        <span className="font-black">04</span>
                                        <span>Loop</span>
                                        <span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 animate-pulse ml-0.5" />
                                    </div>
                                </div>

                                <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">
                                    Data-Driven AI Coach
                                </h3>
                                <p className="text-xs leading-relaxed text-gray-600 dark:text-gray-400 mb-5 font-normal">
                                    Converts analytical weaknesses into concrete 10-trade improvement cycles with tracked progress.
                                </p>
                            </div>

                            {/* Cockpit Visual Widget: 10-Step LED Discipline Ladder */}
                            <div className="rounded-xl border border-slate-200/80 dark:border-white/[0.08] bg-white/90 dark:bg-black/40 p-3.5 space-y-2.5 shadow-xs">
                                <div className="flex items-center justify-between text-[10px] font-mono font-bold">
                                    <span className="text-gray-700 dark:text-gray-300 truncate">Wait for H1 Close</span>
                                    <span className="text-blue-600 dark:text-blue-400">8/10 Trades</span>
                                </div>

                                {/* 10 LED Progress Blocks */}
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

                                <div className="flex items-center justify-between text-[10px] font-mono font-bold text-gray-500 dark:text-gray-400 pt-0.5">
                                    <span className="text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <CheckCircle2 size={11} /> 80% Disciplined
                                    </span>
                                    <span className="text-blue-600 dark:text-blue-400">On Track</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --------------------------------------------------------------------- */}
                    {/* 4. BOTTOM CONSOLE TELEMETRY FOOTER                                    */}
                    {/* --------------------------------------------------------------------- */}
                    <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/80 dark:border-white/[0.08] px-5 py-3.5 sm:px-7 bg-white/70 dark:bg-white/[0.02] text-[11px] font-mono text-gray-500 dark:text-gray-400">
                        <div className="flex flex-wrap items-center gap-4 sm:gap-6">
                            <span className="flex items-center gap-1.5 text-gray-700 dark:text-gray-300 font-semibold">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span>BRIDGE: CONNECTED (MT5)</span>
                            </span>
                            <span className="hidden sm:flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                <span>DATA ENGINE: ACTIVE</span>
                            </span>
                            <span className="hidden md:flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                                <span>RADAR SHIELD: ARMED</span>
                            </span>
                            <span className="hidden lg:flex items-center gap-1.5">
                                <span className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                <span>COACH LOOP: RUNNING</span>
                            </span>
                        </div>

                        <div className="flex items-center gap-1 text-amber-600 dark:text-gold font-bold">
                            <span>EXPLORE CAPABILITIES</span>
                            <ArrowRight size={12} />
                        </div>
                    </div>
                </div>
            </section>

            {/* Custom CSS Animation Keyframe for Laser Flow */}
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
