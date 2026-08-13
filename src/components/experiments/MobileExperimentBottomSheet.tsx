"use client";

import React, { useState } from "react";
import { Activity, X, PlusCircle, ArrowRight, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { ImprovementExperimentView } from "@/lib/trader-growth/types";
import { cancelExperiment, reviewAndCompleteExperiment, addExperimentAsTradingRule } from "@/actions/improvement-experiments";
import { toast } from "sonner";

interface MobileExperimentBottomSheetProps {
    experiment: ImprovementExperimentView;
    isOpen: boolean;
    onClose: () => void;
}

export function MobileExperimentBottomSheet({
    experiment,
    isOpen,
    onClose,
}: MobileExperimentBottomSheetProps) {
    const [isLoading, setIsLoading] = useState(false);

    if (!isOpen) return null;

    const isReady = experiment.status === "READY_FOR_REVIEW" || experiment.progressPercent >= 100;

    const handleReview = async () => {
        setIsLoading(true);
        try {
            const res = await reviewAndCompleteExperiment(experiment.id);
            if (res.success) {
                toast.success(`Experiment evaluated: ${res.outcome}`);
                onClose();
            }
        } catch (err: any) {
            toast.error(err.message || "Failed to review experiment");
        } finally {
            setIsLoading(false);
        }
    };

    const handleCancel = async () => {
        if (!confirm("Cancel active experiment?")) return;
        setIsLoading(true);
        try {
            await cancelExperiment(experiment.id);
            toast.success("Experiment cancelled.");
            onClose();
        } catch (err: any) {
            toast.error(err.message || "Failed to cancel experiment");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="w-full max-w-lg p-6 bg-white dark:bg-[#0B0E14] border-t sm:border border-gray-200 dark:border-slate-800 rounded-t-3xl sm:rounded-2xl shadow-2xl space-y-4 text-slate-900 dark:text-white">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800 pb-3">
                    <div className="flex items-center gap-2">
                        <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                            <Activity className="w-5 h-5" />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider block">
                                Active 10-Trade Experiment
                            </span>
                            <h3 className="text-sm font-bold text-slate-900 dark:text-white truncate max-w-[220px]">
                                {experiment.title}
                            </h3>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white"
                        aria-label="Close"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <p className="text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 p-3 rounded-xl border border-gray-200 dark:border-slate-800">
                    <strong>Instruction:</strong> {experiment.instruction}
                </p>

                {/* Progress bar */}
                <div className="space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                        <span className="text-slate-500 dark:text-slate-400">Execution Progress:</span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                            {experiment.currentTradeCount} / {experiment.targetTradeCount} trades ({experiment.progressPercent}%)
                        </span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min(100, Math.max(5, experiment.progressPercent))}%` }}
                        />
                    </div>
                </div>

                {/* Actions */}
                <div className="flex items-center justify-between pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleCancel}
                        disabled={isLoading}
                        className="text-xs text-slate-500 hover:text-red-600 rounded-xl"
                    >
                        Cancel
                    </Button>

                    {isReady ? (
                        <Button
                            variant="primary"
                            size="sm"
                            onClick={handleReview}
                            disabled={isLoading}
                            className="bg-emerald-500 text-slate-950 font-bold text-xs gap-1 rounded-xl"
                        >
                            Review Results
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    ) : (
                        <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5 text-cyan-500" />
                            Trade on MT5 to advance
                        </span>
                    )}
                </div>
            </div>
        </div>
    );
}
