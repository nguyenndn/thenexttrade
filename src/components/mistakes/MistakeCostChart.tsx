"use client";

import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';

interface MistakeCostChartProps {
    data: Array<{
        name: string;
        totalPnL: number;
        count: number;
        emoji: string;
    }>;
}

export function MistakeCostChart({ data }: MistakeCostChartProps) {
    // Take top 5 costliest mistakes (lowest PnL)
    // Data is already sorted by PnL ascending (most negative first) check API?
    // API sorts by totalPnL ascending. So index 0 is most negative (costliest).
    const chartData = data.slice(0, 5).map(d => ({
        ...d,
        absPnL: Math.abs(d.totalPnL) // For bar height
    }));

    if (chartData.length === 0) return (
        <div className="h-64 flex items-center justify-center text-gray-400">
            No mistakes recorded yet
        </div>
    );

    return (
        <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} layout="vertical" margin={{ left: 0, right: 30, top: 10, bottom: 0 }}>
                    <XAxis type="number" hide />
                    <YAxis
                        type="category"
                        dataKey="name"
                        width={120}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickLine={false}
                        axisLine={false}
                    />
                    <Tooltip
                        cursor={{ fill: 'transparent' }}
                        content={({ active, payload }) => {
                            if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                return (
                                    <div className="bg-white dark:bg-[#1E2028] p-3 rounded-xl border border-gray-100 dark:border-white/10 shadow-xl">
                                        <p className="font-bold text-gray-900 dark:text-white mb-1 flex items-center gap-2">
                                            <span>{data.emoji}</span>
                                            {data.name}
                                        </p>
                                        <p className="text-red-500 font-bold">
                                            -${data.absPnL.toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">
                                            {data.count} occurrences
                                        </p>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar dataKey="absPnL" radius={[0, 4, 4, 0]} barSize={32}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill="#EF4444" fillOpacity={0.8} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
