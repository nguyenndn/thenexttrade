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

    let outcomeColor = "text-slate-300 bg-slate-900 border-slate-700";
    let icon = <MinusCircle className="w-6 h-6 text-slate-400" />;
    let label = "No Material Change";

    if (outcome === "IMPROVED") {
        outcomeColor = "text-emerald-400 bg-emerald-950/60 border-emerald-500/30";
        icon = <TrendingUp className="w-6 h-6 text-emerald-400" />;
        label = "Performance Improved!";
    } else if (outcome === "WORSE") {
        outcomeColor = "text-red-400 bg-red-950/60 border-red-500/30";
        icon = <TrendingDown className="w-6 h-6 text-red-400" />;
        label = "Performance Declined";
    }

    return (
        <div className="p-6 rounded-2xl bg-white dark:bg-[#0B0E14] border border-gray-200 dark:border-slate-800 shadow-2xl space-y-5 text-slate-900 dark:text-white max-w-lg mx-auto">
            <div className="flex items-center gap-3">
                <div className={`p-3 rounded-2xl border ${outcomeColor}`}>
                    {icon}
                </div>
                <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                        Experiment Evaluated
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{label}</h3>
                </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-gray-200 dark:border-slate-800 space-y-2 text-xs">
                <div className="flex justify-between border-b border-gray-200 dark:border-slate-800 pb-2">
                    <span className="text-slate-500 dark:text-slate-400">Experiment Title</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{experiment.title}</span>
                </div>
                <div className="flex justify-between border-b border-gray-200 dark:border-slate-800 py-2">
                    <span className="text-slate-500 dark:text-slate-400">Baseline Performance</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{experiment.baselineSummary}</span>
                </div>
                <div className="flex justify-between pt-2">
                    <span className="text-slate-500 dark:text-slate-400">Follow-up Result</span>
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400">{experiment.currentSummary || "Completed"}</span>
                </div>
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400 italic">
                Note: This evaluation measures performance changes during the test period and provides performance review support, not financial advice.
            </p>

            {onClose && (
                <div className="flex justify-end pt-2">
                    <Button variant="primary" onClick={onClose} className="bg-emerald-500 text-slate-950 font-bold rounded-xl">
                        Continue Trading
                    </Button>
                </div>
            )}
        </div>
    );
}
