"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface ProfitDistributionChartProps {
    data: {
        name: string;
        value: number; // Profit value (absolute or percentage)
    }[];
    height?: number | string;
}

const COLORS = ['#00C888', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444'];

export function ProfitDistributionChart({ data, height = 300 }: ProfitDistributionChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className={`w-full flex items-center justify-center text-gray-400`} style={{ height }}>
                No data available
            </div>
        );
    }

    // Filter out zero or negative values if only showing distribution of profitable trades
    // Or we might want to show absolute volume. For now, let's assume valid positive values for distribution.
    const validData = data.filter(d => d.value > 0);

    return (
        <div className="w-full" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                    <Pie
                        data={validData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {validData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} strokeWidth={0} />
                        ))}
                    </Pie>
                    <Tooltip
                        contentStyle={{
                            backgroundColor: 'rgba(255, 255, 255, 0.9)',
                            borderRadius: '12px',
                            border: 'none',
                            boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'
                        }}
                        itemStyle={{ color: '#111827', fontWeight: 600 }}
                        formatter={(value: any) => [`$${Number(value).toFixed(2)}`, "Profit"]}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                        formatter={(value) => <span className="text-gray-500 dark:text-gray-400 text-xs font-medium ml-1">{value}</span>}
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
