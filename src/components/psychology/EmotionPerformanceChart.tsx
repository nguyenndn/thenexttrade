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

interface EmotionStatRow {
    emotion: string;
    totalTrades: number;
    winRate: number;
    totalPnL: number;
    avgPnL?: number;
}

interface EmotionPerformanceChartProps {
    data: EmotionStatRow[];
    title: string;
}

export function EmotionPerformanceChart({
    data,
    title,
}: EmotionPerformanceChartProps) {
    // Sort by Win Rate desc
    const sortedData = [...data].sort((a, b) => b.winRate - a.winRate);

    return (
        <div className="bg-white dark:bg-[#1E2028] p-5 rounded-xl border border-dashboard shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col h-full">
            <h3 className="text-sm font-bold text-gray-700 dark:text-white mb-4">
                {title}
            </h3>

            <div className="h-80 w-full">
                <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={0}
                    minHeight={200}
                >
                    <BarChart
                        data={sortedData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            opacity={0.1}
                            horizontal={false}
                        />
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis
                            dataKey="emotion"
                            type="category"
                            tick={{ fill: "#6B7280", fontSize: 12 }}
                            width={80}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const item = payload[0]
                                    .payload as EmotionStatRow;
                                return (
                                    <div className="bg-white dark:bg-[#1E2028] text-gray-800 dark:text-gray-100 p-3 rounded-lg border border-dashboard shadow-xl text-xs">
                                        <p className="font-bold text-gray-900 dark:text-white mb-1 text-sm">
                                            {item.emotion}
                                        </p>
                                        <div className="space-y-1">
                                            <div className="flex justify-between gap-4">
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    Win Rate:
                                                </span>
                                                <span className="font-mono tabular-nums font-bold">
                                                    {item.winRate.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    Total P&L:
                                                </span>
                                                <span
                                                    className={`font-mono tabular-nums font-bold ${item.totalPnL >= 0 ? "text-emerald-600 dark:text-primary" : "text-red-500"}`}
                                                >
                                                    {item.totalPnL >= 0
                                                        ? "+"
                                                        : ""}
                                                    ${item.totalPnL.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    Trades:
                                                </span>
                                                <span className="font-mono tabular-nums">
                                                    {item.totalTrades}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }}
                            cursor={{ fill: "transparent" }}
                        />
                        <Bar
                            dataKey="winRate"
                            name="Win Rate"
                            radius={[0, 4, 4, 0]}
                        >
                            {sortedData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={
                                        entry.winRate >= 50
                                            ? "#10B981"
                                            : "#EF4444"
                                    }
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {sortedData.slice(0, 4).map((item) => (
                    <div
                        key={item.emotion}
                        className="bg-gray-50 dark:bg-white/5 p-3 rounded-lg border border-dashboard"
                    >
                        <div className="text-xs text-gray-600 uppercase font-bold">
                            {item.emotion}
                        </div>
                        <div
                            className={`text-lg font-bold ${item.totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}
                        >
                            {item.totalPnL >= 0 ? "+" : ""}$
                            {item.totalPnL.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-500">
                            {item.winRate.toFixed(0)}% Win ({item.totalTrades}{" "}
                            trades)
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
