
"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

interface WinLossProps {
    data: {
        WIN: number;
        LOSS: number;
        BREAK_EVEN: number;
    }
}

export function WinLossChart({ data }: WinLossProps) {
    const chartData = [
        { name: 'Wins', value: data.WIN, color: '#3B82F6' }, // Blue
        { name: 'Losses', value: data.LOSS, color: '#EF4444' }, // Red
        { name: 'Break Even', value: data.BREAK_EVEN, color: '#9CA3AF' }, // Gray
    ].filter(d => d.value > 0);

    if (chartData.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-gray-500 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                No trades recorded.
            </div>
        );
    }

    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
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
                            <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: '#fff',
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                        }}
                    />
                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
