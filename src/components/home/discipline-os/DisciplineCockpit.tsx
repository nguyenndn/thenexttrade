"use client";

import { useState } from "react";
import { Target, Zap, ShieldAlert, ArrowRight } from "lucide-react";
import Link from "next/link";
import {
    Pillar1MicroCard,
    Pillar2MicroCard,
    Pillar3MicroCard,
} from "./CockpitTelemetry";
import { MissionManifestoHeader } from "./MissionManifestoHeader";

export function DisciplineCockpit() {
    const [activeBay, setActiveBay] = useState<number | null>(null);

    return (
        <div className="relative isolate overflow-hidden rounded-3xl border border-slate-200/90 dark:border-white/10 bg-slate-50/80 dark:bg-[#0c0e14]/95 backdrop-blur-2xl shadow-[0_20px_50px_-12px_rgba(0,0,0,0.08)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.8)]">
            {/* Ambient Background Glow Spotlights */}
            <div className="pointer-events-none absolute -left-20 -top-20 h-64 w-64 rounded-full bg-amber-500/10 blur-[90px]" />
            <div className="pointer-events-none absolute left-1/2 -top-20 h-64 w-64 -translate-x-1/2 rounded-full bg-purple-500/10 blur-[90px]" />
            <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-blue-500/10 blur-[90px]" />

            {/* 1. TOP STATUS BAR */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200/80 dark:border-white/[0.08] px-5 py-3.5 sm:px-7 bg-white/70 dark:bg-white/[0.02]">
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-800 dark:text-gray-100 tracking-wide">
                        <div className="w-5 h-5 rounded-md bg-amber-500/15 text-amber-600 dark:text-gold flex items-center justify-center">
                            <Target size={13} />
                        </div>
                        <span className="uppercase text-[11px] font-extrabold tracking-wider text-gray-900 dark:text-white">
                            The Discipline OS
                        </span>
                    </div>

                    <span className="hidden sm:inline-block h-3.5 w-px bg-slate-300 dark:bg-white/10" />

                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                        </span>
                        <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                            Ending Emotional Trading · The 3-Pillar Foundation
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
                        Zero-Friction System
                    </span>
                </div>
            </div>

            {/* 2. CONTINUOUS PROGRESS ENERGY ACCENT */}
            <div className="relative h-[2px] w-full bg-slate-200 dark:bg-white/10 overflow-hidden">
                <div
                    className="absolute inset-y-0 h-full w-48 bg-gradient-to-r from-transparent via-amber-400 via-purple-400 to-blue-400 to-transparent"
                    style={{
                        animation: "laserFlow 4s linear infinite",
                    }}
                />
            </div>

            {/* 2.5 INTEGRATED MANIFESTO HEADLINE (ALL-IN-ONE COCKPIT) */}
            <MissionManifestoHeader />

            {/* 3. THE 3 FOUNDATIONAL PILLARS (EXACT OPTION 3 CONTENT) */}
            <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 divide-slate-200/80 dark:divide-white/[0.08] md:divide-x">
                {/* PILLAR 01: COGNITIVE FREEDOM */}
                <div
                    onMouseEnter={() => setActiveBay(1)}
                    onMouseLeave={() => setActiveBay(null)}
                    className={`group relative flex flex-col justify-between p-6 sm:p-7 transition-all duration-300 ${
                        activeBay === 1
                            ? "bg-amber-500/[0.04] dark:bg-amber-500/[0.03]"
                            : "hover:bg-slate-100/50 dark:hover:bg-white/[0.01]"
                    }`}
                >
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-600 dark:text-gold flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Zap size={20} />
                        </div>

                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-amber-600 dark:text-gold mb-1">
                            Pillar 01 · Cognitive Freedom
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            Eliminate Manual Friction
                        </h3>

                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6 font-normal">
                            Manual trade logging fails because human willpower runs out after red days. Our Trade Manager EA streams every tick live from MT5 so you focus purely on market analysis.
                        </p>
                    </div>

                    <Pillar1MicroCard />
                </div>

                {/* PILLAR 02: RADICAL TRANSPARENCY */}
                <div
                    onMouseEnter={() => setActiveBay(2)}
                    onMouseLeave={() => setActiveBay(null)}
                    className={`group relative flex flex-col justify-between p-6 sm:p-7 transition-all duration-300 ${
                        activeBay === 2
                            ? "bg-purple-500/[0.04] dark:bg-purple-500/[0.03]"
                            : "hover:bg-slate-100/50 dark:hover:bg-white/[0.01]"
                    }`}
                >
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <ShieldAlert size={20} />
                        </div>

                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-purple-600 dark:text-purple-400 mb-1">
                            Pillar 02 · Radical Transparency
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            Expose Every Hidden Leak
                        </h3>

                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6 font-normal">
                            You cannot fix what you refuse to see. Our early-warning risk radar catches revenge sizing, FOMO chases, and fear-based break-even exits before tilt destroys the week.
                        </p>
                    </div>

                    <Pillar2MicroCard />
                </div>

                {/* PILLAR 03: BEHAVIORAL MASTERY */}
                <div
                    onMouseEnter={() => setActiveBay(3)}
                    onMouseLeave={() => setActiveBay(null)}
                    className={`group relative flex flex-col justify-between p-6 sm:p-7 transition-all duration-300 ${
                        activeBay === 3
                            ? "bg-blue-500/[0.04] dark:bg-blue-500/[0.03]"
                            : "hover:bg-slate-100/50 dark:hover:bg-white/[0.01]"
                    }`}
                >
                    <div>
                        <div className="w-10 h-10 rounded-xl bg-blue-500/15 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                            <Target size={20} />
                        </div>

                        <div className="text-[11px] font-extrabold uppercase tracking-wider text-blue-600 dark:text-blue-400 mb-1">
                            Pillar 03 · Behavioral Mastery
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                            10-Trade Action Cycles
                        </h3>

                        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed mb-6 font-normal">
                            Discipline is not motivation — it is programmed behavior. We convert analytical flaws into concrete 10-trade improvement cycles to forge institutional consistency.
                        </p>
                    </div>

                    <Pillar3MicroCard />
                </div>
            </div>

            {/* 4. VALUE FLOW FOOTER */}
            <div className="flex flex-wrap items-center justify-between gap-4 border-t border-slate-200/80 dark:border-white/[0.08] px-5 py-3.5 sm:px-7 bg-white/70 dark:bg-white/[0.02] text-xs text-gray-600 dark:text-gray-400">
                <div className="flex flex-wrap items-center gap-3 sm:gap-6 font-semibold">
                    <span className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                        1. Cognitive Freedom
                    </span>
                    <ArrowRight size={12} className="text-gray-400 hidden sm:inline" />
                    <span className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                        2. Radical Transparency
                    </span>
                    <ArrowRight size={12} className="text-gray-400 hidden sm:inline" />
                    <span className="flex items-center gap-1.5 text-gray-800 dark:text-gray-200">
                        <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                        3. Behavioral Mastery
                    </span>
                </div>

                <Link
                    href="/auth/signup"
                    className="inline-flex items-center gap-1.5 font-bold text-amber-600 dark:text-gold hover:underline"
                >
                    <span>Start Your Discipline Loop (Sync MT5)</span>
                    <ArrowRight size={14} />
                </Link>
            </div>

            {/* Custom CSS Animation Keyframe for Energy Line */}
            <style>{`
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
