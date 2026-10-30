"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Calendar, RotateCcw } from "lucide-react";
import { ARCHETYPES, type ArchetypeId } from "@/config/trading-style-data";
import type { TradingStyleSaved } from "@/app/dashboard/settings/trading-style/page";
import { Button } from "@/components/ui/Button";
import { buttonVariants } from "@/components/ui/button-variants";
import { DimensionBars } from "@/components/trading-style/DimensionBars";
import { ArchetypeCard, ArchetypeMoves } from "@/components/trading-style/ArchetypeCard";
import { PrescriptionCard } from "@/components/trading-style/PrescriptionCard";
import { QuizFlow } from "@/components/trading-style/QuizFlow";

interface TradingStyleDashboardProps {
    initialResult: TradingStyleSaved | null;
    userId: string;
}

export function TradingStyleDashboard({
    initialResult,
}: TradingStyleDashboardProps) {
    const [result, setResult] = useState<TradingStyleSaved | null>(initialResult);
    const [isRetaking, setIsRetaking] = useState(false);

    const archetype = useMemo(() => {
        if (!result) return null;
        return ARCHETYPES[result.archetype as ArchetypeId] ?? null;
    }, [result]);

    // ─────────────── Quiz / Assessment flow state (Retake inside Dashboard) ───────────────
    if (!result || !archetype || isRetaking) {
        return (
            <div className="relative overflow-hidden rounded-xl border border-dashboard bg-white/90 p-5 shadow-sm backdrop-blur-sm sm:p-8 dark:bg-[#1E2028]/90">
                {isRetaking && (
                    <div className="mb-6 flex items-center justify-between border-b border-dashboard pb-4">
                        <div>
                            <p className="text-[10px] font-bold uppercase tracking-wider text-amber-700 dark:text-gold">
                                Recalibration Mode
                            </p>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">
                                Retaking Trading Style Assessment
                            </h3>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setIsRetaking(false)}
                            className="text-xs font-bold"
                        >
                            Cancel & Return to Results
                        </Button>
                    </div>
                )}

                <QuizFlow
                    isLoggedIn={true}
                    onSaveSuccess={(savedData) => {
                        setResult(savedData as TradingStyleSaved);
                        setIsRetaking(false);
                    }}
                />
            </div>
        );
    }

    const completedAt = result.completedAt
        ? new Date(result.completedAt).toLocaleDateString()
        : null;

    // ─────────────── Result state: Executive Trader Cockpit ───────────────
    return (
        <div className="space-y-6">
            {/* 1. Hero Cockpit Card */}
            <div className="relative overflow-hidden rounded-xl border border-dashboard bg-white/90 p-6 shadow-sm backdrop-blur-sm dark:bg-[#1E2028]/90">
                <div className="relative flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0 max-w-2xl">
                        <h2 className="text-2xl font-black tracking-tight text-gray-950 sm:text-3xl dark:text-white">
                            {archetype.name}
                        </h2>
                        <p className="mt-2 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                            {archetype.summary}
                        </p>
                        {completedAt && (
                            <div className="mt-3 flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500">
                                <Calendar size={13} className="shrink-0" />
                                <span>Assessed on {completedAt}</span>
                            </div>
                        )}
                    </div>

                    <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setIsRetaking(true)}
                        className="shrink-0 gap-1.5 text-xs font-bold"
                    >
                        <RotateCcw size={13} />
                        Retake Assessment
                    </Button>
                </div>
            </div>

            {/* 2. Asymmetric 2-Column Grid */}
            <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-12">
                {/* Left Column: Diagnostic Profile & 6 Dimensions */}
                <div className="space-y-6 lg:col-span-7">
                    {/* Dimension Matrix Card */}
                    <div className="rounded-xl border border-dashboard bg-white/90 p-5 shadow-sm backdrop-blur-sm sm:p-6 dark:bg-[#1E2028]/90">
                        <div className="mb-4 flex items-center justify-between border-b border-gray-100 pb-3 dark:border-white/[0.06]">
                            <div>
                                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                    6 Core Behavioral Dimensions
                                </h3>
                                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                                    Normalized score profile across psychological trading spectrums
                                </p>
                            </div>
                            <span className="hidden rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-mono font-bold text-gray-600 sm:inline-block dark:bg-white/[0.06] dark:text-gray-300">
                                0–100 Scale
                            </span>
                        </div>
                        <DimensionBars scores={result.dimensions} />
                    </div>

                    {/* Tactical & Behavioral Profile Card */}
                    <div className="rounded-xl border border-dashboard bg-white/90 p-5 shadow-sm backdrop-blur-sm sm:p-6 dark:bg-[#1E2028]/90">
                        <div className="mb-4 border-b border-gray-100 pb-3 dark:border-white/[0.06]">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                                Tactical & Behavioral Profile
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                                Execution tendencies, blindspots, and recommended focal points
                            </p>
                        </div>
                        <ArchetypeCard
                            archetype={archetype}
                            showHeader={false}
                            showMoves={false}
                        />
                    </div>
                </div>

                {/* Right Column: Behavioral Correction Plan & Action Roadmap */}
                <div className="space-y-6 lg:col-span-5">
                    {/* Behavioral Correction Plan (Prescription Card) */}
                    <PrescriptionCard archetype={archetype} columns={1} />

                    {/* Action Roadmap (Keystone & Follow-up moves) */}
                    <div className="rounded-xl border border-dashboard bg-white/90 p-5 shadow-sm backdrop-blur-sm sm:p-6 dark:bg-[#1E2028]/90">
                        <div className="mb-4 border-b border-gray-100 pb-3 dark:border-white/[0.06]">
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                Execution Discipline
                            </span>
                            <h3 className="mt-0.5 text-base font-bold tracking-tight text-gray-950 sm:text-lg dark:text-white">
                                Action Roadmap
                            </h3>
                            <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                                Immediate steps to calibrate execution and preserve capital
                            </p>
                        </div>
                        <ArchetypeMoves archetype={archetype} />
                    </div>

                    {/* Secondary Intelligence link card */}
                    <div className="flex flex-col gap-3 rounded-xl border border-dashboard bg-white/90 p-5 shadow-sm backdrop-blur-sm sm:p-6 dark:bg-[#1E2028]/90">
                        <div>
                            <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                                Telemetry Audit
                            </span>
                            <h4 className="mt-0.5 text-base font-bold tracking-tight text-gray-950 sm:text-lg dark:text-white">
                                Live Trading Intelligence
                            </h4>
                            <p className="mt-1 text-xs leading-relaxed text-gray-600 dark:text-gray-300">
                                Review your live MT5 trade telemetry and behavioral leak radar alongside this profile.
                            </p>
                        </div>
                        <div>
                            <Link
                                href="/dashboard/intelligence"
                                className={buttonVariants({
                                    variant: "outline",
                                    size: "sm",
                                    className: "w-full justify-center gap-1.5 text-xs font-bold",
                                })}
                            >
                                Open Intelligence
                                <ArrowRight size={13} />
                            </Link>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
