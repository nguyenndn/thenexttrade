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
    ReferenceLine,
} from "recharts";

interface EmotionPerformanceChartProps {
    data: Array<{
        emotion: string;
        totalTrades: number;
        winRate: number;
        totalPnL: number;
        avgPnL: number;
    }>;
    title: string;
}

export function EmotionPerformanceChart({ data, title }: EmotionPerformanceChartProps) {
    // Sort by Win Rate desc
    const sortedData = [...data].sort((a, b) => b.winRate - a.winRate);

    return (
        <div className="bg-white dark:bg-[#1E2028] p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col h-full">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                {title}
            </h3>

            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={sortedData}
                        layout="vertical"
                        margin={{ top: 5, right: 30, left: 40, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} horizontal={false} />
                        <XAxis type="number" domain={[0, 100]} hide />
                        <YAxis
                            dataKey="emotion"
                            type="category"
                            tick={{ fill: "#6B7280", fontSize: 12 }}
                            width={80}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1F2937",
                                border: "none",
                                borderRadius: "8px",
                                color: "#F3F4F6",
                            }}
                            formatter={(value: any, name: any) => {
                                if (name === "Win Rate") return [`${Number(value).toFixed(1)}%`, name];
                                return [value, name];
                            }}
                        />
                        <Bar dataKey="winRate" name="Win Rate" radius={[0, 4, 4, 0]}>
                            {sortedData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.winRate >= 50 ? "#10B981" : "#EF4444"}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="mt-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {sortedData.slice(0, 4).map((item) => (
                    <div key={item.emotion} className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl border border-gray-200 dark:border-white/10">
                        <div className="text-xs text-gray-500 uppercase font-bold">{item.emotion}</div>
                        <div className={`text-lg font-bold ${item.totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                            {item.totalPnL >= 0 ? "+" : ""}${item.totalPnL.toFixed(2)}
                        </div>
                        <div className="text-xs text-gray-400">
                            {item.winRate.toFixed(0)}% Win ({item.totalTrades} trades)
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
