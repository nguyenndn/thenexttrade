"use client";

import React from "react";
import { Brain, Flame, Clock, TrendingUp, AlertTriangle, ShieldCheck, Target } from "lucide-react";
import { PsychologyDiagnosticReport } from "@/lib/analytics/psychology-engine.server";
import { DataConfidenceBadge } from "@/components/insights/DataConfidenceBadge";
import { DataConfidenceView } from "@/lib/trader-growth/types";

interface TradingPsychologyPanelProps {
    data: PsychologyDiagnosticReport;
    confidence?: DataConfidenceView;
}

export function TradingPsychologyPanel({ data, confidence }: TradingPsychologyPanelProps) {
    const { disposition, tilt, rrOptimizer } = data;

    const isHighDisposition = disposition.severity === "HIGH";
    const isHighTilt = tilt.severity === "HIGH";

    const optimalRR = rrOptimizer.find((r) => r.isOptimal) || rrOptimizer[1];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-600 dark:text-purple-400">
                        <Brain className="w-5 h-5" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Trading Psychology & Execution Diagnostic</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">Behavioral pattern analysis & risk-reward optimization</p>
                    </div>
                </div>
                {confidence && (
                    <div className="shrink-0 self-start sm:self-auto">
                        <DataConfidenceBadge confidence={confidence} />
                    </div>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 1. Disposition Effect Card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E2028] border border-dashboard dark:border-white/[0.08] shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-cyan-500" />
                            Holding Time Ratio
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                            isHighDisposition
                                ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        }`}>
                            {disposition.dispositionRatio}x Ratio
                        </span>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-emerald-600 dark:text-emerald-400 font-semibold">Avg Hold Win:</span>
                            <span className="font-bold text-slate-900 dark:text-white">{disposition.avgHoldTimeWinMinutes} min</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-red-600 dark:text-red-400 font-semibold">Avg Hold Loss:</span>
                            <span className="font-bold text-slate-900 dark:text-white">{disposition.avgHoldTimeLossMinutes} min</span>
                        </div>

                        {/* Ratio visual bar */}
                        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden flex">
                            <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(80, Math.max(20, 100 / (1 + disposition.dispositionRatio)))}%` }} />
                            <div className="bg-red-500 h-full flex-1" />
                        </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/[0.04] p-2.5 rounded-xl border border-dashboard dark:border-white/[0.06]">
                        {disposition.insight}
                    </p>
                </div>

                {/* 2. Tilt & Revenge Trading Vulnerability Card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E2028] border border-dashboard dark:border-white/[0.08] shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Flame className="w-4 h-4 text-amber-500" />
                            Tilt & Revenge Index
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase ${
                            isHighTilt
                                ? "bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20"
                                : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                        }`}>
                            Score: {tilt.tiltScore}/100
                        </span>
                    </div>

                    <div className="space-y-2">
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-slate-600 dark:text-slate-400">Revenge Re-entries:</span>
                            <span className="font-bold text-slate-900 dark:text-white">{tilt.revengeTradesCount} trades</span>
                        </div>

                        {/* Gauge bar */}
                        <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                                className={`h-full transition-all duration-500 ${
                                    tilt.tiltScore >= 50
                                        ? "bg-red-500"
                                        : tilt.tiltScore >= 20
                                        ? "bg-amber-500"
                                        : "bg-emerald-500"
                                }`}
                                style={{ width: `${Math.min(100, Math.max(5, tilt.tiltScore))}%` }}
                            />
                        </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-white/[0.04] p-2.5 rounded-xl border border-dashboard dark:border-white/[0.06]">
                        {tilt.insight}
                    </p>
                </div>

                {/* 3. Optimal Risk-Reward Simulator Card */}
                <div className="p-5 rounded-2xl bg-white dark:bg-[#1E2028] border border-dashboard dark:border-white/[0.08] shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Target className="w-4 h-4 text-emerald-500" />
                            Optimal R:R Simulator
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                            Recommended: 1:{optimalRR?.targetRR || 1.5}
                        </span>
                    </div>

                    <div className="space-y-1.5 text-xs">
                        {rrOptimizer.map((opt) => (
                            <div
                                key={opt.targetRR}
                                className={`flex justify-between items-center p-2 rounded-xl border ${
                                    opt.isOptimal
                                        ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/30 font-bold"
                                        : "bg-slate-50 dark:bg-white/[0.04] border-dashboard dark:border-white/[0.06] text-slate-600 dark:text-slate-400"
                                }`}
                            >
                                <span>Target 1:{opt.targetRR} R:R</span>
                                <span className={opt.isOptimal ? "text-emerald-600 dark:text-emerald-400" : ""}>
                                    ${opt.simulatedNetPnL} ({opt.simulatedWinRate}%)
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
