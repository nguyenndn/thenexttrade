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

interface PairPerformanceProps {
    data: Array<{
        symbol: string;
        pnl: number;
        tradeCount: number;
        winRate: number;
    }>;
}

export function PairPerformance({ data }: PairPerformanceProps) {
    // Sort by PnL and take top 8
    const chartData = [...data]
        .sort((a, b) => b.pnl - a.pnl)
        .slice(0, 8);

    return (
        <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                Performance by Pair
            </h3>

            {data.length === 0 ? (
                <div className="h-[250px] flex items-center justify-center text-gray-400">
                    No data available
                </div>
            ) : (
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#374151"
                                opacity={0.1}
                                horizontal={false}
                            />
                            <XAxis
                                type="number"
                                stroke="#9CA3AF"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                tickFormatter={(value) => `$${value}`}
                            />
                            <YAxis
                                type="category"
                                dataKey="symbol"
                                stroke="#9CA3AF"
                                fontSize={12}
                                tickLine={false}
                                axisLine={false}
                                width={50}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1F2937",
                                    border: "none",
                                    borderRadius: "12px",
                                    padding: "12px",
                                }}
                                itemStyle={{ color: "#fff" }}
                                formatter={(value: any, name: any) => [
                                    `$${Number(value).toLocaleString()}`,
                                    "P&L",
                                ]}
                                labelFormatter={(label) => `${label}`}
                            />
                            <Bar dataKey="pnl" radius={[0, 4, 4, 0]}>
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.pnl >= 0 ? "hsl(var(--primary))" : "#EF4444"}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            )}

            {/* Top performers list */}
            {data.length > 0 && (
                <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                    <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Best: {chartData[0]?.symbol}</span>
                        <span className="text-green-500 font-bold">
                            +${chartData[0]?.pnl.toLocaleString()}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}
