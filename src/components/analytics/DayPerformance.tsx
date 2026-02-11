"use client";

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";

interface DayPerformanceProps {
    data: Array<{
        day: string;
        dayIndex: number;
        pnl: number;
        tradeCount: number;
    }>;
}

export function DayPerformance({ data }: DayPerformanceProps) {
    // Ensure we have all weekdays (Mon-Fri)
    const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];
    const chartData = weekdays.map((day, index) => {
        const dayData = data.find(d => d.day === day);
        return {
            day: day.substring(0, 3), // Mon, Tue, etc.
            fullDay: day,
            pnl: dayData?.pnl || 0,
            tradeCount: dayData?.tradeCount || 0,
        };
    });

    // Find best day
    const bestDay = [...chartData].sort((a, b) => b.pnl - a.pnl)[0];

    return (
        <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
            <h3 className="font-bold text-gray-900 dark:text-white mb-4">
                Performance by Day
            </h3>

            <div className="h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke="#374151"
                            opacity={0.1}
                            vertical={false}
                        />
                        <XAxis
                            dataKey="day"
                            stroke="#9CA3AF"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                        />
                        <YAxis
                            stroke="#9CA3AF"
                            fontSize={12}
                            tickLine={false}
                            axisLine={false}
                            tickFormatter={(value) => `$${value}`}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1F2937",
                                border: "none",
                                borderRadius: "12px",
                                padding: "12px",
                            }}
                            itemStyle={{ color: "#fff" }}
                            formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "P&L"]}
                            labelFormatter={(label) => {
                                const day = chartData.find(d => d.day === label);
                                return `${day?.fullDay} (${day?.tradeCount} trades)`;
                            }}
                        />
                        <Bar dataKey="pnl" radius={[4, 4, 0, 0]}>
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.pnl >= 0 ? "hsl(var(--primary))" : "#EF4444"}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>

            {/* Best day insight */}
            <div className="mt-4 pt-4 border-t border-gray-100 dark:border-white/5">
                <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500">Best day: {bestDay?.fullDay}</span>
                    <span className={`font-bold ${bestDay?.pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {bestDay?.pnl >= 0 ? '+' : ''}${bestDay?.pnl.toLocaleString()}
                    </span>
                </div>
            </div>
        </div>
    );
}
