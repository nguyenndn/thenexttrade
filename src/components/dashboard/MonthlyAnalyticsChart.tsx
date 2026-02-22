"use client";

import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { cn } from "@/lib/utils";

interface MonthlyAnalyticsChartProps {
    data: {
        date: string; // "2024-01-01"
        value: number; // PnL % or $
    }[];
}

export function MonthlyAnalyticsChart({ data }: MonthlyAnalyticsChartProps) {
    // 1. Group data by Year
    const yearGroups = useMemo(() => {
        const groups: Record<number, any[]> = {};
        data.forEach(item => {
            const date = new Date(item.date);
            const year = date.getFullYear();
            if (!groups[year]) groups[year] = [];

            // Normalize to Month name
            const monthShort = date.toLocaleString('default', { month: 'short' });
            const monthIndex = date.getMonth(); // 0-11 for sorting

            // Check if month already exists (accumulate if needed, though usually 1 entry/month)
            const existing = groups[year].find((d: any) => d.monthIndex === monthIndex);
            if (existing) {
                existing.value += item.value;
            } else {
                groups[year].push({
                    month: monthShort + " " + year,
                    monthName: monthShort,
                    monthIndex: monthIndex,
                    value: item.value
                });
            }
        });

        // Fill missing months for better chart? Or just show active?
        // Myfxbook usually shows all months.
        Object.keys(groups).forEach(yearStr => {
            const y = parseInt(yearStr);
            const currentMonths = groups[y];
            for (let i = 0; i < 12; i++) {
                if (!currentMonths.find((m: any) => m.monthIndex === i)) {
                    const d = new Date(y, i, 1);
                    currentMonths.push({
                        month: d.toLocaleString('default', { month: 'short' }) + " " + y,
                        monthName: d.toLocaleString('default', { month: 'short' }),
                        monthIndex: i,
                        value: 0
                    })
                }
            }
            groups[y].sort((a: any, b: any) => a.monthIndex - b.monthIndex);
        });

        return groups;
    }, [data]);

    const years = Object.keys(yearGroups).map(Number).sort((a, b) => b - a); // Descending
    const [selectedYear, setSelectedYear] = useState<number>(years[0] || new Date().getFullYear());

    // Effect to update selected year if years change
    if (years.length > 0 && !years.includes(selectedYear)) {
        setSelectedYear(years[0]);
    }

    const chartData = yearGroups[selectedYear] || [];

    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center font-medium text-sm text-gray-400 dark:text-gray-500">
                No data available
            </div>
        );
    }

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                {years.map(year => (
                    <button
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        className={cn(
                            "px-4 py-1.5 rounded-lg text-sm font-bold transition-colors",
                            selectedYear === year
                                ? "bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-white"
                                : "text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                        )}
                    >
                        {year}
                    </button>
                ))}
            </div>

            <div className="flex-1 min-h-[250px] [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none focus:outline-none">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-white/5" />
                        <XAxis
                            dataKey="monthName"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 11 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9CA3AF', fontSize: 11 }}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            cursor={{ fill: 'transparent' }}
                            contentStyle={{
                                backgroundColor: 'rgba(255, 255, 255, 0.9)',
                                borderRadius: '8px',
                                border: 'none',
                                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
                            }}
                            formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Gain"]}
                            labelStyle={{ color: '#6B7280', marginBottom: '4px' }}
                        />
                        <Bar dataKey="value" radius={[4, 4, 0, 0]} maxBarSize={40}>
                            {chartData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={entry.value >= 0 ? 'hsl(var(--primary))' : '#F87171'} />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
