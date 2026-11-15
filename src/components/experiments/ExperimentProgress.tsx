"use client";

import React, { useState } from "react";
import { ImprovementExperimentView } from "@/lib/trader-growth/types";
import { Activity, ArrowRight, ShieldAlert, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cancelExperiment, reviewAndCompleteExperiment, addExperimentAsTradingRule } from "@/actions/improvement-experiments";
import { toast } from "sonner";

interface ExperimentProgressProps {
    experiment: ImprovementExperimentView;
}

export function ExperimentProgress({ experiment }: ExperimentProgressProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [showCancelConfirm, setShowCancelConfirm] = useState(false);

    const handleReview = async () => {
        setIsLoading(true);
        try {
            const res = await reviewAndCompleteExperiment(experiment.id);
            if (res.success) {
                toast.success(`Experiment evaluated: ${res.outcome}`);
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to review experiment");
        } finally {
            setIsLoading(false);
        }
    };

    const handleConfirmCancel = async () => {
        setIsLoading(true);
        try {
            await cancelExperiment(experiment.id);
            setShowCancelConfirm(false);
            toast.success("Experiment cancelled.");
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to cancel experiment");
        } finally {
            setIsLoading(false);
        }
    };

    const handleAddRule = async () => {
        setIsLoading(true);
        try {
            const res = await addExperimentAsTradingRule(experiment.id);
            if (res.created) {
                toast.success("Added action to My Trading Rules.");
            } else {
                toast.info("Rule already exists in My Trading Rules.");
            }
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to add rule");
        } finally {
            setIsLoading(false);
        }
    };

    const isReady = experiment.status === "READY_FOR_REVIEW" || experiment.progressPercent >= 100;

    return (
        <>
            <div className="p-4 sm:p-5 rounded-xl bg-white dark:bg-[#151925] border border-emerald-200 dark:border-emerald-500/30 shadow-sm space-y-4 text-slate-900 dark:text-white min-w-0">
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="flex items-start gap-2.5 min-w-0 flex-1">
                        <div className="p-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 shrink-0">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div className="min-w-0">
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                                Active 10-Trade Sprint
                            </span>
                            <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white break-words">
                                {experiment.title}
                            </h3>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {experiment.status === "COMPLETED" && experiment.outcome === "IMPROVED" && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleAddRule}
                                disabled={isLoading}
                                className="text-xs gap-1 rounded-lg border-gray-200 dark:border-slate-700 text-slate-700 dark:text-slate-200"
                            >
                                <PlusCircle className="w-3.5 h-3.5" />
                                Add Rule
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShowCancelConfirm(true)}
                            disabled={isLoading}
                            className="text-xs border-gray-200 dark:border-slate-700 text-slate-600 hover:text-red-600 dark:text-slate-400 dark:hover:text-red-400 rounded-lg"
                        >
                            Cancel
                        </Button>
                    </div>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-[#0B0E14] p-3 rounded-lg border border-gray-200 dark:border-slate-800 break-words leading-relaxed">
                    <strong className="text-slate-900 dark:text-slate-200">Instruction:</strong>{" "}
                    {experiment.instruction}
                </p>

                {/* Progress Bar */}
                <div className="space-y-2">
                    <div className="flex flex-wrap justify-between items-center gap-1.5 text-xs font-semibold">
                        <span className="text-slate-600 dark:text-slate-400">Follow-up Execution Trades</span>
                        <span className="text-emerald-600 dark:text-emerald-400 font-mono tabular-nums font-bold">
                            {experiment.currentTradeCount} / {experiment.targetTradeCount} trades ({experiment.progressPercent}%)
                        </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-100 dark:bg-[#0B0E14] overflow-hidden border border-gray-200 dark:border-slate-800">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(5, experiment.progressPercent))}%` }}
                        />
                    </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-1">
                    <div className="text-xs text-slate-600 dark:text-slate-400 min-w-0 break-words">
                        <span>{experiment.baselineSummary}</span>
                    </div>

                    {isReady ? (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleReview}
                            disabled={isLoading}
                            className="bg-gold hover:bg-amber-600 text-white font-bold gap-1 rounded-lg shadow-md shadow-amber-500/20 border-none"
                        >
                            Review Results
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    ) : (
                        <span className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
                            Log or sync trades to advance sprint
                        </span>
                    )}
                </div>
            </div>

            <ConfirmDialog
                isOpen={showCancelConfirm}
                title="Cancel Active Sprint"
                description="Are you sure you want to cancel this active 10-trade sprint? Current progress will not be evaluated."
                confirmText="Cancel Sprint"
                cancelText="Keep Active"
                variant="danger"
                isLoading={isLoading}
                onConfirm={handleConfirmCancel}
                onCancel={() => setShowCancelConfirm(false)}
            />
        </>
    );
}
