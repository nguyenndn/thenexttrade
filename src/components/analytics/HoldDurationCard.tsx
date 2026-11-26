"use client";

import { Clock } from "lucide-react";
import type { DispositionEffectData } from "@/lib/analytics/psychology-engine.server";
import { formatHoldMinutes } from "./utils/chartHelpers";

interface HoldDurationCardProps {
    disposition: DispositionEffectData;
}

export function HoldDurationCard({ disposition }: HoldDurationCardProps) {
    const isHighDisposition = disposition.severity === "HIGH";
    const winWidth = Math.min(
        80,
        Math.max(20, 100 / (1 + (disposition.dispositionRatio || 1)))
    );

    return (
        <div className="p-5 rounded-xl bg-white dark:bg-[#1E2028] border border-dashboard dark:border-white/[0.08] shadow-sm flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
                <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                        <Clock className="w-4 h-4 text-primary shrink-0" />
                        Hold Duration Symmetry
                    </span>
                    <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold tabular-nums uppercase shrink-0 ${
                            isHighDisposition
                                ? "bg-red-500/10 text-red-500 border border-red-500/20"
                                : "bg-primary/10 text-primary border border-primary/20"
                        }`}
                    >
                        {disposition.dispositionRatio}x Ratio
                    </span>
                </div>

                <div className="rounded-xl border border-dashboard grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/[0.08] bg-gray-50/60 dark:bg-[#151925]">
                    <div className="p-2.5 space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-primary block">
                            Avg Win Hold
                        </span>
                        <span className="text-base font-bold tabular-nums text-gray-700 dark:text-white block">
                            {formatHoldMinutes(disposition.avgHoldTimeWinMinutes)}
                        </span>
                        <span className="text-[11px] tabular-nums font-medium text-gray-500 dark:text-gray-400 block">
                            Median {formatHoldMinutes(disposition.medianHoldWinMinutes)}
                        </span>
                    </div>
                    <div className="p-2.5 space-y-0.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-red-500 block">
                            Avg Loss Hold
                        </span>
                        <span className="text-base font-bold tabular-nums text-gray-700 dark:text-white block">
                            {formatHoldMinutes(disposition.avgHoldTimeLossMinutes)}
                        </span>
                        <span className="text-[11px] tabular-nums font-medium text-gray-500 dark:text-gray-400 block">
                            Median {formatHoldMinutes(disposition.medianHoldLossMinutes)}
                        </span>
                    </div>
                </div>

                <div className="w-full h-2 bg-gray-100 dark:bg-[#151925] rounded-full overflow-hidden flex">
                    <div className="bg-primary h-full" style={{ width: `${winWidth}%` }} />
                    <div className="bg-red-500 h-full flex-1" />
                </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50/80 dark:bg-[#151925] p-2.5 rounded-lg border border-dashboard dark:border-white/[0.06]">
                {disposition.insight}
            </p>
        </div>
    );
}
