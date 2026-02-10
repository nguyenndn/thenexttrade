"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts';

export function UserRoleChart({ data }: { data: { name: string; value: number }[] }) {
    const COLORS = ['hsl(var(--primary))', '#2F80ED', '#F2994A'];

    return (
        <ResponsiveContainer width="100%" height="100%">
            <PieChart>
                <Pie
                    data={data}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    fill="#8884d8"
                    paddingAngle={5}
                    dataKey="value"
                >
                    {data.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                </Pie>
                <Tooltip
                    contentStyle={{ backgroundColor: '#1A1D29', borderColor: '#333', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                />
                <Legend />
            </PieChart>
        </ResponsiveContainer>
    );
}
