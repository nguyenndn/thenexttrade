"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface MistakeFrequencyChartProps {
    data: Record<string, number>;
}

const COLORS = ['#00C888', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

export function MistakeFrequencyChart({ data }: MistakeFrequencyChartProps) {
    const chartData = Object.entries(data).map(([name, value]) => ({ name, value }));
    const total = chartData.reduce((sum, item) => sum + item.value, 0);

    if (total === 0) return (
        <div className="h-64 flex items-center justify-center text-gray-400">
            No data available
        </div>
    );

    return (
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                    </Pie>
                    <Tooltip
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-white dark:bg-[#1E2028] p-3 rounded-xl border border-gray-100 dark:border-white/10 shadow-xl">
                                        <p className="font-bold text-gray-900 dark:text-white">
                                            {data.name}
                                        </p>
                                        <p className="text-[#00C888] font-bold">
                                            {data.value} mistakes
                                        </p>
                                        <p className="text-xs text-gray-500">
                                            {((data.value / total) * 100).toFixed(1)}% of total
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => <span className="text-xs text-gray-500 dark:text-gray-400 font-medium ml-1">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
