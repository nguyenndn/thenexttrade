"use client";

import React from "react";
import { DataConfidenceView } from "@/lib/trader-growth/types";
import { X, ShieldCheck, AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface DataEvidenceDrawerProps {
    isOpen: boolean;
    onClose: () => void;
    confidence: DataConfidenceView;
}

export function DataEvidenceDrawer({
    isOpen,
    onClose,
    confidence,
}: DataEvidenceDrawerProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 dark:bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="relative w-full max-w-lg p-6 bg-white dark:bg-[#0B0E14] border border-gray-200 dark:border-slate-800 rounded-2xl shadow-2xl space-y-5 text-slate-900 dark:text-white">
                <div className="flex items-center justify-between border-b border-gray-200 dark:border-slate-800/80 pb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                            <ShieldCheck className="w-5 h-5" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-slate-900 dark:text-white">Data Confidence & Evidence</h3>
                            <p className="text-xs text-slate-500 dark:text-slate-400">Audit details behind system observations</p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-800 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                        aria-label="Close modal"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="space-y-4">
                    {/* Score Bar */}
                    <div className="p-4 rounded-xl bg-slate-50 dark:bg-slate-900/80 border border-gray-200 dark:border-slate-800/80 space-y-2">
                        <div className="flex justify-between items-center text-sm font-semibold">
                            <span className="text-slate-700 dark:text-slate-300">Confidence Score</span>
                            <span className="text-emerald-600 dark:text-emerald-400 font-bold">{confidence.score}/100 ({confidence.level})</span>
                        </div>
                        <div className="w-full h-2.5 rounded-full bg-gray-200 dark:bg-slate-800 overflow-hidden">
                            <div
                                className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 rounded-full transition-all duration-500"
                                style={{ width: `${Math.min(100, Math.max(5, confidence.score))}%` }}
                            />
                        </div>
                    </div>

                    {/* Facts Grid */}
                    <div className="grid grid-cols-2 gap-3 text-xs">
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800">
                            <span className="text-slate-500 dark:text-slate-400 block mb-1">Closed Trade Sample</span>
                            <span className="text-base font-bold text-slate-900 dark:text-white">{confidence.sampleSize} trades</span>
                        </div>
                        <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/50 border border-gray-200 dark:border-slate-800">
                            <span className="text-slate-500 dark:text-slate-400 block mb-1">Sync Freshness</span>
                            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1">
                                <RefreshCw className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 inline" />
                                {confidence.lastSyncAt ? new Date(confidence.lastSyncAt).toLocaleDateString() : "Live Sync"}
                            </span>
                        </div>
                    </div>

                    {/* Reasons list */}
                    {confidence.reasons.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">Validated Facts</h4>
                            <div className="space-y-1.5">
                                {confidence.reasons.map((r, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300">
                                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 dark:text-emerald-400 mt-0.5 shrink-0" />
                                        <span>{r}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Warnings list */}
                    {confidence.warnings.length > 0 && (
                        <div className="space-y-2">
                            <h4 className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">Data Cautions</h4>
                            <div className="space-y-1.5">
                                {confidence.warnings.map((w, i) => (
                                    <div key={i} className="flex items-start gap-2 text-xs text-amber-700 dark:text-amber-300">
                                        <AlertTriangle className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 mt-0.5 shrink-0" />
                                        <span>{w}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-2">
                    <Button variant="outline" onClick={onClose} className="rounded-xl">
                        Close
                    </Button>
                </div>
            </div>
        </div>
    );
}
