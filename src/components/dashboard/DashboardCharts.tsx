"use client";

import { useTheme } from "@/components/providers/ThemeProvider";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface DashboardChartsProps {
    data: { name: string; balance: number }[];
}

export default function DashboardCharts({ data }: DashboardChartsProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    return (
        <div className="h-full w-full">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorPnL" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#333" : "#f0f0f0"} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#9CA3AF' }} dy={10} />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: '#9CA3AF' }}
                        tickFormatter={(value) => `$${value}`}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip
                        contentStyle={{ backgroundColor: isDark ? '#151925' : '#fff', border: 'none', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                        itemStyle={{ color: isDark ? '#fff' : '#000' }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, "Balance"]}
                    />
                    <Area type="monotone" dataKey="balance" stroke="hsl(var(--primary))" strokeWidth={3} fillOpacity={1} fill="url(#colorPnL)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
