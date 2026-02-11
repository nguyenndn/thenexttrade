"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface ProfitDistributionChartProps {
    data: {
        name: string;
        value: number; // Profit value (absolute or percentage)
    }[];
    height?: number | string;
    innerRadius?: number;
    outerRadius?: number;
}

const COLORS = ['hsl(var(--primary))', '#3B82F6', '#F59E0B', '#8B5CF6', '#EC4899', '#EF4444'];

export function ProfitDistributionChart({ data, height = 300, innerRadius = 60, outerRadius = 80 }: ProfitDistributionChartProps) {
    if (!data || data.length === 0) {
        return (
            <div className={`w-full flex items-center justify-center text-gray-400`} style={{ height }}>
                No data available
            </div>
        );
    }

    // Filter valid data (non-zero) and use absolute values for Pie slices
    const validData = data
        .filter(d => d.value !== 0)
        .map(d => ({ ...d, absValue: Math.abs(d.value) })); // Use absValue for slice size

    return (
        <div className="w-full" style={{ height }}>
            <ResponsiveContainer width="100%" height="100%">
                <PieChart key={JSON.stringify(validData)}>
                    <Pie
                        data={validData}
                        cx="50%"
                        cy="50%"
                        innerRadius={innerRadius}
                        outerRadius={outerRadius}
                        paddingAngle={5}
                        dataKey="absValue" // Use absolute value for drawing
                        animationDuration={1000}
                        animationBegin={0}
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
                        formatter={(value: any, name: any, props: any) => {
                             // Find original value from payload
                             const originalValue = props.payload.value;
                             return [`$${Number(originalValue).toFixed(2)}`, "Profit/Loss"];
                        }}
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
