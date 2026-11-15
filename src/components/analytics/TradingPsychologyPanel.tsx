"use client";

import React from "react";
import { Brain, Flame, Clock, Target } from "lucide-react";
import { PsychologyDiagnosticReport } from "@/lib/analytics/psychology-engine.server";
import { DataConfidenceBadge } from "@/components/insights/DataConfidenceBadge";
import { DataConfidenceView } from "@/lib/trader-growth/types";
import { EmptyStateCTAs } from "@/components/ui/EmptyStateCTAs";
import { formatDashboardCurrency } from "@/lib/utils/cent-account";

interface TradingPsychologyPanelProps {
    data: PsychologyDiagnosticReport;
    confidence?: DataConfidenceView;
}

export function TradingPsychologyPanel({ data, confidence }: TradingPsychologyPanelProps) {
    const {
        totalTrades,
        currency = "USD",
        insufficientData,
        validSlTradesCount,
        disposition,
        tilt,
        rrOptimizer,
    } = data;

    if (totalTrades === 0) {
        return (
            <div className="p-8 rounded-xl bg-white dark:bg-[#1E2028] border border-dashboard dark:border-white/[0.08] shadow-sm text-center space-y-4">
                <div className="w-12 h-12 mx-auto rounded-xl bg-gold/10 border border-gold/20 flex items-center justify-center text-amber-600 dark:text-gold">
                    <Brain className="w-6 h-6" />
                </div>
                <div className="max-w-md mx-auto space-y-1.5">
                    <h3 className="text-base font-bold text-slate-900 dark:text-white">
                        No Behavioral Telemetry Yet
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                        Sync your MT5 account or log your first closed trades to measure disposition ratio, post-loss tilt, and R-multiple targets.
                    </p>
                </div>
                <EmptyStateCTAs
                    primary={{ label: "Connect MT5 Account", href: "/dashboard/accounts" }}
                    secondary={{ label: "Log First Trade", href: "/dashboard/journal" }}
                />
            </div>
        );
    }

    const isHighDisposition = disposition.severity === "HIGH";
    const isHighTilt = tilt.severity === "HIGH";

    const optimalRR = rrOptimizer.find((r) => r.isOptimal) || rrOptimizer[0];

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 rounded-lg bg-gold/10 border border-gold/20 text-amber-600 dark:text-gold">
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
                <div className="p-5 rounded-xl bg-white dark:bg-[#1E2028] border border-dashboard dark:border-white/[0.08] shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Clock className="w-4 h-4 text-amber-600 dark:text-gold" />
                            Holding Time Ratio
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono tabular-nums uppercase ${
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
                            <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-white">{disposition.avgHoldTimeWinMinutes} min</span>
                        </div>
                        <div className="flex justify-between items-center text-xs">
                            <span className="text-red-600 dark:text-red-400 font-semibold">Avg Hold Loss:</span>
                            <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-white">{disposition.avgHoldTimeLossMinutes} min</span>
                        </div>

                        {/* Ratio visual bar */}
                        <div className="w-full h-2.5 bg-gray-100 dark:bg-[#151925] rounded-full overflow-hidden flex">
                            <div className="bg-emerald-500 h-full" style={{ width: `${Math.min(80, Math.max(20, 100 / (1 + disposition.dispositionRatio)))}%` }} />
                            <div className="bg-red-500 h-full flex-1" />
                        </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-gray-50/80 dark:bg-[#151925] p-2.5 rounded-lg border border-dashboard dark:border-white/[0.06]">
                        {disposition.insight}
                    </p>
                </div>

                {/* 2. Tilt & Revenge Trading Vulnerability Card */}
                <div className="p-5 rounded-xl bg-white dark:bg-[#1E2028] border border-dashboard dark:border-white/[0.08] shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Flame className="w-4 h-4 text-amber-600 dark:text-gold" />
                            Tilt & Revenge Index
                        </span>
                        <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono tabular-nums uppercase ${
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
                            <span className="font-bold font-mono tabular-nums text-slate-900 dark:text-white">{tilt.revengeTradesCount} trades</span>
                        </div>

                        {/* Gauge bar */}
                        <div className="w-full h-2.5 bg-gray-100 dark:bg-[#151925] rounded-full overflow-hidden">
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

                    <p className="text-xs text-slate-600 dark:text-slate-300 bg-gray-50/80 dark:bg-[#151925] p-2.5 rounded-lg border border-dashboard dark:border-white/[0.06]">
                        {tilt.insight}
                    </p>
                </div>

                {/* 3. Optimal Risk-Reward Simulator Card */}
                <div className="p-5 rounded-xl bg-white dark:bg-[#1E2028] border border-dashboard dark:border-white/[0.08] shadow-sm space-y-4 flex flex-col">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
                            <Target className="w-4 h-4 text-emerald-500" />
                            Optimal R:R Simulator
                        </span>
                        {!insufficientData && optimalRR ? (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono tabular-nums uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                Optimal: 1:{optimalRR.targetRR}
                            </span>
                        ) : (
                            <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold font-mono tabular-nums uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
                                {validSlTradesCount} / 5 SL Trades
                            </span>
                        )}
                    </div>

                    {insufficientData || rrOptimizer.length === 0 ? (
                        <div className="flex-1 flex flex-col justify-center p-3.5 rounded-lg bg-gray-50/80 dark:bg-[#151925] border border-dashboard dark:border-white/[0.06] text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                            <p className="font-semibold text-slate-800 dark:text-slate-200 mb-1">
                                Insufficient Stop Loss Data
                            </p>
                            <p>
                                Record a protective Stop Loss on at least 5 closed trades to simulate R-multiple Take Profit caps accurately.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-1.5 text-xs">
                            {rrOptimizer.map((opt) => (
                                <div
                                    key={opt.targetRR}
                                    className={`flex justify-between items-center p-2 rounded-lg border font-mono tabular-nums ${
                                        opt.isOptimal
                                            ? "bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-500/30 font-bold"
                                            : "bg-gray-50/80 dark:bg-[#151925] border-dashboard dark:border-white/[0.06] text-slate-600 dark:text-slate-400"
                                    }`}
                                >
                                    <span>Cap 1:{opt.targetRR}R</span>
                                    <span className={opt.isOptimal ? "text-emerald-600 dark:text-emerald-400" : ""}>
                                        {formatDashboardCurrency(
                                            opt.simulatedNetPnL,
                                            currency,
                                            { signDisplay: "always" }
                                        )}{" "}
                                        ({opt.simulatedWinRate}%)
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
