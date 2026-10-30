"use client";

import { DIMENSIONS, type DimensionId } from "@/config/trading-style-data";
import { cn } from "@/lib/utils";

export interface DimensionScores {
    [key: string]: number;
}

interface DimensionBarsProps {
    scores: DimensionScores;
}

/**
 * 6 core dimensions as horizontal bars, sorted ascending.
 * The 2 lowest (≤50) and 2 highest (≥60) are flagged; the bar color follows
 * the mmfx thresholds: red ≤40, amber 41–64, green ≥65.
 */
export function DimensionBars({ scores }: DimensionBarsProps) {
    const sorted = [...DIMENSIONS].sort(
        (a, b) => (scores[a.id] ?? 50) - (scores[b.id] ?? 50),
    );

    const lowest = new Set<DimensionId>();
    const highest = new Set<DimensionId>();
    for (const dim of sorted) {
        const v = scores[dim.id] ?? 50;
        if (v <= 50 && lowest.size < 2) lowest.add(dim.id);
        if (v >= 60 && highest.size < 2) highest.add(dim.id);
    }

    const barColor = (value: number) => {
        if (value <= 40)
            return "bg-[#D9531A] dark:bg-[#E5673B]";
        if (value >= 65)
            return "bg-[#4E9A5B] dark:bg-[#5CB86B]";
        return "bg-[#E0892E] dark:bg-[#EDA44F]";
    };

    const flagLabel = (id: DimensionId) => {
        if (lowest.has(id)) return "Needs work";
        if (highest.has(id)) return "Strong";
        return "";
    };

    return (
        <div className="space-y-4">
            {sorted.map((dim) => {
                const value = Math.round(scores[dim.id] ?? 50);
                const label = flagLabel(dim.id);
                return (
                    <div key={dim.id} className="space-y-1.5">
                        <div className="flex items-center justify-between gap-3">
                            <div className="min-w-0 flex flex-wrap items-baseline gap-x-2">
                                <span className="text-sm font-bold text-gray-900 dark:text-white">
                                    {dim.name}
                                </span>
                                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                                    {dim.lowPole} → {dim.highPole}
                                </span>
                            </div>
                            <div className="flex shrink-0 items-center gap-2">
                                {label && (
                                    <span
                                        className={cn(
                                            "rounded-lg px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                                            label === "Needs work"
                                                ? "bg-rose-500/10 text-rose-600 dark:bg-rose-500/15 dark:text-rose-400"
                                                : "bg-emerald-500/10 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-400",
                                        )}
                                    >
                                        {label}
                                    </span>
                                )}
                                <span className="w-8 text-right text-sm font-bold font-mono tabular-nums text-gray-900 dark:text-white">
                                    {value}
                                </span>
                            </div>
                        </div>
                        <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100 dark:bg-white/[0.06]">
                            <div
                                className={cn(
                                    "h-full rounded-full transition-all duration-700",
                                    barColor(value),
                                )}
                                style={{ width: `${value}%` }}
                            />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
