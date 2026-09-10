import React from "react";
import { Activity, ArrowRight, ShieldAlert, Sparkles, CheckCircle2 } from "lucide-react";
import { BehaviorClassification, StatusDotColor, SummaryChip } from "@/lib/admin/behavior/types";

interface UserNarrativeSummaryProps {
    classification?: BehaviorClassification | null;
}

export function UserNarrativeSummary({ classification }: UserNarrativeSummaryProps) {
    if (!classification) {
        return (
            <div className="rounded-xl border border-zinc-200/80 bg-white/70 p-5 backdrop-blur-sm dark:border-zinc-800 dark:bg-zinc-900/70 shadow-xs">
                <div className="flex items-center gap-2 text-zinc-500 dark:text-zinc-400 text-sm">
                    <Activity className="h-4 w-4" />
                    <span>Behavioral telemetry is being calculated...</span>
                </div>
            </div>
        );
    }

    const { dotColor, chips, narrativeParagraphs, actionSuggestion, group } = classification;

    // Pulse dot renderer with semantic accessible status
    const renderDot = (color: StatusDotColor) => {
        switch (color) {
            case "RED":
                return (
                    <div className="flex items-center gap-2" title="Urgent intervention required">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-rose-400 opacity-75"></span>
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-rose-500"></span>
                        </span>
                        <span className="text-xs font-semibold text-rose-600 dark:text-rose-400">
                            Critical Attention
                        </span>
                    </div>
                );
            case "YELLOW":
                return (
                    <div className="flex items-center gap-2" title="Monitoring or follow-up recommended">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75"></span>
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-amber-500"></span>
                        </span>
                        <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                            Needs Monitoring
                        </span>
                    </div>
                );
            case "GREEN":
                return (
                    <div className="flex items-center gap-2" title="Healthy steady execution">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500"></span>
                        </span>
                        <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                            Healthy & Steady
                        </span>
                    </div>
                );
            default:
                return (
                    <div className="flex items-center gap-2" title="Neutral telemetry">
                        <span className="inline-flex h-2.5 w-2.5 rounded-full bg-zinc-400 dark:bg-zinc-600"></span>
                        <span className="text-xs font-semibold text-zinc-500 dark:text-zinc-400">
                            Neutral Telemetry
                        </span>
                    </div>
                );
        }
    };

    const renderChipStyle = (variant: SummaryChip["variant"]) => {
        switch (variant) {
            case "destructive":
                return "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-300";
            case "warning":
                return "border-amber-200 bg-amber-50 text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300";
            case "success":
                return "border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-300";
            default:
                return "border-zinc-200 bg-zinc-100/80 text-zinc-700 dark:border-zinc-800 dark:bg-zinc-800/80 dark:text-zinc-300";
        }
    };

    return (
        <section
            aria-label="Trader behavioral summary"
            className="mb-6 rounded-xl border border-zinc-200/80 bg-white p-5 shadow-xs transition-colors dark:border-zinc-800 dark:bg-zinc-900/90"
        >
            {/* Header: Title & Pulse Status Dot */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-100 pb-3.5 dark:border-zinc-800/70">
                <div className="flex items-center gap-2.5">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        <Activity className="h-4 w-4" />
                    </div>
                    <div>
                        <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-400">
                            Executive Behavioral Radar
                        </h2>
                    </div>
                </div>

                <div>{renderDot(dotColor)}</div>
            </div>

            {/* Narrative Paragraphs */}
            <div className="mt-4 space-y-2">
                {narrativeParagraphs.map((paragraph, idx) => (
                    <p
                        key={idx}
                        className="text-sm font-normal leading-relaxed text-zinc-700 dark:text-zinc-200"
                    >
                        {paragraph}
                    </p>
                ))}
            </div>

            {/* Factual Chips */}
            {chips.length > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-1.5 pt-1">
                    {chips.map((chip, idx) => (
                        <span
                            key={idx}
                            className={`inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-medium ${renderChipStyle(
                                chip.variant
                            )}`}
                        >
                            {chip.label}
                        </span>
                    ))}
                </div>
            )}

            {/* Next Action Suggestion */}
            {actionSuggestion && (
                <div className="mt-4 flex items-start gap-2.5 rounded-lg border border-zinc-200/60 bg-zinc-50/80 p-3 text-xs text-zinc-700 dark:border-zinc-800/60 dark:bg-zinc-800/40 dark:text-zinc-300">
                    <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        Recommended Action:
                    </span>
                    <span className="flex-1 font-medium">{actionSuggestion.replace(/^→\s*/, "")}</span>
                </div>
            )}
        </section>
    );
}
