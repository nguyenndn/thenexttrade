"use client";

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Area,
    ComposedChart,
} from "recharts";
import { format, parseISO } from "date-fns";

interface EquityCurveProps {
    data: Array<{
        date: string;
        balance: number;
        pnl: number;
    }>;
}

export function EquityCurve({ data }: EquityCurveProps) {
    if (!data || data.length === 0) {
        return (
            <div className="bg-white dark:bg-[#1E2028] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm h-[400px] flex items-center justify-center text-gray-400">
                No equity data available
            </div>
        );
    }

    // Format data for chart
    const chartData = data.map(item => ({
        ...item,
        dateLabel: format(parseISO(item.date), "MMM dd"),
    }));

    // Calculate min/max for Y axis with some padding
    const balances = data.map(d => d.balance);
    const minBalance = Math.min(...balances) * 0.99;
    const maxBalance = Math.max(...balances) * 1.01;

    return (
        <div className="bg-white dark:bg-[#1E2028] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                Equity Curve
            </h3>

            <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={chartData}>
                        <defs>
                            <linearGradient id="colorBalance" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#00C888" stopOpacity={0.3} />
                                <stop offset="95%" stopColor="#00C888" stopOpacity={0} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                            opacity={0.1}
                        />
                        <XAxis
                            dataKey="dateLabel"
                            stroke="#9CA3AF"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            minTickGap={30}
                        />
                        <YAxis
                            stroke="#9CA3AF"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            domain={[minBalance, maxBalance]}
                            tickFormatter={(value) => `$${(value / 1000).toFixed(1)}k`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1F2937",
                                border: "none",
                                borderRadius: "12px",
                                padding: "12px",
                                boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
                            }}
                            labelStyle={{ color: "#9CA3AF", marginBottom: "4px" }}
                            formatter={(value: any, name: any) => [
                                `$${Number(value).toLocaleString()}`,
                                name === "balance" ? "Balance" : "P&L",
                            ]}
                            labelFormatter={(label) => `Date: ${label}`}
                        />
                        <Area
                            type="monotone"
                            dataKey="balance"
                            stroke="#00C888"
                            strokeWidth={2}
                            fill="url(#colorBalance)"
                        />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
