'use client';

import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface Props {
    data: Array<{ date: string; views: number }>;
}

export function PageviewTrend({ data }: Props) {
    return (
        <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 p-6">
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-base font-semibold text-gray-900 dark:text-white">Pageviews</h2>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {data.length > 0 && `${new Date(data[0].date).toLocaleDateString('en', { month: 'short', day: 'numeric' })} — ${new Date(data[data.length - 1].date).toLocaleDateString('en', { month: 'short', day: 'numeric' })}`}
                    </p>
                </div>
                <div className="text-right">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {data.reduce((s, d) => s + d.views, 0).toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">total views</p>
                </div>
            </div>
            <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <defs>
                            <linearGradient id="viewsGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(128,128,128,0.08)" />
                        <XAxis dataKey="date" axisLine={false} tickLine={false}
                            tick={{ fontSize: 11, fill: '#9ca3af' }}
                            tickFormatter={d => new Date(d).toLocaleDateString('en', { month: 'short', day: 'numeric' })} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#9ca3af' }} allowDecimals={false} />
                        <Tooltip
                            contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '10px', color: '#fff', fontSize: 13 }}
                            labelFormatter={d => new Date(d).toLocaleDateString('en', { weekday: 'long', month: 'short', day: 'numeric' })} />
                        <Area type="monotone" dataKey="views" stroke="#6366f1" strokeWidth={2}
                            fillOpacity={1} fill="url(#viewsGradient)" dot={false} activeDot={{ r: 4, fill: '#6366f1' }} />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
