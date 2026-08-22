"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, RotateCcw } from "lucide-react";
import { ARCHETYPES, type ArchetypeId } from "@/config/trading-style-data";
import type { TradingStyleSaved } from "@/app/dashboard/settings/trading-style/page";
import { DimensionBars } from "@/components/trading-style/DimensionBars";
import { ArchetypeCard } from "@/components/trading-style/ArchetypeCard";
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

    // ─────────────── Quiz / Assessment flow state (Option A inside Dashboard) ───────────────
    if (!result || !archetype || isRetaking) {
        return (
            <div className="rounded-2xl border border-dashboard bg-white/80 p-4 sm:p-8 dark:bg-white/[0.02] shadow-sm relative overflow-hidden">
                {/* Background ambient glow */}
                <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-amber-500/[0.05] dark:bg-amber-500/[0.06] rounded-full blur-[120px] pointer-events-none" />

                {isRetaking && (
                    <div className="mb-4 flex items-center justify-between border-b border-dashboard pb-3">
                        <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-600 dark:text-gold">
                            Retaking Assessment
                        </p>
                        <button
                            type="button"
                            onClick={() => setIsRetaking(false)}
                            className="text-xs font-bold text-gray-500 hover:text-gray-900 dark:hover:text-white cursor-pointer"
                        >
                            Cancel & Return to Results
                        </button>
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

    // ─────────────── Result state ───────────────
    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                        My Trading Style
                    </h2>
                    <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">
                        {completedAt
                            ? `Assessed on ${completedAt}`
                            : "Your saved trading style"}
                    </p>
                </div>
                <button
                    type="button"
                    onClick={() => setIsRetaking(true)}
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-600 hover:underline dark:text-gold cursor-pointer"
                >
                    <RotateCcw size={14} /> Retake the test
                </button>
            </div>

            <div className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/[0.08] to-orange-500/[0.05] p-5 dark:border-amber-500/20">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-600 dark:text-gold">
                    Your trading archetype
                </p>
                <h3 className="mt-1 text-2xl font-black text-gray-900 dark:text-white">
                    {archetype.name}
                </h3>
            </div>

            <div className="rounded-2xl border border-dashboard bg-white/80 p-5 dark:bg-white/[0.03]">
                <h3 className="mb-4 text-xs font-black uppercase tracking-[0.16em] text-gray-500 dark:text-gray-400">
                    Your profile across 6 core dimensions
                </h3>
                <DimensionBars scores={result.dimensions} />
            </div>

            <div className="rounded-2xl border border-dashboard bg-white/80 p-5 dark:bg-white/[0.03]">
                <ArchetypeCard archetype={archetype} />
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between rounded-2xl border border-dashboard bg-white/80 p-5 dark:bg-white/[0.03]">
                <div className="text-sm text-gray-600 dark:text-gray-300">
                    Keep improving — review your psychology and past trades
                    alongside this profile.
                </div>
                <Link
                    href="/dashboard/psychology"
                    className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-slate-100 px-4 py-2.5 text-sm font-bold text-gray-700 transition hover:bg-slate-200 dark:bg-white/[0.08] dark:text-white dark:hover:bg-white/[0.12]"
                >
                    Open Psychology <ArrowRight size={15} />
                </Link>
            </div>
        </div>
    );
}
