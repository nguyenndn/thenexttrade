
"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';

interface EquityChartProps {
    data: {
        date: string;
        balance: number;
        pnl: number;
    }[];
}

const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white dark:bg-[#0B0E14] border border-gray-200 dark:border-white/10 p-4 rounded-xl shadow-xl">
                <p className="text-sm font-bold text-gray-600 mb-2">{format(new Date(label), "MMM dd, yyyy")}</p>
                <p className="text-primary font-bold text-lg">
                    ${payload[0].value.toFixed(2)}
                </p>
                <p className={`text-xs font-bold ${payload[0].payload.pnl >= 0 ? 'text-primary' : 'text-red-500'}`}>
                    ({payload[0].payload.pnl >= 0 ? '+' : ''}{payload[0].payload.pnl.toFixed(2)})
                </p>
            </div>
        );
    }
    return null;
};

export function EquityChart({ data }: EquityChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-gray-500 bg-gray-50 dark:bg-white/5 rounded-xl border border-dashed border-gray-200 dark:border-white/10">
                No trading data available to display chart.
            </div>
        );
    }

    // Determine min/max for YAxis scaling to make chart look better
    const minVal = Math.min(...data.map(d => d.balance));
    const maxVal = Math.max(...data.map(d => d.balance));
    const padding = (maxVal - minVal) * 0.1; // 10% padding

    return (
        <div className="w-full h-[350px]">
            <ResponsiveContainer width="100%" height="100%" minWidth={0}>
                <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-white/5" />
                    <XAxis
                        dataKey="date"
                        tickFormatter={(str) => format(new Date(str), "MMM dd")}
                        stroke="#9CA3AF"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        dy={10}
                    />
                    <YAxis
                        stroke="#9CA3AF"
                        tick={{ fontSize: 12 }}
                        axisLine={false}
                        tickLine={false}
                        domain={[minVal - padding, maxVal + padding]}
                        tickFormatter={(val) => `$${val}`}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="hsl(var(--primary))"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorBalance)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
