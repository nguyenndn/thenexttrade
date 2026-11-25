"use client";

import { useState, useMemo } from "react";
import { BarChart2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PlaybookComparisonCard, PlaybookSummary } from "./PlaybookComparisonCard";
import { StrategyPerformanceChart } from "./StrategyPerformanceChart";
import { StrategyComparisonTable } from "./StrategyComparisonTable";
import { StrategiesLoadingSkeleton } from "./StrategiesLoadingSkeleton";
import { RuleDisciplineAdvisorCard } from "./RuleDisciplineAdvisorCard";
import { formatDashboardCurrency } from "@/lib/utils/cent-account";
import { cn } from "@/lib/utils";
import type { StrategyPerformance } from "./StrategyManager";
import type { RuleComplianceStat } from "@/lib/strategies/rule-compliance-metrics";

export type { RuleComplianceStat };

interface StrategyCompliancePanelProps {
    summary?: PlaybookSummary;
    enrichedPerformance: StrategyPerformance[];
    isLoadingPerformance: boolean;
    currency: string;
    complianceStats: RuleComplianceStat[];
}

type RuleScopeFilter = "all" | "playbook" | "global";

export function StrategyCompliancePanel({
    summary,
    enrichedPerformance,
    isLoadingPerformance,
    currency,
    complianceStats,
}: StrategyCompliancePanelProps) {
    const [scopeFilter, setScopeFilter] = useState<RuleScopeFilter>("all");

    const filteredStats = useMemo(() => {
        if (scopeFilter === "playbook") {
            return complianceStats.filter((s) => Boolean(s.strategyId));
        }
        if (scopeFilter === "global") {
            return complianceStats.filter((s) => !s.strategyId);
        }
        return complianceStats;
    }, [complianceStats, scopeFilter]);

    return (
        <div className="space-y-4 md:space-y-6">
            {isLoadingPerformance ? (
                <StrategiesLoadingSkeleton />
            ) : (
                <div className="space-y-4">
                    {summary && (
                        <PlaybookComparisonCard
                            summary={summary}
                            currency={currency}
                        />
                    )}
                    {enrichedPerformance.length > 0 && (
                        <>
                            <StrategyPerformanceChart
                                data={enrichedPerformance}
                                currency={currency}
                            />
                            <StrategyComparisonTable
                                data={enrichedPerformance}
                                currency={currency}
                            />
                        </>
                    )}
                </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 md:gap-6">
                {/* Per-Rule Edge & Compliance Table (7 cols) */}
                <div className="lg:col-span-7 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 p-4 sm:p-5 rounded-xl flex flex-col">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3">
                        <div>
                            <h3 className="text-sm font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                <BarChart2 size={16} className="text-primary" />
                                <span>Per-Rule P&amp;L &amp; Compliance</span>
                            </h3>
                            <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-0.5">
                                Ungraded &amp; skipped trades are excluded from violations • Closed-trade P&amp;L only.
                            </p>
                        </div>

                        <div className="inline-flex items-center gap-1 p-1 rounded-lg bg-gray-50 dark:bg-white/5 border border-dashboard self-start sm:self-auto">
                            {(
                                [
                                    { key: "all", label: "All" },
                                    { key: "playbook", label: "Strategies" },
                                    { key: "global", label: "Global" },
                                ] as const
                            ).map((item) => (
                                <Button
                                    key={item.key}
                                    type="button"
                                    size="sm"
                                    variant={
                                        scopeFilter === item.key ? "gold" : "ghost"
                                    }
                                    onClick={() => setScopeFilter(item.key)}
                                    className="h-auto px-2.5 py-1 rounded-lg text-[11px] font-bold"
                                >
                                    {item.label}
                                </Button>
                            ))}
                        </div>
                    </div>

                    {filteredStats.length === 0 ? (
                        <p className="text-xs text-gray-500 dark:text-gray-400 py-8 text-center">
                            No rules found for this filter. Add rules to your strategies or global rulebook, then grade trades in the journal.
                        </p>
                    ) : (
                        <div className="divide-y divide-gray-100 dark:divide-white/5 max-h-[440px] overflow-y-auto custom-scrollbar pr-1">
                            {filteredStats.map((stat) => {
                                const rate = stat.complianceRate;
                                const rateColor =
                                    rate === null
                                        ? "text-gray-400"
                                        : rate >= 75
                                            ? "text-emerald-500"
                                            : rate >= 50
                                                ? "text-amber-500"
                                                : "text-red-500";

                                return (
                                    <div
                                        key={stat.ruleId}
                                        className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                                    >
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-1.5 flex-wrap mb-1">
                                                <span className="px-1.5 py-0.5 rounded-lg text-[9px] font-black uppercase bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-gray-400">
                                                    {stat.category}
                                                </span>
                                                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-lg text-[9px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                                                    {stat.strategyName ? (
                                                        <>
                                                            <span
                                                                className="w-1.5 h-1.5 rounded-full shrink-0"
                                                                style={{
                                                                    backgroundColor:
                                                                        stat.strategyColor ||
                                                                        "#F59E0B",
                                                                }}
                                                            />
                                                            {stat.strategyName}
                                                        </>
                                                    ) : (
                                                        "Global Rule"
                                                    )}
                                                </span>
                                            </div>
                                            <p className="text-xs font-bold text-gray-800 dark:text-gray-100 leading-snug">
                                                {stat.ruleTitle}
                                            </p>
                                            <p className="text-[10px] text-gray-400 dark:text-gray-500 font-semibold font-mono tabular-nums mt-0.5">
                                                {stat.followed} Followed · {stat.broken} Broken
                                                {stat.skipped > 0
                                                    ? ` · ${stat.skipped} N/A`
                                                    : ""}
                                            </p>
                                        </div>

                                        {/* Right Telemetry Pills: Followed Edge vs Broken Cost + Compliance % */}
                                        <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                                            <div className="flex items-center gap-2 text-right font-mono tabular-nums">
                                                <div className="px-2 py-1 rounded-lg bg-emerald-500/[0.06] border border-emerald-500/15">
                                                    <p className="text-[9px] font-bold uppercase text-gray-400">
                                                        Followed
                                                    </p>
                                                    <p
                                                        className={cn(
                                                            "text-[11px] font-black",
                                                            stat.followedClosedCount === 0
                                                                ? "text-gray-400"
                                                                : stat.followedPnL >= 0
                                                                    ? "text-emerald-500"
                                                                    : "text-red-500"
                                                        )}
                                                    >
                                                        {stat.followedClosedCount > 0
                                                            ? formatDashboardCurrency(
                                                                stat.followedPnL,
                                                                currency,
                                                                {
                                                                    signDisplay: "always",
                                                                    fractionDigits: 0,
                                                                }
                                                            )
                                                            : "—"}
                                                    </p>
                                                    <p className="text-[9px] text-gray-400">
                                                        {stat.followedWinRate !== null
                                                            ? `${stat.followedWinRate}% WR`
                                                            : "0 graded"}
                                                        {stat.followedProfitFactor !== null
                                                            ? ` · ${stat.followedProfitFactor} PF`
                                                            : ""}
                                                    </p>
                                                </div>

                                                <div className="px-2 py-1 rounded-lg bg-red-500/[0.05] border border-red-500/15">
                                                    <p className="text-[9px] font-bold uppercase text-gray-400">
                                                        Broken
                                                    </p>
                                                    <p
                                                        className={cn(
                                                            "text-[11px] font-black",
                                                            stat.brokenClosedCount === 0
                                                                ? "text-gray-400"
                                                                : stat.brokenPnL < 0
                                                                    ? "text-red-500"
                                                                    : "text-emerald-500"
                                                        )}
                                                    >
                                                        {stat.brokenClosedCount > 0
                                                            ? formatDashboardCurrency(
                                                                stat.brokenPnL,
                                                                currency,
                                                                {
                                                                    signDisplay: "always",
                                                                    fractionDigits: 0,
                                                                }
                                                            )
                                                            : "—"}
                                                    </p>
                                                    <p className="text-[9px] text-gray-400">
                                                        {stat.brokenWinRate !== null
                                                            ? `${stat.brokenWinRate}% WR`
                                                            : "0 broken"}
                                                    </p>
                                                </div>
                                            </div>

                                            <div className="min-w-[44px] text-right">
                                                <span
                                                    className={cn(
                                                        "text-sm font-black font-mono tabular-nums",
                                                        rateColor
                                                    )}
                                                >
                                                    {rate !== null ? `${rate}%` : "—"}
                                                </span>
                                                <p className="text-[9px] font-bold uppercase text-gray-400">
                                                    Obeyed
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>

                {/* Costliest Leak & Best Edge Advisor (5 cols) */}
                <div className="lg:col-span-5">
                    <RuleDisciplineAdvisorCard
                        complianceStats={filteredStats}
                        currency={currency}
                    />
                </div>
            </div>
        </div>
    );
}
