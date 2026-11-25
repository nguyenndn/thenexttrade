"use client";

import Link from "next/link";
import { format, parseISO } from "date-fns";
import {
    CheckCircle2,
    Circle,
    Flame,
    ArrowRight,
    ClipboardCheck,
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import type { DisciplineRitualData } from "@/lib/dashboard/discipline-ritual-types";

interface DailyDisciplineRitualProps {
    ritual: DisciplineRitualData;
    currentAccountId?: string;
}

export function DailyDisciplineRitual({
    ritual,
    currentAccountId,
}: DailyDisciplineRitualProps) {
    const accountQuery =
        currentAccountId && currentAccountId !== "all"
            ? `&accountId=${encodeURIComponent(currentAccountId)}`
            : "";

    let formattedFocusDate = ritual.focusDate;
    try {
        formattedFocusDate = format(parseISO(ritual.focusDate), "MMM dd");
    } catch {
        // Keep raw YYYY-MM-DD fallback
    }

    return (
        <div className="rounded-xl border border-dashboard bg-white dark:bg-[#1E2028] p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                {/* Left: Header + 3 Auto-Verified Tasks */}
                <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-center justify-between sm:justify-start gap-2.5 flex-wrap">
                        <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-amber-500/10 text-amber-600 dark:text-gold flex items-center justify-center shrink-0">
                                <ClipboardCheck size={15} />
                            </div>
                            <div>
                                <h3 className="text-xs sm:text-sm font-black text-gray-800 dark:text-white leading-tight">
                                    Daily Review Ritual
                                </h3>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                                    Auto-verified from real journal telemetry ·{" "}
                                    <span className="font-semibold text-gray-700 dark:text-gray-300">
                                        {ritual.isTodayFocus
                                            ? "Today"
                                            : `Latest Session (${formattedFocusDate})`}
                                    </span>
                                </p>
                            </div>
                        </div>

                        <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-[11px] font-black font-mono tabular-nums text-amber-600 dark:text-gold">
                            <Flame size={13} className="shrink-0" />
                            <span>{ritual.disciplineStreak}d Streak</span>
                        </div>
                    </div>

                    {/* 3 Ritual Pills */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                        {ritual.steps.map((step) => {
                            const href = `${step.href}${accountQuery}`;
                            return (
                                <Link
                                    key={step.id}
                                    href={href}
                                    className={cn(
                                        "group rounded-lg border px-3 py-2 flex items-center justify-between gap-2 transition-all",
                                        step.completed
                                            ? "bg-emerald-500/[0.05] border-emerald-500/25 text-emerald-700 dark:text-emerald-300"
                                            : "bg-gray-50/80 dark:bg-[#151925] border-dashboard hover:border-amber-500/40 text-gray-700 dark:text-gray-200"
                                    )}
                                >
                                    <div className="flex items-center gap-2 min-w-0">
                                        {step.completed ? (
                                            <CheckCircle2
                                                size={15}
                                                className="text-emerald-500 shrink-0"
                                            />
                                        ) : (
                                            <Circle
                                                size={15}
                                                className="text-amber-500/80 shrink-0"
                                            />
                                        )}
                                        <span className="text-xs font-bold truncate">
                                            {step.title}
                                        </span>
                                    </div>
                                    <span
                                        className={cn(
                                            "text-[11px] font-mono tabular-nums font-black shrink-0",
                                            step.completed
                                                ? "text-emerald-600 dark:text-emerald-400"
                                                : "text-gray-500 dark:text-gray-400 group-hover:text-amber-600 dark:group-hover:text-gold"
                                        )}
                                    >
                                        {step.completedCount}/{step.totalCount}
                                    </span>
                                </Link>
                            );
                        })}
                    </div>
                </div>

                {/* Right: 28-Day Discipline Consistency Strip + Quick Audit Action */}
                <div className="xl:border-l xl:border-gray-200 xl:dark:border-white/10 xl:pl-5 flex flex-col sm:flex-row xl:flex-col items-start sm:items-center xl:items-end justify-between gap-2.5 shrink-0">
                    <div className="space-y-1.5 w-full sm:w-auto">
                        <div className="flex items-center justify-between xl:justify-end gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-400">
                            <span>28-Day Review Consistency</span>
                            <span className="font-mono tabular-nums text-gray-600 dark:text-gray-300">
                                {ritual.completedStepsCount}/3 Done
                            </span>
                        </div>

                        <TooltipProvider delayDuration={100}>
                            <div className="grid grid-cols-14 gap-1">
                                {ritual.days.map((day) => {
                                    const cellClass =
                                        day.status === "DISCIPLINED"
                                            ? "bg-emerald-500 border-emerald-500/40"
                                            : day.status === "PARTIAL"
                                              ? "bg-amber-400/80 border-amber-500/40"
                                              : day.status === "UNREVIEWED"
                                                ? "bg-red-500/75 border-red-500/40"
                                                : "bg-gray-100 dark:bg-white/[0.06] border-transparent";

                                    return (
                                        <Tooltip key={day.date}>
                                            <TooltipTrigger asChild>
                                                <div
                                                    className={cn(
                                                        "w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-[3px] border transition-transform hover:scale-125",
                                                        cellClass
                                                    )}
                                                />
                                            </TooltipTrigger>
                                            <TooltipContent className="bg-gray-950 text-white border-none rounded-lg px-2.5 py-1.5 text-[11px] font-semibold">
                                                <p className="font-mono text-[10px] text-gray-400">
                                                    {day.date}
                                                </p>
                                                <p className="mt-0.5">
                                                    {day.tradeCount === 0
                                                        ? "No closed trades"
                                                        : `${day.reviewedCount}/${day.tradeCount} trades reviewed`}
                                                </p>
                                            </TooltipContent>
                                        </Tooltip>
                                    );
                                })}
                            </div>
                        </TooltipProvider>
                    </div>

                    {ritual.unreviewedLast28d > 0 && (
                        <Link
                            href={`/dashboard/journal?review=UNREVIEWED${accountQuery}`}
                            className="w-full sm:w-auto"
                        >
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                className="w-full sm:w-auto h-8 px-3 rounded-lg text-xs font-bold gap-1.5 border-amber-500/35 text-amber-600 dark:text-gold hover:bg-amber-500/10"
                            >
                                <span>
                                    Audit {ritual.unreviewedLast28d} Unreviewed
                                </span>
                                <ArrowRight size={13} />
                            </Button>
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
