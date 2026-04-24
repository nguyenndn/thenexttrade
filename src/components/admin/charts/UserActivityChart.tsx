"use client";

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export function UserActivityChart({ data }: { data: { name: string; value: number }[] }) {
    return (
        <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={200}>
            <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="#333" opacity={0.1} />
                <XAxis
                    dataKey="name"
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                />
                <YAxis
                    stroke="#888888"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                    tickFormatter={(value) => `${value}`}
                />
                <Tooltip
                    contentStyle={{ backgroundColor: '#1A1D29', borderColor: '#333', color: '#fff' }}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                />
                <Bar dataKey="value" fill="#2F80ED" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
