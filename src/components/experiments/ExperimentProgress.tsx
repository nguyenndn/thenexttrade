"use client";

import React, { useState } from "react";
import { ImprovementExperimentView } from "@/lib/trader-growth/types";
import { Activity, CheckCircle2, XCircle, ArrowRight, ShieldAlert, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cancelExperiment, reviewAndCompleteExperiment, addExperimentAsTradingRule } from "@/actions/improvement-experiments";
import { toast } from "sonner";

interface ExperimentProgressProps {
    experiment: ImprovementExperimentView;
}

export function ExperimentProgress({ experiment }: ExperimentProgressProps) {
    const [isLoading, setIsLoading] = useState(false);

    const handleReview = async () => {
        setIsLoading(true);
        try {
            const res = await reviewAndCompleteExperiment(experiment.id);
            if (res.success) {
                toast.success(`Experiment evaluated: ${res.outcome}`);
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to review experiment");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm("Are you sure you want to cancel this active experiment?")) return;
        setIsLoading(true);
        try {
            await cancelExperiment(experiment.id);
            toast.success("Experiment cancelled.");
        } catch (err: any) {
            toast.error(err.message || "Failed to cancel experiment");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddRule = async () => {
        setIsLoading(true);
        try {
            const res = await addExperimentAsTradingRule(experiment.id);
            if (res.created) {
                toast.success("Added action to My Trading Rules!");
            } else {
                toast.info("Rule already exists in My Trading Rules.");
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to add rule");
        } finally {
            setIsLoading(false);
        }
    };

    const isReady = experiment.status === "READY_FOR_REVIEW" || experiment.progressPercent >= 100;

    return (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-emerald-50/70 via-slate-50 to-cyan-50/50 dark:from-slate-900 dark:via-slate-900 dark:to-slate-950 border border-emerald-200 dark:border-emerald-500/30 shadow-xl space-y-4 text-slate-900 dark:text-white">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                        <Activity className="w-5 h-5" />
                    </div>
                    <div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                            Active Measurable Experiment
                        </span>
                        <h3 className="text-base font-bold text-slate-900 dark:text-white">{experiment.title}</h3>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {experiment.status === "COMPLETED" && experiment.outcome === "IMPROVED" && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleAddRule}
                            disabled={isLoading}
                            className="text-xs gap-1 rounded-xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                        >
                            <PlusCircle className="w-3.5 h-3.5" />
                            Add Rule
                        </Button>
                    )}
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="text-xs border-slate-300 dark:border-slate-700 text-slate-500 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-xl"
                    >
                        Cancel
                    </Button>
                </div>
            </div>

            <p className="text-xs text-slate-700 dark:text-slate-300 bg-white/80 dark:bg-slate-950/60 p-3 rounded-xl border border-slate-200 dark:border-slate-800/60">
                <strong className="text-slate-900 dark:text-slate-200">Instruction:</strong> {experiment.instruction}
            </p>

            {/* Progress Bar */}
            <div className="space-y-2">
                <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-slate-600 dark:text-slate-400">Follow-up Execution Trades</span>
                    <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                        {experiment.currentTradeCount} / {experiment.targetTradeCount} trades ({experiment.progressPercent}%)
                    </span>
                </div>
                <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-950 overflow-hidden border border-slate-300 dark:border-slate-800">
                    <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(100, Math.max(5, experiment.progressPercent))}%` }}
                    />
                </div>
            </div>

            <div className="flex items-center justify-between pt-1">
                <div className="text-xs text-slate-600 dark:text-slate-400">
                    <span>{experiment.baselineSummary}</span>
                </div>

                {isReady ? (
                    <Button
                        variant="primary"
                        size="sm"
                        onClick={handleReview}
                        disabled={isLoading}
                        className="bg-emerald-500 hover:bg-emerald-600 text-slate-950 font-bold gap-1 rounded-xl"
                    >
                        Review Results
                        <ArrowRight className="w-4 h-4" />
                    </Button>
                ) : (
                    <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                        <ShieldAlert className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                        Trade on MT5 to advance experiment
                    </span>
                )}
            </div>
        </div>
    );
}
