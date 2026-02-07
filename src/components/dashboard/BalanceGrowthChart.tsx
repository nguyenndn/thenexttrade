"use client";

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
} from "recharts";
import { format } from "date-fns";

interface BalanceGrowthChartProps {
    data: {
        date: string; // ISO date string or formatted date
        balance: number;
    }[];
}

export function BalanceGrowthChart({ data }: BalanceGrowthChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className="h-[300px] w-full flex items-center justify-center text-gray-400">
                No data available for this period
            </div>
        );
    }

    // Calculate duration and domain
    const firstDate = new Date(data[0]?.date);
    const lastDate = new Date(data[data.length - 1]?.date);
    const startTime = firstDate.getTime();
    const endTime = lastDate.getTime();
    const durationHours = (endTime - startTime) / (1000 * 60 * 60);
    const isShortDuration = durationHours <= 72; // 3 days

    let domainMin = startTime;
    let domainMax = endTime;
    let xTicks: number[] | undefined;

    if (isShortDuration) {
        // Force domain to start at 00:00 of first day and end at 23:59 of last day
        const startOfDay = new Date(firstDate);
        startOfDay.setHours(0, 0, 0, 0);
        domainMin = startOfDay.getTime();

        const endOfDay = new Date(lastDate);
        endOfDay.setHours(23, 59, 59, 999);
        domainMax = endOfDay.getTime();

        // Generate hourly ticks (every 4 hours)
        xTicks = [];
        let current = domainMin;
        while (current <= domainMax) {
            xTicks.push(current);
            current += 4 * 60 * 60 * 1000; // 4 hours
        }
    }

    // Format data for chart
    const chartData = data.map(item => {
        const date = new Date(item.date);
        return {
            ...item,
            timestamp: date.getTime(),
            dateFormatted: format(date, isShortDuration ? "HH:mm" : "MMM dd"),
            fullDate: format(date, "MMM dd, HH:mm"),
        };
    });

    return (
        <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                    <defs>
                        <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#00C888" stopOpacity={0.3} />
                            <stop offset="95%" stopColor="#00C888" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" className="dark:stroke-white/5" />
                    <XAxis
                        dataKey="timestamp"
                        type="number"
                        domain={[domainMin, domainMax]}
                        ticks={xTicks}
                        tickFormatter={(time) => format(new Date(time), isShortDuration ? "HH:mm" : "MMM dd")}
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickMargin={10}
                        minTickGap={30}
                    />
                    <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontSize: 12 }}
                        tickFormatter={(value) => `$${value}`}
                        domain={['auto', 'auto']}
                    />
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderColor: '#E5E7EB',
                            borderRadius: '12px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                        }}
                        itemStyle={{ color: '#00C888', fontWeight: 'bold' }}
                        labelStyle={{ color: '#6B7280', marginBottom: '4px' }}
                        labelFormatter={(value) => format(new Date(value), "MMM dd, HH:mm")}
                        formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Balance"]}
                    />
                    <Area
                        type="monotone"
                        dataKey="balance"
                        stroke="#00C888"
                        strokeWidth={3}
                        fillOpacity={1}
                        fill="url(#colorBalance)"
                    />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
}
