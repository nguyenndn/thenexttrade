"use client";

import { BarChart2 } from "lucide-react";
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

interface PairPerformanceProps {
    data: Array<{
        symbol: string;
        pnl: number;
        tradeCount: number;
        winRate: number;
    }>;
}
import { processPairPerformanceData } from "./utils/chartHelpers";

export function PairPerformance({ data }: PairPerformanceProps) {
    const { theme } = useTheme();
    const isDark = theme === "dark";

    const { isEmpty, chartData, bestPair } = processPairPerformanceData(data);

    return (
        <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow duration-200 group">
            <div className="flex items-center gap-2.5 mb-6">
                <div className="p-2 bg-primary/10 rounded-lg text-primary">
                    <BarChart2 size={18} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-sm">Performance by Pair</h3>
                    <p className="text-xs text-gray-400">Top traded symbols</p>
                </div>
            </div>

            {data.length === 0 ? (
                <ChartEmptyState />
            ) : (
                <div className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            layout="vertical"
                            margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
                        >
                            <CartesianGrid strokeDasharray="3 3" horizontal={true} vertical={false} stroke={isDark ? "#333" : "#f0f0f0"} />
                            <XAxis type="number" hide />
                            <YAxis
                                dataKey="symbol"
                                type="category"
                                axisLine={false}
                                tickLine={false}
                                tick={{ fontSize: 11, fontWeight: 600, fill: isDark ? '#9CA3AF' : '#4B5563' }}
                                width={80}
                            />
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
                                radius={[0, 4, 4, 0]}
                                barSize={20}
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
            
            {!isEmpty && bestPair && (
                <div className="mt-4 flex justify-between items-center text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                    <span>Best: {bestPair.symbol}</span>
                    <span className="text-primary">+{bestPair.pnl.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</span>
                </div>
            )}
        </div>
    );
}
