"use client";

import { useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChartEmptyState } from '@/components/ui/ChartEmptyState';

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
    const chartData = useMemo(() => {
        return data.slice(0, 5).map(d => ({
            ...d,
            absPnL: Math.abs(d.totalPnL) // For bar height
        }));
    }, [data]);

    if (chartData.length === 0) return (
        <ChartEmptyState 
            title="No Costly Mistakes" 
            description="You haven't recorded any mistakes that incurred a loss during this period." 
        />
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
                                    <div className="bg-[#151925]/95 backdrop-blur-md p-4 rounded-xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.5)]">
                                        <p className="font-black text-white mb-2 tracking-tight flex items-center gap-2">
                                            <span className="text-xl bg-white/10 w-8 h-8 rounded-lg flex items-center justify-center">{data.emoji}</span>
                                            {data.name}
                                        </p>
                                        <div className="space-y-1">
                                            <p className="text-red-400 font-bold flex justify-between gap-6">
                                                <span className="text-gray-400 text-xs font-medium uppercase tracking-widest">Total Cost</span>
                                                -${data.absPnL.toFixed(2)}
                                            </p>
                                            <p className="text-gray-300 font-bold flex justify-between gap-6">
                                                <span className="text-gray-400 text-xs font-medium uppercase tracking-widest">Frequency</span>
                                                {data.count}
                                            </p>
                                        </div>
                                    </div>
                                );
                            }
                            return null;
                        }}
                    />
                    <Bar dataKey="absPnL" radius={[0, 8, 8, 0]} barSize={24} background={{ fill: 'rgba(255,255,255,0.02)' }}>
                        {chartData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill="#EF4444" fillOpacity={0.9} />
                        ))}
                    </Bar>
                </BarChart>
            </ResponsiveContainer>
        </div>
    );
}
