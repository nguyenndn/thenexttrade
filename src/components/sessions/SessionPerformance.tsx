"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { formatDashboardCurrency } from "@/lib/utils/cent-account";

interface SessionPerformanceProps {
    data: Array<{
        session: string;
        displayName: string;
        color: string;
        totalTrades: number;
        winRate: number;
        totalPnL: number;
        profitFactor: number;
    }>;
    currency?: string;
}

export function SessionPerformance({
    data,
    currency = "USD",
}: SessionPerformanceProps) {
    return (
        <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-dashboard shadow-sm h-full flex flex-col transition-shadow hover:shadow-md">
            <h3 className="font-bold text-gray-700 dark:text-white mb-2">
                P&L by Session
            </h3>
            <p className="text-sm text-gray-600 mb-4">
                Total profit/loss for each trading session
            </p>

            <div className="flex-1 min-h-[280px]">
                <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={0}
                    minHeight={200}
                >
                    <BarChart data={data} layout="vertical">
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                            opacity={0.1}
                        />
                        <XAxis
                            type="number"
                            stroke="#9CA3AF"
                            fontSize={12}
                            tickFormatter={(value) =>
                                formatDashboardCurrency(value, currency, {
                                    fractionDigits: 0,
                                })
                            }
                        />
                        <YAxis
                            type="category"
                            dataKey="displayName"
                            stroke="#9CA3AF"
                            fontSize={12}
                            width={120}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const item = payload[0].payload;
                                    return (
                                        <div className="bg-white dark:bg-[#1E2028] text-gray-800 dark:text-gray-100 p-3 rounded-lg border border-dashboard shadow-xl text-xs">
                                            <p className="font-bold mb-1 text-sm text-gray-900 dark:text-white">
                                                {item.displayName}
                                            </p>
                                            <div className="space-y-1">
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-gray-500 dark:text-gray-400">
                                                        P&L:
                                                    </span>
                                                    <span
                                                        className={`font-mono tabular-nums font-bold ${item.totalPnL >= 0 ? "text-emerald-600 dark:text-primary" : "text-red-500 dark:text-red-400"}`}
                                                    >
                                                        {formatDashboardCurrency(
                                                            item.totalPnL ?? 0,
                                                            currency
                                                        )}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-gray-500 dark:text-gray-400">
                                                        Win Rate:
                                                    </span>
                                                    <span className="font-mono tabular-nums">
                                                        {(
                                                            item.winRate ?? 0
                                                        ).toFixed(0)}
                                                        %
                                                    </span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-gray-500 dark:text-gray-400">
                                                        Trades:
                                                    </span>
                                                    <span className="font-mono tabular-nums">
                                                        {item.totalTrades ?? 0}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-gray-500 dark:text-gray-400">
                                                        Profit Factor:
                                                    </span>
                                                    <span className="font-mono tabular-nums">
                                                        {item.profitFactor ===
                                                        Infinity
                                                            ? "MAX"
                                                            : (
                                                                  item.profitFactor ??
                                                                  0
                                                              ).toFixed(2)}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                            cursor={{ fill: "transparent" }}
                        />
                        <Bar dataKey="totalPnL" radius={[0, 4, 4, 0]}>
                            {data.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.color}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Legend with session colors */}
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-dashboard">
                {data.map((session) => (
                    <div
                        key={session.session}
                        className="flex items-center gap-2"
                    >
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: session.color }}
                        />
                        <span className="text-xs text-gray-600">
                            {session.displayName}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}
