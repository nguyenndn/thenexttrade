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

interface ConfidenceCorrelationProps {
    data: Array<{
        level: number;
        winRate: number;
        avgPnL: number;
        tradeCount: number;
    }>;
}

export function ConfidenceCorrelation({ data }: ConfidenceCorrelationProps) {
    return (
        <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                Confidence vs. Performance
            </h3>
            <p className="text-sm text-gray-500 mb-6">
                Do you perform better when you are more confident?
            </p>

            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} vertical={false} />
                        <XAxis
                            dataKey="level"
                            tick={{ fill: "#6B7280" }}
                            label={{ value: 'Confidence Level (1-5)', position: 'insideBottom', offset: -5, fill: '#9CA3AF', fontSize: 12 }}
                        />
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            stroke="#8884d8"
                            label={{ value: 'Win Rate (%)', angle: -90, position: 'insideLeft', fill: '#8884d8', fontSize: 12 }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#10B981"
                            label={{ value: 'Avg PnL ($)', angle: 90, position: 'insideRight', fill: '#10B981', fontSize: 12 }}
                        />
                        <Tooltip
                            contentStyle={{
                                backgroundColor: "#1F2937",
                                border: "none",
                                borderRadius: "8px",
                                color: "#F3F4F6",
                            }}
                        />
                        <Bar yAxisId="left" dataKey="winRate" name="Win Rate %" fill="#8884d8" radius={[4, 4, 0, 0]} barSize={30} />
                        <Bar yAxisId="right" dataKey="avgPnL" name="Avg PnL $" fill="#10B981" radius={[4, 4, 0, 0]} barSize={30} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
