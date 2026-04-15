"use client";

import { useState, useMemo } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from "recharts";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

interface MonthlyAnalyticsChartProps {
    data: {
        date: string;
        value: number;
    }[];
}

export function MonthlyAnalyticsChart({ data }: MonthlyAnalyticsChartProps) {
    const yearGroups = useMemo(() => {
        const groups: Record<number, any[]> = {};
        data.forEach(item => {
            const date = new Date(item.date);
            const year = date.getFullYear();
            if (!groups[year]) groups[year] = [];

            const monthShort = date.toLocaleString('default', { month: 'short' });
            const monthIndex = date.getMonth();

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

    const years = Object.keys(yearGroups).map(Number).sort((a, b) => b - a);
    const [selectedYear, setSelectedYear] = useState<number>(years[0] || new Date().getFullYear());

    if (years.length > 0 && !years.includes(selectedYear)) {
        setSelectedYear(years[0]);
    }

    const chartData = yearGroups[selectedYear] || [];

    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center font-medium text-sm text-gray-600 dark:text-gray-300">
                No data available
            </div>
        );
    }

    const CustomTooltip = ({ active, payload }: any) => {
        if (!active || !payload?.length) return null;
        const d = payload[0].payload;
        return (
            <div className="bg-white dark:bg-[#1E2028] p-3 border border-gray-200 dark:border-white/10 rounded-xl shadow-xl backdrop-blur-sm">
                <p className="text-xs font-bold text-gray-700 dark:text-gray-100 mb-1">{d.month}</p>
                <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${d.value >= 0 ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <p className={`text-sm font-black ${d.value >= 0 ? 'text-primary' : 'text-red-500'}`}>
                        {d.value >= 0 ? "+" : ""}${Number(d.value).toFixed(2)}
                    </p>
                </div>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col">
            <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-2 scrollbar-hide">
                {years.map(year => (
                    <Button
                        variant="ghost"
                        key={year}
                        onClick={() => setSelectedYear(year)}
                        className={cn(
                            "px-4 py-1.5 h-auto rounded-lg text-sm font-bold transition-colors",
                            selectedYear === year
                                ? "bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-white hover:bg-gray-200 dark:hover:bg-white/20"
                                : "text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-white/5"
                        )}
                    >
                        {year}
                    </Button>
                ))}
            </div>

            <div className="flex-1 min-h-[250px] [&_.recharts-wrapper]:!outline-none [&_.recharts-surface]:!outline-none focus:outline-none">
                <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                    <BarChart
                        data={chartData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="monthProfitGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={1} />
                                <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0.6} />
                            </linearGradient>
                            <linearGradient id="monthLossGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="0%" stopColor="#EF4444" stopOpacity={1} />
                                <stop offset="100%" stopColor="#EF4444" stopOpacity={0.6} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border-color)" opacity={0.15} />
                        <ReferenceLine y={0} stroke="var(--border-color)" strokeOpacity={0.5} />
                        <XAxis
                            dataKey="monthName"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: 'var(--text-secondary)', fontSize: 11 }}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--hover-bg)', opacity: 0.06 }} />
                        <Bar dataKey="value" radius={[6, 6, 0, 0]} maxBarSize={36}>
                            {chartData.map((entry: any, index: number) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.value >= 0 ? 'url(#monthProfitGradient)' : 'url(#monthLossGradient)'}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
