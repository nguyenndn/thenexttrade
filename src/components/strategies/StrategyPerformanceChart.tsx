"use client";

import {
    ComposedChart,
    Bar,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";

interface StrategyPerformance {
    strategy: string;
    color: string;
    totalTrades: number;
    winRate: number;
    totalPnL: number;
    profitFactor: number;
}

interface Props {
    data: StrategyPerformance[];
}

export function StrategyPerformanceChart({ data }: Props) {
    return (
        <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">
                Strategy Performance
            </h3>

            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <ComposedChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                        barSize={40}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1} />
                        <XAxis
                            dataKey="strategy"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            yAxisId="left"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 12 }}
                            tickFormatter={(value) => `${value}%`}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const item = payload[0].payload as StrategyPerformance;
                                    return (
                                        <div className="bg-white dark:bg-[#1E2028] p-4 rounded-xl shadow-lg border border-gray-200 dark:border-white/10">
                                            <div className="flex items-center gap-2 mb-2">
                                                <div
                                                    className="w-3 h-3 rounded-full"
                                                    style={{ backgroundColor: item.color }}
                                                />
                                                <p className="font-bold text-gray-900 dark:text-white">
                                                    {item.strategy}
                                                </p>
                                            </div>
                                            <div className="space-y-1 text-sm">
                                                <div className="flex justify-between gap-8">
                                                    <span className="text-gray-500">Total P&L:</span>
                                                    <span className={`font-mono font-bold ${item.totalPnL >= 0 ? 'text-primary' : 'text-red-500'}`}>
                                                        ${(item.totalPnL ?? 0).toFixed(2)}
                                                    </span>
                                                </div>
                                                <div className="flex justify-between gap-8">
                                                    <span className="text-gray-500">Win Rate:</span>
                                                    <span className="font-mono text-gray-900 dark:text-white">
                                                        {(item.winRate ?? 0).toFixed(1)}%
                                                    </span>
                                                </div>
                                                <div className="flex justify-between gap-8">
                                                    <span className="text-gray-500">Trades:</span>
                                                    <span className="font-mono text-gray-900 dark:text-white">
                                                        {item.totalTrades}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Bar yAxisId="left" dataKey="totalPnL" radius={[4, 4, 4, 4]}>
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.totalPnL >= 0 ? entry.color : '#EF4444'} />
                            ))}
                        </Bar>
                        <Line
                            yAxisId="right"
                            type="monotone"
                            dataKey="winRate"
                            stroke="#06B6D4"
                            strokeWidth={3}
                            dot={{ r: 4, strokeWidth: 2, fill: '#1E2028', stroke: '#06B6D4' }}
                            activeDot={{ r: 6, stroke: '#06B6D4', strokeWidth: 2 }}
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
