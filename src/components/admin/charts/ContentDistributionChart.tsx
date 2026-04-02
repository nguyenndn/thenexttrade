
"use client";

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface DataPoint {
    name: string;
    value: number;
    color?: string;
}

interface ContentDistributionChartProps {
    data?: DataPoint[];
}

const COLORS = [
    "#3B82F6", // blue
    "#10B981", // emerald
    "#F59E0B", // amber
    "#06B6D4", // cyan
    "#EF4444", // red
    "#8B5CF6", // violet
    "#EC4899", // pink
    "#14B8A6", // teal
    "#F97316", // orange
    "#6366F1", // indigo
];

export function ContentDistributionChart({ data = [] }: ContentDistributionChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm h-full flex items-center justify-center">
                <p className="text-gray-500">No content data available</p>
            </div>
        );
    }

    const chartData = data.map((item, index) => ({
        ...item,
        color: item.color || COLORS[index % COLORS.length]
    }));

    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    return (
        <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm h-full flex flex-col">
            <h3 className="text-lg font-bold text-gray-700 dark:text-white mb-3">Content Distribution</h3>

            {/* Chart + Legend side by side */}
            <div className="flex-1 flex items-center gap-4 min-h-0">
                {/* Chart */}
                <div className="w-[140px] h-[140px] flex-shrink-0">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                        <PieChart>
                            <Pie
                                data={chartData}
                                innerRadius={38}
                                outerRadius={65}
                                paddingAngle={3}
                                dataKey="value"
                                stroke="none"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    borderRadius: "8px",
                                    border: "none",
                                    boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
                                    fontSize: "13px",
                                }}
                                formatter={(value) => [`${value ?? 0} articles`, ""]}
                            />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                {/* Custom Legend */}
                <div className="flex-1 space-y-1.5 overflow-y-auto max-h-[160px] pr-1">
                    {chartData.map((entry, index) => {
                        const pct = total > 0 ? Math.round((entry.value / total) * 100) : 0;
                        return (
                            <div key={index} className="flex items-center gap-2 text-sm">
                                <span
                                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                    style={{ backgroundColor: entry.color }}
                                />
                                <span className="text-gray-600 dark:text-gray-500 truncate flex-1">{entry.name}</span>
                                <span className="text-gray-700 dark:text-white font-medium tabular-nums">{pct}%</span>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}
