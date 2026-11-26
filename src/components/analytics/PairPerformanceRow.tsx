"use client";

import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { formatDashboardCurrency } from "@/lib/utils/cent-account";
import {
    formatCompactCurrency,
    type PairPerformanceDataItem,
} from "./utils/chartHelpers";

interface PairPerformanceRowProps {
    item: PairPerformanceDataItem;
    maxAbsPnl: number;
    currency: string;
    compact?: boolean;
}

export function PairPerformanceRow({
    item,
    maxAbsPnl,
    currency,
    compact = false,
}: PairPerformanceRowProps) {
    const barPct = Math.max(6, Math.round((Math.abs(item.pnl) / maxAbsPnl) * 100));
    const isPositive = item.pnl >= 0;
    const longTrades = item.longTrades ?? 0;
    const shortTrades = item.shortTrades ?? 0;
    const longPnl = item.longPnl ?? 0;
    const shortPnl = item.shortPnl ?? 0;
    const hasDirectional = longTrades > 0 || shortTrades > 0;

    return (
        <div
            className={`rounded-xl border border-dashboard bg-gray-50/70 dark:bg-[#151925] ${
                compact ? "p-2.5 space-y-2" : "p-3.5 space-y-2.5"
            }`}
        >
            <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-white tracking-tight">
                        {item.symbol}
                    </span>
                    <span className="px-1.5 py-0.5 rounded-md bg-white dark:bg-[#1E2028] border border-dashboard text-[11px] tabular-nums font-medium text-gray-500 dark:text-gray-400">
                        {item.tradeCount.toLocaleString()} trades
                    </span>
                    <span className="text-xs tabular-nums font-semibold text-gray-600 dark:text-gray-300">
                        {Math.round(item.winRate)}% WR
                    </span>
                    {item.profitFactor !== undefined && item.profitFactor > 0 && (
                        <span className="hidden sm:inline text-xs tabular-nums font-medium text-gray-400">
                            PF {item.profitFactor >= 99 ? "99+" : item.profitFactor.toFixed(2)}
                        </span>
                    )}
                </div>

                <span
                    className={`text-sm sm:text-base font-bold tabular-nums shrink-0 ${
                        isPositive ? "text-primary" : "text-red-500"
                    }`}
                >
                    {formatDashboardCurrency(item.pnl, currency, {
                        signDisplay: "always",
                    })}
                </span>
            </div>

            <div className="h-1.5 w-full rounded-full bg-gray-200/80 dark:bg-white/[0.06] overflow-hidden">
                <div
                    className={`h-full rounded-full ${
                        isPositive ? "bg-primary" : "bg-red-500"
                    }`}
                    style={{ width: `${barPct}%` }}
                />
            </div>

            {hasDirectional && (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums pt-0.5">
                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                        <ArrowUpRight className="w-3.5 h-3.5 text-primary shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            Long
                        </span>
                        <span
                            className={`font-bold ${
                                longPnl >= 0 ? "text-primary" : "text-red-500"
                            }`}
                        >
                            {formatCompactCurrency(longPnl, currency)}
                        </span>
                        <span className="text-[11px] font-medium text-gray-400">
                            ({Math.round(item.longWinRate ?? 0)}% · {longTrades.toLocaleString()})
                        </span>
                    </div>

                    <div className="flex items-center gap-1 text-gray-600 dark:text-gray-300">
                        <ArrowDownRight className="w-3.5 h-3.5 text-red-500 shrink-0" />
                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500">
                            Short
                        </span>
                        <span
                            className={`font-bold ${
                                shortPnl >= 0 ? "text-primary" : "text-red-500"
                            }`}
                        >
                            {formatCompactCurrency(shortPnl, currency)}
                        </span>
                        <span className="text-[11px] font-medium text-gray-400">
                            ({Math.round(item.shortWinRate ?? 0)}% · {shortTrades.toLocaleString()})
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
