
"use client";

import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from "recharts";

interface DataPoint {
    name: string;
    value: number;
    color?: string;
}

interface ContentDistributionChartProps {
    data?: DataPoint[];
}

const COLORS = ["hsl(var(--primary))", "#3B82F6", "#8B5CF6", "#F59E0B", "#EF4444"];

export function ContentDistributionChart({ data = [] }: ContentDistributionChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white dark:bg-[#151925] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm h-[350px] flex items-center justify-center">
                <p className="text-gray-400">No content data available</p>
            </div>
        );
    }

    // Assign colors if missing
    const chartData = data.map((item, index) => ({
        ...item,
        color: item.color || COLORS[index % COLORS.length]
    }));

    return (
        <div className="bg-white dark:bg-[#151925] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm h-[350px]">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Content Distribution</h3>
            <div className="w-full h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={chartData}
                            innerRadius={60}
                            outerRadius={90}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {chartData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.color || COLORS[index % COLORS.length]} stroke="none" />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        />
                        <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
