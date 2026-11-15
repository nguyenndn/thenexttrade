"use client";

import React from "react";
import { ImprovementExperimentView } from "@/lib/trader-growth/types";
import { CheckCircle2, TrendingUp, TrendingDown, MinusCircle, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface ExperimentResultProps {
    experiment: ImprovementExperimentView;
    onClose?: () => void;
}

export function ExperimentResult({ experiment, onClose }: ExperimentResultProps) {
    const outcome = experiment.outcome || "NO_CHANGE";

    let outcomeColor =
        "text-slate-600 bg-slate-100 border-slate-200 dark:text-slate-300 dark:bg-[#0B0E14] dark:border-slate-700";
    let icon = <MinusCircle className="w-6 h-6 text-slate-500 dark:text-slate-400" />;
    let label = "No Material Change";

    if (outcome === "IMPROVED") {
        outcomeColor =
            "text-emerald-700 bg-emerald-50 border-emerald-200 dark:text-emerald-400 dark:bg-emerald-950/60 dark:border-emerald-500/30";
        icon = <TrendingUp className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />;
        label = "Performance Improved";
    } else if (outcome === "WORSE") {
        outcomeColor =
            "text-red-700 bg-red-50 border-red-200 dark:text-red-400 dark:bg-red-950/60 dark:border-red-500/30";
        icon = <TrendingDown className="w-6 h-6 text-red-600 dark:text-red-400" />;
        label = "Performance Declined";
    }

    return (
        <div className="p-4 sm:p-6 rounded-xl bg-white dark:bg-[#151925] border border-gray-200 dark:border-slate-800 shadow-2xl space-y-5 text-slate-900 dark:text-white max-w-lg w-full min-w-0 mx-auto">
            <div className="flex items-center gap-3 min-w-0">
                <div className={`p-3 rounded-lg border shrink-0 ${outcomeColor}`}>
                    {icon}
                </div>
                <div className="min-w-0">
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block">
                        Experiment Evaluated
                    </span>
                    <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white break-words">
                        {label}
                    </h3>
                </div>
            </div>

            <div className="p-3.5 sm:p-4 rounded-lg bg-slate-50 dark:bg-[#0B0E14] border border-gray-200 dark:border-slate-800 space-y-2.5 text-xs">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-gray-200 dark:border-slate-800 pb-2">
                    <span className="text-slate-500 dark:text-slate-400 shrink-0">Experiment Title</span>
                    <span className="font-semibold text-slate-900 dark:text-white sm:text-right break-words">
                        {experiment.title}
                    </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 border-b border-gray-200 dark:border-slate-800 py-2">
                    <span className="text-slate-500 dark:text-slate-400 shrink-0">Baseline Performance</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300 sm:text-right break-words">
                        {experiment.baselineSummary}
                    </span>
                </div>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1 pt-1">
                    <span className="text-slate-500 dark:text-slate-400 shrink-0">Follow-up Result</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 sm:text-right break-words">
                        {experiment.currentSummary || "Completed"}
                    </span>
                </div>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-400 italic leading-relaxed">
                Note: This evaluation measures performance changes during the test period and provides performance review support, not financial advice.
            </p>

            {onClose && (
                <div className="flex justify-end pt-2">
                    <Button variant="primary" onClick={onClose} className="bg-gold hover:bg-amber-600 text-white font-bold rounded-lg shadow-md shadow-amber-500/20 border-none w-full sm:w-auto">
                        Continue Trading
                    </Button>
                </div>
            )}
        </div>
    );
}
