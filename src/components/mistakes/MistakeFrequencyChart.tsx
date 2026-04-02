"use client";

import { useMemo } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { ChartEmptyState } from '@/components/ui/ChartEmptyState';

interface MistakeFrequencyChartProps {
    data: Record<string, number>;
}

const COLORS = ['#00C888', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

export function MistakeFrequencyChart({ data }: MistakeFrequencyChartProps) {
    const { chartData, total } = useMemo(() => {
        const mappedData = Object.entries(data).map(([name, value]) => ({ name, value }));
        const sum = mappedData.reduce((acc, item) => acc + item.value, 0);
        return { chartData: mappedData, total: sum };
    }, [data]);

    if (total === 0) return (
        <ChartEmptyState 
            title="Clean Slate"
            description="No mistakes have been logged for this time period."
        />
    );

    return (
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                        stroke="none"
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
                                    <div className="bg-[#151925]/95 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
                                        <p className="font-black text-white mb-2 tracking-tight">
                                            {data.name}
                                        </p>
                                        <div className="space-y-1">
                                            <p className="text-primary font-bold flex justify-between gap-6">
                                                <span className="text-gray-500 text-xs font-medium uppercase tracking-widest">Mistakes</span>
                                                {data.value}
                                            </p>
                                            <p className="text-gray-300 font-bold flex justify-between gap-6">
                                                <span className="text-gray-500 text-xs font-medium uppercase tracking-widest">% of Total</span>
                                                {((data.value / total) * 100).toFixed(1)}%
                                            </p>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        formatter={(value) => <span className="text-xs text-gray-600 dark:text-gray-300 font-medium ml-1">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
