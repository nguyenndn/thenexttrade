"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { Archetype } from "@/config/trading-style-data";
import { cn } from "@/lib/utils";

interface PrescriptionCardProps {
    archetype: Archetype;
    columns?: 1 | 3;
    className?: string;
}

interface SolutionItem {
    stepNum: string;
    stepLabel: string;
    badge: string;
    name: string;
    tagline: string;
    why: string;
    href: string;
    actionLabel: string;
}

/**
 * Tailored Action Plan (Prescription Card):
 * Uniform, institutional 3-part corrective architecture for the diagnosed trading archetype:
 * 1. Recommended Calibration Tool (TheNextTrade calculators / market radar)
 * 2. Recommended MT5 System (Expert Advisor or execution panel)
 * 3. Execution Rulebook Protocol (behavioral / risk guardrails)
 */
export function PrescriptionCard({
    archetype,
    columns = 3,
    className,
}: PrescriptionCardProps) {
    const rx = archetype.prescription;
    if (!rx) return null;

    const solutions: SolutionItem[] = [
        {
            stepNum: "01",
            stepLabel: "CALIBRATION TOOL",
            badge: rx.tool.badge,
            name: rx.tool.name,
            tagline: rx.tool.tagline,
            why: rx.tool.why,
            href: rx.tool.href,
            actionLabel: rx.tool.actionLabel,
        },
        {
            stepNum: "02",
            stepLabel: "MT5 EXECUTION ARMOR",
            badge: rx.system.badge,
            name: rx.system.name,
            tagline: rx.system.tagline,
            why: rx.system.why,
            href: rx.system.href,
            actionLabel: rx.system.actionLabel,
        },
        {
            stepNum: "03",
            stepLabel: "BEHAVIORAL REWIRING",
            badge: "Rulebook Protocol",
            name: rx.lesson.name,
            tagline: rx.lesson.tagline,
            why: rx.lesson.why,
            href: "/dashboard/rules",
            actionLabel: "Open Trading Rules",
        },
    ];

    return (
        <section
            aria-label="Tailored Action Plan"
            className={cn(
                "rounded-xl border border-dashboard bg-white/90 p-5 shadow-sm backdrop-blur-sm sm:p-6 dark:bg-[#1E2028]/90",
                className
            )}
        >
            {/* Header Title */}
            <div className="mb-5 flex flex-col items-start gap-2 border-b border-gray-100 pb-4 sm:flex-row sm:items-center sm:justify-between dark:border-white/[0.06]">
                <div>
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        Corrective Architecture
                    </span>
                    <h3 className="mt-0.5 text-lg font-bold tracking-tight text-gray-950 sm:text-xl dark:text-white">
                        {columns === 1
                            ? "Tailored Action Plan"
                            : `Tailored Action Plan for ${archetype.name}`}
                    </h3>
                </div>
                <div className="flex items-center rounded-lg border border-dashboard bg-gray-50 px-2.5 py-1 text-[11px] font-mono font-semibold text-gray-600 dark:bg-white/[0.03] dark:text-gray-400">
                    <span>3 Prescribed Solutions</span>
                </div>
            </div>

            {/* Diagnostic Diagnosis Box (Behavioral Leak Radar) */}
            <div className="mb-5 rounded-xl border border-red-500/20 bg-red-500/[0.02] p-4 sm:p-5 dark:border-red-500/25 dark:bg-red-950/[0.12]">
                <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-red-600 dark:text-red-400">
                        BEHAVIORAL LEAK RADAR
                    </span>
                    <span className="text-gray-300 dark:text-gray-600">/</span>
                    <span className="text-xs font-bold text-gray-900 dark:text-white">
                        {rx.diagnosisTitle}
                    </span>
                </div>
                <p className="mt-1.5 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                    {rx.diagnosisText}
                </p>
                <div className="mt-3 flex items-start gap-2.5 rounded-lg border border-dashboard bg-white/80 p-3 text-xs dark:bg-white/[0.03]">
                    <span className="mt-0.5 shrink-0 font-mono text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-gold">
                        TARGET RX
                    </span>
                    <span className="text-xs leading-relaxed text-gray-700 dark:text-gray-200">
                        {rx.targetOutcome}
                    </span>
                </div>
            </div>

            {/* Solutions Grid */}
            <div
                className={cn(
                    "grid gap-4",
                    columns === 1
                        ? "grid-cols-1"
                        : "grid-cols-1 md:grid-cols-3"
                )}
            >
                {solutions.map((item) => (
                    <div
                        key={item.stepNum}
                        className="group flex flex-col justify-between rounded-xl border border-dashboard bg-white/90 p-5 shadow-sm backdrop-blur-sm transition-all hover:border-gray-400/50 hover:shadow-md dark:bg-[#151925]/90 dark:hover:border-white/20"
                    >
                        <div>
                            {/* Top Step & Badge Row */}
                            <div className="mb-2 flex items-center justify-between gap-2">
                                <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    <span className="mr-1.5 font-semibold text-gray-400 dark:text-gray-500">
                                        {item.stepNum} ·
                                    </span>
                                    {item.stepLabel}
                                </span>
                                <span className="rounded-lg border border-dashboard bg-gray-50 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-wider text-gray-700 dark:bg-white/[0.04] dark:text-gray-300">
                                    {item.badge}
                                </span>
                            </div>

                            <h4 className="mt-2 text-sm font-bold text-gray-950 sm:text-base dark:text-white">
                                {item.name}
                            </h4>
                            <p className="mt-0.5 text-xs font-semibold text-amber-700 dark:text-gold">
                                {item.tagline}
                            </p>
                            <p className="mt-2 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                                {item.why}
                            </p>
                        </div>

                        <div className="mt-4 border-t border-gray-100 pt-3 dark:border-white/[0.06]">
                            <Link
                                href={item.href}
                                className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 transition-colors hover:text-amber-800 dark:text-gold dark:hover:text-amber-300"
                            >
                                <span>{item.actionLabel}</span>
                                <ArrowRight
                                    size={13}
                                    className="transition-transform group-hover:translate-x-0.5"
                                />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        </section>
    );
}
