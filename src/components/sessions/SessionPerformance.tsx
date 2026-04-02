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
}

export function SessionPerformance({ data }: SessionPerformanceProps) {
    return (
        <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm h-full flex flex-col transition-shadow hover:shadow-md">
            <h3 className="font-bold text-gray-700 dark:text-white mb-2">
                P&L by Session
            </h3>
            <p className="text-sm text-gray-600 mb-4">
                Total profit/loss for each trading session
            </p>

            <div className="flex-1 min-h-[280px]">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart data={data} layout="vertical">
                        <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                        <XAxis
                            type="number"
                            stroke="#9CA3AF"
                            fontSize={12}
                            tickFormatter={(value) => `$${value}`}
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
                                    const data = payload[0].payload;
                                    return (
                                        <div className="bg-[#1F2937] text-gray-100 p-3 rounded-xl border border-white/10 shadow-xl text-xs">
                                            <p className="font-bold mb-1 text-sm">{data.displayName}</p>
                                            <div className="space-y-1">
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-gray-500">P&L:</span>
                                                    <span className={`font-mono font-bold ${data.totalPnL >= 0 ? "text-primary" : "text-red-400"}`}>
                                                        ${(data.totalPnL ?? 0).toLocaleString()}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-gray-500">Win Rate:</span>
                                                    <span className="font-mono">{(data.winRate ?? 0).toFixed(0)}%</span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-gray-500">Trades:</span>
                                                    <span className="font-mono">{data.totalTrades ?? 0}</span>
                                                </div>
                                                <div className="flex justify-between gap-4">
                                                    <span className="text-gray-500">Profit Factor:</span>
                                                    <span className="font-mono">{data.profitFactor === Infinity ? "MAX" : (data.profitFactor ?? 0).toFixed(2)}</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                            cursor={{ fill: 'transparent' }}
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
            <div className="flex flex-wrap gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-white/10">
                {data.map((session) => (
                    <div key={session.session} className="flex items-center gap-2">
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
