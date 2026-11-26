"use client";

import { Layers, Scale } from "lucide-react";
import type { PsychologyDiagnosticReport } from "@/lib/analytics/psychology-engine.server";
import { formatDashboardCurrency } from "@/lib/utils/cent-account";
import { HoldDurationCard } from "./HoldDurationCard";
import { formatCompactCurrency } from "./utils/chartHelpers";

interface ExecutionDiagnosticCardsProps {
    data: PsychologyDiagnosticReport;
}

export function ExecutionDiagnosticCards({ data }: ExecutionDiagnosticCardsProps) {
    const { currency = "USD", insufficientData, disposition, payoff, streakCadence, rrOptimizer } = data;
    const isPositiveExpectancy = payoff.expectancyPerTrade >= 0;
    const optimalRR = !insufficientData
        ? rrOptimizer.find((r) => r.isOptimal) || rrOptimizer[0]
        : null;

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
            <HoldDurationCard disposition={disposition} />

            {/* 2. Realized Payoff & Expectancy */}
            <div className="p-5 rounded-xl bg-white dark:bg-[#1E2028] border border-dashboard dark:border-white/[0.08] shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                            <Scale className="w-4 h-4 text-primary shrink-0" />
                            Payoff & Expectancy
                        </span>
                        <span
                            className={`px-2 py-0.5 rounded-lg text-[10px] font-bold tabular-nums uppercase shrink-0 ${
                                isPositiveExpectancy
                                    ? "bg-primary/10 text-primary border border-primary/20"
                                    : "bg-red-500/10 text-red-500 border border-red-500/20"
                            }`}
                        >
                            Payoff 1:{payoff.payoffRatio}
                        </span>
                    </div>

                    <div className="rounded-xl border border-dashboard grid grid-cols-2 divide-x divide-y divide-gray-200 dark:divide-white/[0.08] bg-gray-50/60 dark:bg-[#151925]">
                        <div className="p-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Avg Win / Loss</span>
                            <span className="text-sm font-bold tabular-nums text-gray-700 dark:text-white block mt-0.5">
                                <span className="text-primary">{formatCompactCurrency(payoff.avgWin, currency)}</span>
                                {" / "}
                                <span className="text-red-500">{formatCompactCurrency(-payoff.avgLoss, currency)}</span>
                            </span>
                        </div>
                        <div className="p-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Expectancy / Trade</span>
                            <span className={`text-sm font-bold tabular-nums block mt-0.5 ${isPositiveExpectancy ? "text-primary" : "text-red-500"}`}>
                                {formatDashboardCurrency(payoff.expectancyPerTrade, currency, { signDisplay: "always" })}
                            </span>
                        </div>
                        <div className="p-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Breakeven WR</span>
                            <span className="text-sm font-bold tabular-nums text-gray-700 dark:text-white block mt-0.5">
                                {payoff.breakevenWinRate}% <span className="text-[11px] font-medium text-gray-500">(Actual {payoff.winRate}%)</span>
                            </span>
                        </div>
                        <div className="p-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">{optimalRR ? "Optimal SL Cap" : "Profit Factor"}</span>
                            <span className="text-sm font-bold tabular-nums text-gray-700 dark:text-white block mt-0.5">
                                {optimalRR ? `1:${optimalRR.targetRR}R (${optimalRR.simulatedWinRate}%)` : payoff.profitFactor >= 99 ? "99+" : payoff.profitFactor.toFixed(2)}
                            </span>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50/80 dark:bg-[#151925] p-2.5 rounded-lg border border-dashboard dark:border-white/[0.06]">
                    {payoff.insight}
                </p>
            </div>

            {/* 3. Streak & Basket-Aware Cadence */}
            <div className="p-5 rounded-xl bg-white dark:bg-[#1E2028] border border-dashboard dark:border-white/[0.08] shadow-sm flex flex-col justify-between space-y-4">
                <div className="space-y-3.5">
                    <div className="flex items-center justify-between gap-2">
                        <span className="text-xs font-bold uppercase tracking-wider text-gray-500 flex items-center gap-1.5">
                            <Layers className="w-4 h-4 text-primary shrink-0" />
                            Streak & Setup Cadence
                        </span>
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-bold tabular-nums uppercase shrink-0 bg-primary/10 text-primary border border-primary/20">
                            {streakCadence.isBasketStyle ? `Basket ${streakCadence.avgTicketsPerCluster}x` : "Single-Shot"}
                        </span>
                    </div>

                    <div className="rounded-xl border border-dashboard grid grid-cols-2 divide-x divide-y divide-gray-200 dark:divide-white/[0.08] bg-gray-50/60 dark:bg-[#151925]">
                        <div className="p-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Position Setups</span>
                            <span className="text-sm font-bold tabular-nums text-gray-700 dark:text-white block mt-0.5">
                                {streakCadence.clusterCount.toLocaleString()} clusters
                            </span>
                        </div>
                        <div className="p-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Max Streak</span>
                            <span className="text-sm font-bold tabular-nums block mt-0.5">
                                <span className="text-primary">{streakCadence.maxWinStreak}W</span>
                                {" / "}
                                <span className="text-red-500">{streakCadence.maxLossStreak}L</span>
                            </span>
                        </div>
                        <div className="p-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Post-Loss Recovery</span>
                            <span className="text-sm font-bold tabular-nums text-gray-700 dark:text-white block mt-0.5">
                                {streakCadence.postLossWinRate}% WR
                            </span>
                        </div>
                        <div className="p-2.5">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">Worst Day P&L</span>
                            <span className="text-sm font-bold tabular-nums text-red-500 block mt-0.5">
                                {streakCadence.worstDayPnl < 0 ? formatCompactCurrency(streakCadence.worstDayPnl, currency) : "None"}
                            </span>
                        </div>
                    </div>
                </div>

                <p className="text-xs text-gray-600 dark:text-gray-300 bg-gray-50/80 dark:bg-[#151925] p-2.5 rounded-lg border border-dashboard dark:border-white/[0.06]">
                    {streakCadence.insight}
                </p>
            </div>
        </div>
    );
}
