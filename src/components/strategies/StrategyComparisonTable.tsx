"use client";

import { useMemo } from "react";
import { ArrowUp, ArrowDown, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface StrategyPerformance {
    strategy: string;
    color: string;
    totalTrades: number;
    winRate: number;
    totalPnL: number;
    avgPnL: number;
    profitFactor: number;
}

interface StrategyComparisonTableProps {
    data: StrategyPerformance[];
}

export function StrategyComparisonTable({ data }: StrategyComparisonTableProps) {
    const sortedData = useMemo(() => {
        return [...data].sort((a, b) => b.totalPnL - a.totalPnL);
    }, [data]);

    // Calculate max values for bar visualization
    const maxTrades = Math.max(...data.map(d => d.totalTrades), 1);
    const maxPnL = Math.max(...data.map(d => Math.abs(d.totalPnL)), 1);

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5">
                <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                    Strategy Comparison
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                    Side-by-side performance metrics
                </p>
            </div>

            <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400 font-medium uppercase text-xs">
                        <tr>
                            <th className="px-6 py-3 min-w-[150px]">Strategy</th>
                            <th className="px-6 py-3 text-center">Win Rate</th>
                            <th className="px-6 py-3 text-center">Profit Factor</th>
                            <th className="px-6 py-3 text-right">Total P&L</th>
                            <th className="px-6 py-3 text-right">Avg Trade</th>
                            <th className="px-6 py-3 text-center">Trades</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                        {sortedData.map((item) => (
                            <tr
                                key={item.strategy}
                                className="group hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                            >
                                <td className="px-6 py-4">
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-3 h-3 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: item.color }}
                                        />
                                        <span className="font-bold text-gray-900 dark:text-white">
                                            {item.strategy}
                                        </span>
                                    </div>
                                </td>

                                {/* Win Rate */}
                                <td className="px-6 py-4">
                                    <div className="flex flex-col items-center gap-1">
                                        <span className={cn(
                                            "font-bold",
                                            (item.winRate ?? 0) >= 50 ? "text-green-500" : "text-red-500"
                                        )}>
                                            {(item.winRate ?? 0).toFixed(1)}%
                                        </span>
                                        <div className="w-20 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full",
                                                    item.winRate >= 50 ? "bg-green-500" : "bg-red-500"
                                                )}
                                                style={{ width: `${item.winRate}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>

                                {/* Profit Factor */}
                                <td className="px-6 py-4 text-center">
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-lg font-bold text-xs inline-flex items-center gap-1",
                                        (item.profitFactor ?? 0) >= 2.0
                                            ? "bg-purple-100 dark:bg-purple-500/20 text-purple-600 dark:text-purple-400"
                                            : (item.profitFactor ?? 0) >= 1.5
                                                ? "bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400"
                                                : (item.profitFactor ?? 0) >= 1.0
                                                    ? "bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400"
                                                    : "bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400"
                                    )}>
                                        {item.profitFactor === Infinity ? "MAX" : (item.profitFactor ?? 0).toFixed(2)}
                                    </span>
                                </td>

                                {/* Total P&L */}
                                <td className="px-6 py-4 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className={cn(
                                            "font-bold text-base",
                                            item.totalPnL >= 0 ? "text-green-500" : "text-red-500"
                                        )}>
                                            {item.totalPnL >= 0 ? "+" : ""}${Math.abs(item.totalPnL).toLocaleString()}
                                        </span>
                                        {/* Visualization bar */}
                                        <div className="w-24 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden flex justify-end">
                                            <div
                                                className={cn(
                                                    "h-full rounded-full opacity-50",
                                                    item.totalPnL >= 0 ? "bg-green-500" : "bg-red-500"
                                                )}
                                                style={{ width: `${(Math.abs(item.totalPnL) / maxPnL) * 100}%` }}
                                            />
                                        </div>
                                    </div>
                                </td>

                                {/* Avg Trade */}
                                <td className="px-6 py-4 text-right">
                                    <div className="flex items-center justify-end gap-1">
                                        <span className={cn(
                                            "font-medium",
                                            (item.avgPnL ?? 0) >= 0 ? "text-green-500" : "text-red-500"
                                        )}>
                                            {(item.avgPnL ?? 0) >= 0 ? "+" : ""}${Math.abs(item.avgPnL ?? 0).toFixed(2)}
                                        </span>
                                        {item.avgPnL > 0 && <ArrowUp size={12} className="text-green-500" />}
                                        {item.avgPnL < 0 && <ArrowDown size={12} className="text-red-500" />}
                                        {item.avgPnL === 0 && <Minus size={12} className="text-gray-400" />}
                                    </div>
                                </td>

                                {/* Trades Count */}
                                <td className="px-6 py-4 flex flex-col items-center">
                                    <span className="font-bold text-gray-900 dark:text-white">
                                        {item.totalTrades}
                                    </span>
                                    <div className="w-16 h-1 bg-gray-200 dark:bg-gray-700 rounded-full mt-1 overflow-hidden">
                                        <div
                                            className="h-full bg-blue-500 rounded-full"
                                            style={{ width: `${(item.totalTrades / maxTrades) * 100}%` }}
                                        />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {data.length === 0 && (
                <div className="p-10 text-center text-gray-500">
                    No data available for comparison
                </div>
            )}
        </div>
    );
}
