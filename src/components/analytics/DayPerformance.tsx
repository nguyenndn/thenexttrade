"use client";

import { Activity } from "lucide-react";
import { ChartEmptyState } from "@/components/ui/ChartEmptyState";
import { formatDashboardCurrency } from "@/lib/utils/cent-account";
import {
    formatCompactCurrency,
    processDayPerformanceData,
    type DayPerformanceDataItem,
} from "./utils/chartHelpers";

interface DayPerformanceProps {
    data: DayPerformanceDataItem[];
    currency?: string;
}

export function DayPerformance({ data, currency = "USD" }: DayPerformanceProps) {
    const { chartData, bestDay, worstDay, maxAbsPnl, hasData } =
        processDayPerformanceData(data);
    const hasNegative = chartData.some((d) => d.pnl < 0);

    return (
        <div className="bg-white dark:bg-[#1E2028] p-4 sm:p-6 rounded-xl border border-dashboard shadow-sm flex flex-col justify-between">
            <div>
                <div className="flex items-center gap-2.5 mb-4">
                    <div className="p-2 bg-primary/10 rounded-lg text-primary">
                        <Activity size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-700 dark:text-white text-sm">
                            Weekday Performance
                        </h3>
                        <p className="text-xs text-gray-500">
                            Realized P&L, win rate, and trade volume by day
                        </p>
                    </div>
                </div>

                {!hasData ? (
                    <ChartEmptyState />
                ) : (
                    <div className="grid grid-cols-5 gap-2 sm:gap-3 pt-2">
                        {chartData.map((item) => {
                            const isEmptyDay = item.tradeCount === 0 && item.pnl === 0;
                            const isPositive = item.pnl >= 0;
                            const heightPct = isEmptyDay
                                ? 4
                                : Math.max(10, Math.round((Math.abs(item.pnl) / maxAbsPnl) * 100));

                            return (
                                <div
                                    key={item.name}
                                    className="rounded-xl border border-dashboard bg-gray-50/70 dark:bg-[#151925] p-2 sm:p-2.5 flex flex-col items-center justify-between"
                                    title={`${item.name}: ${formatDashboardCurrency(item.pnl, currency, { signDisplay: "always" })} (${item.winRate}% WR · ${item.tradeCount} trades)`}
                                >
                                    <span
                                        className={`text-xs sm:text-sm font-bold tabular-nums leading-tight truncate max-w-full ${
                                            isEmptyDay
                                                ? "text-gray-400"
                                                : isPositive
                                                  ? "text-primary"
                                                  : "text-red-500"
                                        }`}
                                    >
                                        {isEmptyDay ? "—" : formatCompactCurrency(item.pnl, currency)}
                                    </span>

                                    <div className="h-32 sm:h-36 w-full flex items-end justify-center py-2">
                                        <div className="w-6 sm:w-8 h-full rounded-lg bg-gray-200/60 dark:bg-white/[0.04] flex items-end overflow-hidden p-0.5">
                                            <div
                                                className={`w-full rounded-md transition-all ${
                                                    isEmptyDay
                                                        ? "bg-gray-300 dark:bg-white/10"
                                                        : isPositive
                                                          ? "bg-primary"
                                                          : "bg-red-500"
                                                }`}
                                                style={{ height: `${heightPct}%` }}
                                            />
                                        </div>
                                    </div>

                                    <div className="w-full pt-1.5 border-t border-gray-200/80 dark:border-white/[0.06] text-center space-y-0.5">
                                        <span className="text-xs font-bold text-gray-700 dark:text-white block">
                                            {item.name}
                                        </span>
                                        <span className="text-[11px] tabular-nums font-semibold text-gray-600 dark:text-gray-300 block">
                                            {item.tradeCount > 0 ? `${item.winRate}% WR` : "0% WR"}
                                        </span>
                                        <span className="text-[11px] tabular-nums font-medium text-gray-400 block">
                                            {item.tradeCount.toLocaleString()} tr
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {hasData && bestDay && (
                <div className="mt-4 pt-3 border-t border-dashboard flex flex-wrap justify-between items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                    <span>
                        Strongest Day:{" "}
                        <span className="text-primary tabular-nums">
                            {bestDay.name}{" "}
                            {formatDashboardCurrency(bestDay.pnl, currency, { signDisplay: "always" })}
                        </span>
                    </span>
                    {worstDay && worstDay.name !== bestDay.name && (
                        <span>
                            {hasNegative && worstDay.pnl < 0 ? "Leak Day: " : "Slowest Day: "}
                            <span
                                className={`tabular-nums ${
                                    worstDay.pnl < 0 ? "text-red-500" : "text-gray-600 dark:text-gray-300"
                                }`}
                            >
                                {worstDay.name}{" "}
                                {formatDashboardCurrency(worstDay.pnl, currency, { signDisplay: "always" })}
                            </span>
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}
