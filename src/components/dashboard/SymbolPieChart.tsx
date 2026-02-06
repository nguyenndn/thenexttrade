"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';
import { useTheme } from "@/components/providers/ThemeProvider";

interface SymbolPieChartProps {
    data: { name: string; value: number }[];
}

export function SymbolPieChart({ data }: SymbolPieChartProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const COLORS = ['#00C888', '#3B82F6', '#8B5CF6', '#F59E0B', '#EF4444'];

    if (!data || data.length === 0) {
        return (
            <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm h-full flex flex-col items-center justify-center text-center">
                <span className="text-gray-400 text-sm">No trades this month</span>
            </div>
        );
    }

    return (
        <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm h-full flex flex-col">
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white">Symbols Traded</h3>
                    <p className="text-xs text-gray-500">Volume distribution by pair</p>
                </div>
            </div>
            <div className="flex-1 w-full min-h-[200px]">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data}
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                            stroke="none"
                        >
                            {data.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                        </Pie>
                        <Tooltip
                            contentStyle={{ backgroundColor: isDark ? '#151925' : '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                            itemStyle={{ color: isDark ? '#fff' : '#000' }}
                        />
                        <Legend
                            layout="vertical"
                            verticalAlign="middle"
                            align="right"
                            iconType="circle"
                            iconSize={8}
                            formatter={(value) => <span className="text-xs font-medium text-gray-500 dark:text-gray-400 ml-1">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
