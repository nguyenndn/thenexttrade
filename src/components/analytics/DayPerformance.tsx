"use client";

import { Activity } from "lucide-react";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell
} from "recharts";
import { useTheme } from "@/components/providers/ThemeProvider";
import { ChartEmptyState } from "@/components/ui/ChartEmptyState";

interface DayPerformanceProps {
    data: Array<{
        day: string;
        dayIndex: number;
        pnl: number;
        tradeCount: number;
    }>;
}
import { processDayPerformanceData } from "./utils/chartHelpers";

export function DayPerformance({ data }: DayPerformanceProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const { chartData, bestDay, hasData } = processDayPerformanceData(data);

    return (
        <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow duration-200 group">
            <div className="flex items-center gap-2.5 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <Activity size={18} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Performance by Day</h3>
                    <p className="text-xs text-gray-400">Weekday distribution</p>
                </div>
            </div>

            {!hasData ? (
                <ChartEmptyState />
            ) : (
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={chartData}
                        margin={{ top: 5, right: 10, left: 10, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={isDark ? "#333" : "#f0f0f0"} />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fontSize: 11, fontWeight: 600, fill: isDark ? '#9CA3AF' : '#4B5563' }}
                        />
                        <YAxis hide />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: isDark ? '#1E2028' : '#fff',
                                border: 'none',
                                borderRadius: '12px',
                                boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
                                fontSize: '12px'
                            }}
                            itemStyle={{ color: isDark ? '#fff' : '#000' }}
                            formatter={(value: any) => [`$${Number(value).toLocaleString()}`, "PnL"]}
                        />
                        <Bar
                            dataKey="pnl"
                            radius={[4, 4, 0, 0]}
                            barSize={32}
                        >
                            {chartData.map((entry, index) => (
                                <Cell
                                    key={`cell-${index}`}
                                    fill={entry.pnl >= 0 ? "#00C888" : "#EF4444"}
                                    fillOpacity={0.8}
                                />
                            ))}
                        </Bar>
                    </BarChart>
                </ResponsiveContainer>
            </div>
            )}

            {hasData && bestDay && (
                <div className="mt-4 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <span>Strongest Day: {bestDay.name}</span>
                    <span className="text-primary">+{bestDay.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                </div>
            )}
        </div>
    );
}
