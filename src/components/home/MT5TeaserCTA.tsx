"use client";

import React from "react";
import Link from "next/link";
import {
    Bot,
    SlidersHorizontal,
    Shield,
    ArrowRight,
    CheckCircle2,
    HelpCircle,
    Zap,
    Layers,
    Activity,
} from "lucide-react";
import { Button } from "@/components/ui/Button";

interface MT5TeaserCTAProps {
    isLoggedIn?: boolean;
}

const TRADING_SYSTEM_ITEMS = [
    {
        title: "EA GoldScalperNinja",
        tag: "AUTOMATED EA",
        tagColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
        icon: Bot,
        iconColor: "text-amber-500 bg-amber-500/10 border-amber-500/20",
        desc: "Automated XAUUSD execution with D1 Trend Master & Smart Pruning.",
        badges: [
            { label: "Target", value: "1.5R" },
            { label: "Trailing", value: "Auto" },
            { label: "Risk Guard", value: "1%" },
        ],
    },
    {
        title: "GSN Trade Manager",
        tag: "EXECUTION & SYNC",
        tagColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
        icon: SlidersHorizontal,
        iconColor: "text-blue-500 bg-blue-500/10 border-blue-500/20",
        desc: "1-click order panel with automatic journal sync & risk automation.",
        badges: [
            { label: "Auto SL/TP", value: "Instant" },
            { label: "Smart BE", value: "Active" },
            { label: "Sync", value: "12ms" },
        ],
    },
    {
        title: "GSN Phoenix Grid",
        tag: "RECOVERY ENGINE",
        tagColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
        icon: Shield,
        iconColor: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20",
        desc: "Adaptive grid & hedge recovery system built for exposure protection.",
        badges: [
            { label: "Max DD", value: "5%" },
            { label: "DCA", value: "Adaptive" },
            { label: "Hedge", value: "MLPS" },
        ],
    },
];

export function MT5TeaserCTA({ isLoggedIn = false }: MT5TeaserCTAProps) {
    const secondaryUrl = isLoggedIn
        ? "/dashboard/accounts"
        : "/auth/signup?next=/dashboard/accounts&source=automated_execution_cta";

    return (
        <div className="relative w-full overflow-hidden border-t border-dashboard bg-gray-50/50 dark:bg-transparent">
            {/* Dot pattern bg */}
            <div className="absolute inset-0 bg-[radial-gradient(hsl(var(--gold))_1.5px,transparent_1.5px)] [background-size:32px_32px] opacity-[0.3] dark:opacity-[0.2] pointer-events-none" />

            {/* Premium Animations */}
            <style
                dangerouslySetInnerHTML={{
                    __html: `
        @keyframes border-flow-teaser-new {
          from { stroke-dashoffset: 0; }
          to { stroke-dashoffset: -360; }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.5; }
          50% { transform: scale(1.1); opacity: 0.3; }
          100% { transform: scale(0.95); opacity: 0.5; }
        }
        @keyframes line-shine {
          0% { left: -100%; }
          100% { left: 200%; }
        }
        .animate-flow-teaser-new {
          stroke-dasharray: 120 240;
          animation: border-flow-teaser-new 12s linear infinite;
        }
        .animate-pulse-ring {
          animation: pulse-ring 3s ease-in-out infinite;
        }
        .premium-btn-shine::after {
          content: '';
          position: absolute;
          top: 0;
          height: 100%;
          width: 50px;
          background: linear-gradient(to right, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
          transform: skewX(-25deg);
          transition: 0.75s;
        }
        .premium-btn-shine:hover::after {
          animation: line-shine 1.2s ease-in-out infinite;
        }
      `,
                }}
            />

            <section className="py-12 sm:py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
                {/* Main Container Card */}
                <div className="relative max-w-7xl mx-auto rounded-3xl border border-amber-200/50 dark:border-white/10 bg-slate-50/90 dark:bg-[#0c0f16]/80 backdrop-blur-md p-5 sm:p-8 md:p-10 shadow-lg dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-gold/30 dark:hover:border-gold/20 hover:shadow-xl hover:shadow-gold/[0.01] transition-all duration-500 overflow-hidden group/card">
                    {/* Flowing laser border */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none rounded-3xl">
                        <defs>
                            <linearGradient
                                id="laser-grad-teaser-new"
                                x1="0%"
                                y1="0%"
                                x2="100%"
                                y2="100%"
                            >
                                <stop
                                    offset="0%"
                                    stopColor="#f59e0b"
                                    stopOpacity="0.1"
                                />
                                <stop
                                    offset="50%"
                                    stopColor="#f59e0b"
                                    stopOpacity="0.75"
                                />
                                <stop
                                    offset="100%"
                                    stopColor="#d97706"
                                    stopOpacity="0.15"
                                />
                            </linearGradient>
                        </defs>
                        <rect
                            x="0.5"
                            y="0.5"
                            width="calc(100% - 1px)"
                            height="calc(100% - 1px)"
                            rx="23"
                            fill="none"
                            stroke="url(#laser-grad-teaser-new)"
                            strokeWidth="1.5"
                            className="animate-flow-teaser-new"
                        />
                    </svg>

                    {/* Technical Square Grid Background */}
                    <div className="absolute inset-0 bg-[linear-gradient(rgba(245,158,11,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.03)_1px,transparent_1px)] dark:bg-[linear-gradient(rgba(245,158,11,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(245,158,11,0.02)_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none rounded-3xl" />

                    {/* Glowing Tech Mesh Backdrop */}
                    <div className="absolute -top-20 -right-20 w-80 h-80 bg-gold/[0.08] dark:bg-gold/[0.06] rounded-full blur-[80px] pointer-events-none group-hover/card:scale-110 transition-transform duration-700" />
                    <div className="absolute -bottom-20 -left-20 w-80 h-80 bg-amber-400/[0.1] dark:bg-amber-500/[0.06] rounded-full blur-[80px] pointer-events-none" />

                    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-8 lg:gap-12 items-center relative z-10">
                        {/* Left Column: Product Promise, Trust, CTAs */}
                        <div className="space-y-6">
                            <div>
                                {/* Main Title */}
                                <h2 className="text-2xl sm:text-3xl font-black text-gray-800 dark:text-white leading-tight tracking-tight">
                                    Tired of Watching Charts All Day?
                                </h2>

                                {/* Description */}
                                <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 font-semibold leading-relaxed">
                                    Deploy GoldScalperNinja, GSN Trade Manager, and Phoenix Grid. Tested algorithms with hard-coded risk management, free through our partner broker path.
                                </p>
                            </div>

                            {/* Trust Bullets */}
                            <div className="space-y-2.5 border-t border-dashed border-gray-200 dark:border-white/10 pt-5">
                                {[
                                    "100% automated MT5 live execution with strict hard stop-losses",
                                    "Capital stays in your regulated account — we never touch your funds",
                                    "Includes Trade Manager EA, GoldScalperNinja & Phoenix Grid licenses",
                                ].map((text, idx) => (
                                    <div
                                        key={idx}
                                        className="flex items-center gap-2.5 text-xs font-bold text-gray-700 dark:text-gray-300"
                                    >
                                        <CheckCircle2
                                            size={15}
                                            className="text-emerald-500 shrink-0"
                                        />
                                        <span>{text}</span>
                                    </div>
                                ))}
                            </div>

                            {/* Dual CTA Actions */}
                            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
                                <Link
                                    href="/trading-systems"
                                    className="w-full sm:w-auto group"
                                >
                                    <Button className="w-full sm:w-auto min-h-12 px-5 sm:px-7 rounded-xl bg-gold hover:bg-amber-600 text-white font-extrabold text-sm shadow-[0_8px_20px_rgba(245,158,11,0.22)] hover:shadow-[0_12px_28px_rgba(245,158,11,0.32)] transition-all duration-300 flex items-center justify-center gap-2 animate-btn-shine whitespace-nowrap">
                                        <span>Unlock Automated EAs</span>
                                        <ArrowRight
                                            size={16}
                                            className="group-hover:translate-x-1 transition-transform duration-300"
                                        />
                                    </Button>
                                </Link>

                                <Link
                                    href={secondaryUrl}
                                    className="w-full sm:w-auto group"
                                >
                                    <Button
                                        variant="outline"
                                        className="w-full sm:w-auto min-h-12 px-5 sm:px-6 rounded-xl border border-slate-300 dark:border-white/15 hover:border-gold dark:hover:border-gold/60 bg-white/80 dark:bg-white/[0.04] backdrop-blur-sm text-slate-700 dark:text-slate-200 hover:text-amber-600 dark:hover:text-gold font-extrabold text-sm shadow-sm transition-all duration-300 flex items-center justify-center gap-2 whitespace-nowrap"
                                    >
                                        <HelpCircle
                                            size={16}
                                            className="shrink-0 text-amber-500 dark:text-gold"
                                        />
                                        <span>How Unlock Works</span>
                                    </Button>
                                </Link>
                            </div>

                            {/* Trust Safety Disclaimer */}
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold leading-relaxed italic">
                                Free to unlock with an eligible partner account.{" "}
                                <span className="font-bold text-gray-500 dark:text-gray-400">
                                    No profit guarantee
                                </span>
                                . You stay in control of your broker account.
                            </p>
                        </div>

                        {/* Right Column: High-Fidelity MT5 Trading Systems Suite Console (Full-width on tablet/mobile, side-by-side on desktop) */}
                        <div className="relative w-full rounded-2xl border border-slate-200/80 dark:border-white/10 bg-white/95 dark:bg-[#11141f]/95 p-4 sm:p-5 md:p-6 shadow-xl overflow-hidden group/mockup">
                            {/* Blueprint grid lines overlay */}
                            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(156,163,175,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(156,163,175,0.05)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

                            {/* Terminal Header Bar */}
                            <div className="flex items-center justify-between mb-3.5 border-b border-slate-200/80 dark:border-white/10 pb-3 relative z-10">
                                <div className="flex items-center gap-2">
                                    <div className="flex gap-1.5">
                                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                                    </div>
                                    <span className="text-[10px] font-black font-mono text-gray-700 dark:text-gray-300 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                                        <Zap size={11} className="text-amber-500" />
                                        MT5 TRADING SYSTEMS SUITE
                                    </span>
                                </div>

                                {/* Unlocked Status Badge */}
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider relative">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                                    <span>ELIGIBLE UNLOCK</span>
                                </span>
                            </div>

                            {/* 3 Core Trading System Cards */}
                            <div className="space-y-3 relative z-10">
                                {TRADING_SYSTEM_ITEMS.map((item, idx) => {
                                    const Icon = item.icon;
                                    return (
                                        <div
                                            key={idx}
                                            className="p-3.5 sm:p-4 rounded-xl border border-slate-200/70 dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.02] hover:bg-white dark:hover:bg-white/[0.05] hover:border-gold/30 hover:shadow-sm transition-all duration-300 group/tool"
                                        >
                                            {/* Header Row: Icon + Title + Category Tag */}
                                            <div className="flex items-center justify-between gap-2 mb-2">
                                                <div className="flex items-center gap-2.5">
                                                    <div
                                                        className={`h-7 sm:h-8 w-7 sm:w-8 rounded-lg flex items-center justify-center border shrink-0 transition-transform group-hover/tool:scale-105 ${item.iconColor}`}
                                                    >
                                                        <Icon size={15} />
                                                    </div>
                                                    <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                                                        {item.title}
                                                    </span>
                                                </div>
                                                <span
                                                    className={`shrink-0 text-[8px] sm:text-[9px] font-black font-mono uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-md border ${item.tagColor}`}
                                                >
                                                    {item.tag}
                                                </span>
                                            </div>

                                            {/* Description */}
                                            <p className="text-[11px] sm:text-xs leading-relaxed text-gray-600 dark:text-gray-400 mb-2.5">
                                                {item.desc}
                                            </p>

                                            {/* Telemetry Parameter Pills - Equal 3-column grid spanning full width on tablet/desktop */}
                                            <div className="flex flex-wrap sm:grid sm:grid-cols-3 gap-1.5 sm:gap-2">
                                                {item.badges.map((b, bIdx) => (
                                                    <div
                                                        key={bIdx}
                                                        className="inline-flex sm:flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-md bg-white dark:bg-black/40 border border-slate-200/80 dark:border-white/[0.06] text-[9px] sm:text-[10px] font-mono shadow-xs text-center whitespace-nowrap"
                                                    >
                                                        <span className="text-gray-400 font-medium">
                                                            {b.label}:
                                                        </span>
                                                        <span className="font-bold text-gray-700 dark:text-gray-300">
                                                            {b.value}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            {/* Bottom Console Telemetry Strip */}
                            <div className="mt-3.5 pt-3 border-t border-slate-200/80 dark:border-white/10 flex items-center justify-between text-[9px] sm:text-[10px] font-mono text-gray-500 dark:text-gray-400 relative z-10">
                                <div className="flex items-center gap-2">
                                    <span className="flex items-center gap-1">
                                        <Activity size={11} className="text-emerald-500" />
                                        <span>MT5 ALL BROKERS</span>
                                    </span>
                                    <span>•</span>
                                    <span>AUTO-BOUND</span>
                                </div>
                                <span className="font-bold text-amber-600 dark:text-gold uppercase tracking-wider">
                                    100% FREE UNLOCK
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
