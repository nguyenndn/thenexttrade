"use client";

import { AlertCircle, ShieldCheck, TrendingDown, TrendingUp } from "lucide-react";
import { formatDashboardCurrency } from "@/lib/utils/cent-account";
import type { RuleComplianceStat } from "@/lib/strategies/rule-compliance-metrics";

interface RuleDisciplineAdvisorCardProps {
    complianceStats: RuleComplianceStat[];
    currency: string;
}

export function RuleDisciplineAdvisorCard({
    complianceStats,
    currency,
}: RuleDisciplineAdvisorCardProps) {
    // Prioritize the rule whose violations caused the largest realized dollar loss,
    // falling back to highest broken frequency when P&L is flat.
    const costliestBroken = [...complianceStats]
        .filter((s) => s.broken > 0)
        .sort((a, b) => {
            if (a.brokenPnL !== b.brokenPnL) return a.brokenPnL - b.brokenPnL;
            return b.broken - a.broken;
        })[0];

    const topEdgeRule = [...complianceStats]
        .filter((s) => s.followed >= 2 && s.followedPnL > 0)
        .sort((a, b) => b.followedPnL - a.followedPnL)[0];

    const totalLeakCost = complianceStats.reduce(
        (acc, s) => (s.brokenPnL < 0 ? acc + s.brokenPnL : acc),
        0
    );

    return (
        <div className="bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-4 sm:p-5 rounded-xl flex flex-col justify-between gap-4">
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-2">
                    <h3 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <AlertCircle size={16} className="text-amber-500" />
                        <span>Discipline Leak Advisor</span>
                    </h3>
                    {totalLeakCost < 0 && (
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black font-mono tabular-nums bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
                            Leak Cost:{" "}
                            {formatDashboardCurrency(totalLeakCost, currency, {
                                signDisplay: "always",
                            })}
                        </span>
                    )}
                </div>

                {!costliestBroken ? (
                    <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20 space-y-2">
                        <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                            <ShieldCheck size={14} />
                            Zero Rule Violations Recorded
                        </p>
                        <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                            Grade your strategy and global rules inside each trade review to quantify which rules protect your capital and which violations drain equity.
                        </p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        <div className="p-4 bg-red-500/[0.04] dark:bg-red-500/[0.06] border border-red-500/20 rounded-xl space-y-2.5">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-[10px] font-black uppercase tracking-wider text-red-600 dark:text-red-400 flex items-center gap-1">
                                    <TrendingDown size={13} />
                                    Costliest Broken Rule
                                </span>
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                    {costliestBroken.strategyName || "Global Rule"}
                                </span>
                            </div>

                            <p className="text-sm font-black text-gray-800 dark:text-white leading-snug">
                                &ldquo;{costliestBroken.ruleTitle}&rdquo;
                            </p>

                            {/* 2x2 Matrix Specs Card */}
                            <div className="grid grid-cols-2 divide-x divide-y divide-gray-200/70 dark:divide-white/10 rounded-xl border border-gray-200/80 dark:border-white/10 bg-white/80 dark:bg-[#151925] overflow-hidden">
                                <div className="p-2.5">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                                        When Broken ({costliestBroken.broken}x)
                                    </p>
                                    <p className="text-xs font-black font-mono tabular-nums text-red-500 mt-0.5">
                                        {formatDashboardCurrency(
                                            costliestBroken.brokenPnL,
                                            currency,
                                            { signDisplay: "always" }
                                        )}
                                    </p>
                                </div>
                                <div className="p-2.5">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                                        When Followed ({costliestBroken.followed}x)
                                    </p>
                                    <p className="text-xs font-black font-mono tabular-nums text-emerald-500 mt-0.5">
                                        {formatDashboardCurrency(
                                            costliestBroken.followedPnL,
                                            currency,
                                            { signDisplay: "always" }
                                        )}
                                    </p>
                                </div>
                                <div className="p-2.5">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                                        Broken Win Rate
                                    </p>
                                    <p className="text-xs font-black font-mono tabular-nums text-gray-700 dark:text-gray-200 mt-0.5">
                                        {costliestBroken.brokenWinRate !== null
                                            ? `${costliestBroken.brokenWinRate}%`
                                            : "—"}
                                    </p>
                                </div>
                                <div className="p-2.5">
                                    <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">
                                        Followed Win Rate
                                    </p>
                                    <p className="text-xs font-black font-mono tabular-nums text-emerald-500 mt-0.5">
                                        {costliestBroken.followedWinRate !== null
                                            ? `${costliestBroken.followedWinRate}%`
                                            : "—"}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {topEdgeRule && (
                            <div className="p-3.5 rounded-xl bg-emerald-500/[0.04] dark:bg-emerald-500/[0.06] border border-emerald-500/20 flex items-center justify-between gap-3">
                                <div className="min-w-0">
                                    <p className="text-[10px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                                        <TrendingUp size={12} />
                                        Highest-Edge Rule When Followed
                                    </p>
                                    <p className="text-xs font-bold text-gray-800 dark:text-white truncate mt-0.5">
                                        {topEdgeRule.ruleTitle}
                                    </p>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs font-black font-mono tabular-nums text-emerald-500">
                                        {formatDashboardCurrency(
                                            topEdgeRule.followedPnL,
                                            currency,
                                            { signDisplay: "always" }
                                        )}
                                    </p>
                                    <p className="text-[10px] font-mono tabular-nums text-gray-400">
                                        {topEdgeRule.followedProfitFactor
                                            ? `${topEdgeRule.followedProfitFactor} PF`
                                            : `${topEdgeRule.followedWinRate ?? 0}% WR`}
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <p className="text-[11px] text-gray-500 dark:text-gray-400 leading-relaxed border-t border-gray-100 dark:border-white/5 pt-3">
                Lock hard pre-entry verification on your costliest broken rule for your next 10-trade sprint before increasing lot size.
            </p>
        </div>
    );
}
