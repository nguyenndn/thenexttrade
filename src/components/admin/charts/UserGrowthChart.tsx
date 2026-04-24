
"use client";

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card } from '@/components/ui/Card';
import { format } from 'date-fns';

interface DataPoint {
    date: string;
    count: number;
}

interface UserGrowthChartProps {
    data?: DataPoint[];
}

export function UserGrowthChart({ data = [] }: UserGrowthChartProps) {
    // Format dates for display
    const formattedData = useMemo(() => {
        if (!data) return [];
        return data.map(item => ({
            ...item,
            displayDate: format(new Date(item.date), 'dd/MM'),
        }));
    }, [data]);

    if (!data || data.length === 0) {
        return (
            <Card className="p-6 h-full flex flex-col bg-white dark:bg-[#0B0E14] border-gray-200 dark:border-white/10 rounded-xl">
                <div className="mb-6">
                    <h3 className="text-lg font-bold text-gray-700 dark:text-white">User Growth</h3>
                    <p className="text-sm text-gray-600 dark:text-gray-300">No data available</p>
                </div>
                <div className="flex-1 flex items-center justify-center text-gray-500">
                    No signups in the last 30 days
                </div>
            </Card>
        );
    }

    return (
        <Card className="p-6 h-full flex flex-col bg-white dark:bg-[#0B0E14] border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow rounded-xl">
            <div className="mb-6">
                <h3 className="text-lg font-bold text-gray-700 dark:text-white">User Growth</h3>
                <p className="text-sm text-gray-600 dark:text-gray-300">New registrations over the last 30 days</p>
            </div>

            <div className="flex-1 min-h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
                    <AreaChart
                        data={formattedData}
                        margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                    >
                        <defs>
                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)" />
                        <XAxis
                            dataKey="displayDate"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            dy={10}
                        />
                        <YAxis
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9ca3af', fontSize: 12 }}
                            allowDecimals={false}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: '#1f2937',
                                border: 'none',
                                borderRadius: '8px',
                                color: '#fff'
                            }}
                            itemStyle={{ color: '#fff' }}
                            labelStyle={{ color: '#9ca3af' }}
                        />
                        <Area
                            type="monotone"
                            dataKey="count"
                            stroke="#3b82f6"
                            strokeWidth={3}
                            fillOpacity={1}
                            fill="url(#colorCount)"
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </Card>
    );
}

