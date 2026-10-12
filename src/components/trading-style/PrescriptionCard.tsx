"use client";

import Link from "next/link";
import {
    ArrowRight,
    Bot,
    GraduationCap,
    ShieldAlert,
    Sparkles,
    Target,
    Wrench,
} from "lucide-react";
import type { Archetype } from "@/config/trading-style-data";
import { cn } from "@/lib/utils";

interface PrescriptionCardProps {
    archetype: Archetype;
    className?: string;
}

/**
 * Diagnostic Selling Prescription Card:
 * Presents a tailored 3-part corrective system for the diagnosed trading archetype:
 * 1. Recommended Calibration Tool (TheNextTrade calculators / market radar)
 * 2. Recommended MT5 System (Expert Advisor or execution panel)
 * 3. Recommended Academy Lesson (behavioral / risk curriculum)
 */
export function PrescriptionCard({
    archetype,
    className,
}: PrescriptionCardProps) {
    const rx = archetype.prescription;
    if (!rx) return null;

    return (
        <section
            aria-label="Tailored Clinical Prescription"
            className={cn(
                "rounded-lg border border-amber-500/25 bg-gradient-to-b from-amber-500/[0.04] via-transparent to-transparent p-5 sm:p-6 dark:border-amber-500/20 dark:from-amber-500/[0.06]",
                className
            )}
        >
            {/* Header Badge & Title */}
            <div className="mb-5 flex flex-col items-start gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <div className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-black uppercase tracking-wider text-amber-700 dark:text-gold">
                        <Sparkles size={12} className="shrink-0 text-gold" />
                        Clinical Prescription · Diagnostic Selling
                    </div>
                    <h3 className="mt-2 text-xl sm:text-2xl font-black tracking-tight text-gray-950 dark:text-white">
                        Tailored Action Plan for {archetype.name}
                    </h3>
                </div>
                <div className="hidden sm:flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400">
                    <Target size={14} className="text-amber-600 dark:text-gold" />
                    <span>3 Prescribed Solutions</span>
                </div>
            </div>

            {/* Diagnostic Diagnosis Box */}
            <div className="mb-6 rounded-lg border border-gray-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm sm:p-5 dark:border-white/10 dark:bg-[#151925]/80">
                <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-red-500/10 text-red-600 dark:bg-red-500/15 dark:text-red-400">
                        <ShieldAlert size={18} />
                    </div>
                    <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="text-[11px] font-black uppercase tracking-[0.14em] text-red-600 dark:text-red-400">
                                Behavioral Leak Radar
                            </span>
                            <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
                            <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                                {rx.diagnosisTitle}
                            </span>
                        </div>
                        <p className="mt-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                            {rx.diagnosisText}
                        </p>
                        <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/[0.06] px-3 py-2 text-xs font-medium text-amber-900 dark:text-amber-200">
                            <Target size={14} className="shrink-0 text-amber-600 dark:text-gold" />
                            <span>
                                <strong className="font-bold">Target Rx:</strong>{" "}
                                {rx.targetOutcome}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* 3 Solutions Grid */}
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                {/* Solution 1: Tool */}
                <div className="group flex flex-col justify-between rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm p-4 shadow-sm transition-all hover:border-amber-500/40 hover:shadow-md dark:border-white/10 dark:bg-[#151925]/80">
                    <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-500/10 text-blue-600 dark:bg-blue-500/15 dark:text-blue-400">
                                <Wrench size={16} />
                            </div>
                            <span className="rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-700 dark:text-blue-300">
                                {rx.tool.badge}
                            </span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            Step 1 · Calibration Tool
                        </span>
                        <h4 className="mt-0.5 text-base font-black text-gray-950 dark:text-white">
                            {rx.tool.name}
                        </h4>
                        <p className="text-xs font-semibold text-amber-600 dark:text-gold">
                            {rx.tool.tagline}
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                            {rx.tool.why}
                        </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
                        <Link
                            href={rx.tool.href}
                            className="inline-flex items-center gap-1.5 text-xs font-black text-amber-600 hover:text-amber-700 dark:text-gold dark:hover:text-amber-300 transition-colors"
                        >
                            <span>{rx.tool.actionLabel}</span>
                            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </div>

                {/* Solution 2: MT5 System */}
                <div className="group flex flex-col justify-between rounded-lg border border-amber-500/35 bg-white/80 backdrop-blur-sm p-4 shadow-sm transition-all hover:border-amber-500/55 hover:shadow-md dark:border-amber-500/35 dark:bg-[#151925]/80">
                    <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold/15 text-amber-700 dark:text-gold">
                                <Bot size={16} />
                            </div>
                            <span className="rounded-full bg-gold/15 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800 dark:text-gold">
                                {rx.system.badge}
                            </span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-amber-700/80 dark:text-gold/80">
                            Step 2 · MT5 Execution Armor
                        </span>
                        <h4 className="mt-0.5 text-base font-black text-gray-950 dark:text-white">
                            {rx.system.name}
                        </h4>
                        <p className="text-xs font-semibold text-amber-600 dark:text-gold">
                            {rx.system.tagline}
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                            {rx.system.why}
                        </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-amber-500/20 dark:border-amber-500/20">
                        <Link
                            href={rx.system.href}
                            className="inline-flex items-center gap-1.5 text-xs font-black text-amber-600 hover:text-amber-700 dark:text-gold dark:hover:text-amber-300 transition-colors"
                        >
                            <span>{rx.system.actionLabel}</span>
                            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </div>

                {/* Solution 3: Academy Lesson */}
                <div className="group flex flex-col justify-between rounded-lg border border-gray-200 bg-white/80 backdrop-blur-sm p-4 shadow-sm transition-all hover:border-amber-500/40 hover:shadow-md dark:border-white/10 dark:bg-[#151925]/80">
                    <div>
                        <div className="flex items-center justify-between gap-2 mb-3">
                            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-400">
                                <GraduationCap size={16} />
                            </div>
                            <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                                {rx.lesson.badge}
                            </span>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-gray-400 dark:text-gray-500">
                            Step 3 · Behavioral Rewiring
                        </span>
                        <h4 className="mt-0.5 text-base font-black text-gray-950 dark:text-white">
                            {rx.lesson.name}
                        </h4>
                        <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            {rx.lesson.tagline}
                        </p>
                        <p className="mt-2 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                            {rx.lesson.why}
                        </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-100 dark:border-white/10">
                        <Link
                            href={rx.lesson.href}
                            className="inline-flex items-center gap-1.5 text-xs font-black text-amber-600 hover:text-amber-700 dark:text-gold dark:hover:text-amber-300 transition-colors"
                        >
                            <span>{rx.lesson.actionLabel}</span>
                            <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
}
