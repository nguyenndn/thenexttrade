"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Brain, RotateCcw } from "lucide-react";
import { ARCHETYPES, type ArchetypeId } from "@/config/trading-style-data";
import type { TradingStyleSaved } from "@/app/dashboard/settings/trading-style/page";
import { DimensionBars } from "@/components/trading-style/DimensionBars";
import { ArchetypeCard } from "@/components/trading-style/ArchetypeCard";

interface TradingStyleDashboardProps {
    initialResult: TradingStyleSaved | null;
    userId: string;
}

export function TradingStyleDashboard({
    initialResult,
}: TradingStyleDashboardProps) {
    const archetype = useMemo(() => {
        if (!initialResult) return null;
        return ARCHETYPES[initialResult.archetype as ArchetypeId] ?? null;
    }, [initialResult]);

    // ─────────────── Empty state ───────────────
    if (!initialResult || !archetype) {
        return (
            <div className="flex flex-col items-center rounded-2xl border border-dashboard bg-white/80 p-8 text-center dark:bg-white/[0.03] sm:p-12">
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 text-white shadow-lg shadow-amber-500/25">
                    <Brain size={30} />
                </div>
                <h2 className="text-xl font-black tracking-tight text-gray-900 dark:text-white">
                    You haven&apos;t taken the test yet
                </h2>
                <p className="mt-2 max-w-md text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                    Take the free 3-minute quiz to discover your trading
                    archetype and get a personalised plan of next moves.
                </p>
                <Link
                    href="/trading-style"
                    className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-3 text-sm font-black text-white shadow-md shadow-amber-500/20 transition hover:from-amber-600 hover:to-orange-600"
                >
                    Start the Assessment
                </Link>
            </div>
        );
    }

    const completedAt = initialResult.completedAt
        ? new Date(initialResult.completedAt).toLocaleDateString()
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
                <Link
                    href="/trading-style"
                    className="inline-flex items-center gap-1.5 text-sm font-bold text-amber-600 hover:underline dark:text-gold"
                >
                    <RotateCcw size={14} /> Retake the test
                </Link>
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
                <DimensionBars scores={initialResult.dimensions} />
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
