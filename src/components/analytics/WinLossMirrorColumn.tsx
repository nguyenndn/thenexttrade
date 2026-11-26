"use client";

import type { ReactNode } from "react";

export interface MirrorMetricCell {
    label: string;
    value: string;
    subtext?: string;
    tone?: "positive" | "negative" | "neutral";
}

interface WinLossMirrorColumnProps {
    icon: ReactNode;
    title: string;
    subtitle: string;
    badgeLabel: string;
    badgeTone: "positive" | "warning" | "negative";
    metrics: [
        MirrorMetricCell,
        MirrorMetricCell,
        MirrorMetricCell,
        MirrorMetricCell,
    ];
    insight: string;
}

export function WinLossMirrorColumn({
    icon,
    title,
    subtitle,
    badgeLabel,
    badgeTone,
    metrics,
    insight,
}: WinLossMirrorColumnProps) {
    const badgeClass =
        badgeTone === "positive"
            ? "bg-primary/10 text-primary border-primary/20"
            : badgeTone === "negative"
              ? "bg-red-500/10 text-red-500 border-red-500/20"
              : "bg-amber-500/10 text-amber-600 dark:text-gold border-amber-500/20";

    const valueToneClass = (tone?: MirrorMetricCell["tone"]) => {
        if (tone === "positive") return "text-primary";
        if (tone === "negative") return "text-red-500";
        return "text-gray-700 dark:text-white";
    };

    return (
        <div className="p-4 sm:p-5 rounded-xl bg-gray-50/60 dark:bg-[#151925] border border-dashboard flex flex-col justify-between space-y-4">
            <div className="space-y-3.5">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5 min-w-0">
                        {icon}
                        <div className="min-w-0">
                            <h4 className="text-sm font-bold text-gray-700 dark:text-white truncate">
                                {title}
                            </h4>
                            <p className="text-xs text-gray-500 truncate">
                                {subtitle}
                            </p>
                        </div>
                    </div>

                    <span
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase tracking-wider border shrink-0 ${badgeClass}`}
                    >
                        {badgeLabel}
                    </span>
                </div>

                {/* 2x2 Matrix Card */}
                <div className="rounded-xl border border-dashboard grid grid-cols-2 divide-x divide-y divide-gray-200 dark:divide-white/[0.08] bg-white dark:bg-[#1E2028] overflow-hidden">
                    {metrics.map((m) => (
                        <div key={m.label} className="p-3 space-y-0.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                                {m.label}
                            </span>
                            <span
                                className={`text-sm sm:text-base font-bold tabular-nums block ${valueToneClass(
                                    m.tone
                                )}`}
                            >
                                {m.value}
                            </span>
                            {m.subtext && (
                                <span className="text-[11px] font-medium tabular-nums text-gray-400 block truncate">
                                    {m.subtext}
                                </span>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            <p className="text-xs text-gray-600 dark:text-gray-300 bg-white dark:bg-[#1E2028] p-2.5 rounded-lg border border-dashboard">
                {insight}
            </p>
        </div>
    );
}
