"use client";

import { BarChart2 } from "lucide-react";
import { ChartEmptyState } from "@/components/ui/ChartEmptyState";
import { formatDashboardCurrency } from "@/lib/utils/cent-account";
import { PairPerformanceRow } from "./PairPerformanceRow";
import {
    processPairPerformanceData,
    type PairPerformanceDataItem,
} from "./utils/chartHelpers";

interface PairPerformanceProps {
    data: PairPerformanceDataItem[];
    currency?: string;
}

export function PairPerformance({
    data,
    currency = "USD",
}: PairPerformanceProps) {
    const { isEmpty, chartData, bestPair, worstPair, maxAbsPnl } =
        processPairPerformanceData(data, 5);

    const totalLongTrades = data.reduce((s, d) => s + (d.longTrades ?? 0), 0);
    const totalShortTrades = data.reduce((s, d) => s + (d.shortTrades ?? 0), 0);
    const totalLongPnl = data.reduce((s, d) => s + (d.longPnl ?? 0), 0);
    const totalShortPnl = data.reduce((s, d) => s + (d.shortPnl ?? 0), 0);
    const showDirectionMatrix =
        !isEmpty &&
        chartData.length <= 2 &&
        (totalLongTrades > 0 || totalShortTrades > 0);

    return (
        <div className="bg-white dark:bg-[#1E2028] p-4 sm:p-6 rounded-xl border border-dashboard shadow-sm flex flex-col justify-between">
            <div>
                <div className="flex items-center justify-between gap-2.5 mb-4">
                    <div className="flex items-center gap-2.5">
                        <div className="p-2 bg-primary/10 rounded-lg text-primary">
                            <BarChart2 size={18} />
                        </div>
                        <div>
                            <h3 className="font-bold text-gray-700 dark:text-white text-sm">
                                Instrument & Direction Breakdown
                            </h3>
                            <p className="text-xs text-gray-500">
                                Realized net P&L, win rate, and Long vs Short split
                            </p>
                        </div>
                    </div>
                    {!isEmpty && (
                        <span className="px-2 py-0.5 rounded-lg bg-gray-100 dark:bg-white/[0.06] text-[11px] tabular-nums font-semibold text-gray-600 dark:text-gray-300 shrink-0">
                            {data.length} {data.length === 1 ? "Symbol" : "Symbols"}
                        </span>
                    )}
                </div>

                {isEmpty ? (
                    <ChartEmptyState />
                ) : (
                    <div className="space-y-2.5">
                        {chartData.map((item) => (
                            <PairPerformanceRow
                                key={item.symbol}
                                item={item}
                                maxAbsPnl={maxAbsPnl}
                                currency={currency}
                                compact={chartData.length > 2}
                            />
                        ))}

                        {showDirectionMatrix && (
                            <div className="rounded-xl border border-dashboard grid grid-cols-2 divide-x divide-gray-200 dark:divide-white/[0.08] bg-white dark:bg-[#1E2028] overflow-hidden">
                                <div className="p-3 space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                                        Total Long (Buy)
                                    </span>
                                    <span
                                        className={`text-base font-bold tabular-nums block ${
                                            totalLongPnl >= 0 ? "text-primary" : "text-red-500"
                                        }`}
                                    >
                                        {formatDashboardCurrency(totalLongPnl, currency, {
                                            signDisplay: "always",
                                        })}
                                    </span>
                                    <span className="text-xs tabular-nums font-medium text-gray-500 dark:text-gray-400 block">
                                        {totalLongTrades.toLocaleString()} closed trades
                                    </span>
                                </div>
                                <div className="p-3 space-y-1">
                                    <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 block">
                                        Total Short (Sell)
                                    </span>
                                    <span
                                        className={`text-base font-bold tabular-nums block ${
                                            totalShortPnl >= 0 ? "text-primary" : "text-red-500"
                                        }`}
                                    >
                                        {formatDashboardCurrency(totalShortPnl, currency, {
                                            signDisplay: "always",
                                        })}
                                    </span>
                                    <span className="text-xs tabular-nums font-medium text-gray-500 dark:text-gray-400 block">
                                        {totalShortTrades.toLocaleString()} closed trades
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {!isEmpty && bestPair && (
                <div className="mt-4 pt-3 border-t border-dashboard flex flex-wrap justify-between items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <span>
                        Best:{" "}
                        <span className="text-primary tabular-nums">
                            {bestPair.symbol}{" "}
                            {formatDashboardCurrency(bestPair.pnl, currency, {
                                signDisplay: "always",
                            })}
                        </span>
                    </span>
                    {worstPair && worstPair.symbol !== bestPair.symbol && (
                        <span>
                            Lagging:{" "}
                            <span
                                className={`tabular-nums ${
                                    worstPair.pnl < 0
                                        ? "text-red-500"
                                        : "text-gray-600 dark:text-gray-300"
                                }`}
                            >
                                {worstPair.symbol}{" "}
                                {formatDashboardCurrency(worstPair.pnl, currency, {
                                    signDisplay: "always",
                                })}
                            </span>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
