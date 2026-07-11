
"use client";

import { useMemo } from 'react';
import { AreaChart, Area, XAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Users } from 'lucide-react';
import { format } from 'date-fns';

interface DataPoint {
 date: string;
 count: number;
}

interface UserGrowthChartProps {
 data?: DataPoint[];
}

export function UserGrowthChart({ data = [] }: UserGrowthChartProps) {
 const formattedData = useMemo(() => {
 if (!data) return [];
 return data.map(item => ({
 ...item,
 displayDate: format(new Date(item.date), 'dd/MM'),
 }));
 }, [data]);

 const totalNew = useMemo(() => data.reduce((sum, d) => sum + d.count, 0), [data]);

 if (!data || data.length === 0) {
 return (
 <div className="bg-white dark:bg-[#1E2028] p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm h-full flex flex-col">
 <div className="flex items-center gap-2 mb-3">
 <Users size={16} className="text-gray-400" />
 <h3 className="text-sm font-bold text-gray-700 dark:text-white">User Growth</h3>
 </div>
 <div className="flex-1 flex items-center justify-center text-gray-400 text-sm">
 No signups in the last 30 days
 </div>
 </div>
 );
 }

 return (
 <div className="bg-white dark:bg-[#1E2028] p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm h-full flex flex-col">
 {/* Header */}
 <div className="flex items-center justify-between mb-3">
 <div className="flex items-center gap-2">
 <Users size={16} className="text-gray-400" />
 <h3 className="text-sm font-bold text-gray-700 dark:text-white">User Growth</h3>
 <span className="text-xs text-gray-400">30d</span>
 </div>
 <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-primary/10">
 <TrendingUp size={12} className="text-primary" />
 <span className="text-sm font-bold text-primary">{totalNew}</span>
 <span className="text-xs text-primary/60">new</span>
 </div>
 </div>

 {/* Chart */}
 <div className="flex-1 min-h-0" style={{ height: 140 }}>
 <ResponsiveContainer width="100%" height="100%" minWidth={0}>
 <AreaChart
 data={formattedData}
 margin={{ top: 5, right: 0, left: 0, bottom: 0 }}
 >
 <defs>
 <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
 <stop offset="5%" stopColor="var(--color-primary, #3b82f6)" stopOpacity={0.2} />
 <stop offset="95%" stopColor="var(--color-primary, #3b82f6)" stopOpacity={0} />
 </linearGradient>
 </defs>
 <XAxis
 dataKey="displayDate"
 axisLine={false}
 tickLine={false}
 tick={{ fill: '#9ca3af', fontSize: 10 }}
 dy={4}
 interval="preserveStartEnd"
 />
 <Tooltip
 contentStyle={{
 backgroundColor: '#1f2937',
 border: 'none',
 borderRadius: '8px',
 color: '#fff',
 fontSize: '11px',
 padding: '4px 8px',
 }}
 itemStyle={{ color: '#fff' }}
 labelStyle={{ color: '#9ca3af', fontSize: '10px' }}
 />
 <Area
 type="monotone"
 dataKey="count"
 stroke="var(--color-primary, #3b82f6)"
 strokeWidth={2}
 fillOpacity={1}
 fill="url(#colorCount)"
 />
 </AreaChart>
 </ResponsiveContainer>
 </div>
 </div>
 );
}
