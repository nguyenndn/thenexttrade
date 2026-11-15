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

interface ConfidencePoint {
    level: number;
    winRate: number;
    avgPnL: number;
    tradeCount: number;
}

interface ConfidenceCorrelationProps {
    data: ConfidencePoint[];
}

export function ConfidenceCorrelation({ data }: ConfidenceCorrelationProps) {
    return (
        <div className="bg-white dark:bg-[#1E2028] p-5 rounded-xl border border-dashboard shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col h-full">
            <h3 className="text-sm font-bold text-gray-700 dark:text-white mb-4">
                Confidence vs. Performance
            </h3>
            <p className="text-sm text-gray-600 mb-6">
                Do you perform better when you are more confident?
            </p>

            <div className="h-80 w-full">
                <ResponsiveContainer
                    width="100%"
                    height="100%"
                    minWidth={0}
                    minHeight={200}
                >
                    <BarChart
                        data={data}
                        margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            opacity={0.1}
                            vertical={false}
                        />
                        <XAxis
                            dataKey="level"
                            tick={{ fill: "#6B7280" }}
                            label={{
                                value: "Confidence Level (1-5)",
                                position: "insideBottom",
                                offset: -5,
                                fill: "#9CA3AF",
                                fontSize: 12,
                            }}
                        />
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            stroke="#00C888"
                            label={{
                                value: "Win Rate (%)",
                                angle: -90,
                                position: "insideLeft",
                                fill: "#00C888",
                                fontSize: 12,
                            }}
                        />
                        <YAxis
                            yAxisId="right"
                            orientation="right"
                            stroke="#10B981"
                            label={{
                                value: "Avg PnL ($)",
                                angle: 90,
                                position: "insideRight",
                                fill: "#10B981",
                                fontSize: 12,
                            }}
                        />
                        <Tooltip
                            content={({ active, payload }) => {
                                if (!active || !payload?.length) return null;
                                const point = payload[0]
                                    .payload as ConfidencePoint;
                                return (
                                    <div className="bg-white dark:bg-[#1E2028] text-gray-800 dark:text-gray-100 p-3 rounded-lg border border-dashboard shadow-xl text-xs">
                                        <p className="font-bold text-gray-900 dark:text-white mb-1 text-sm">
                                            Confidence {point.level}/5
                                        </p>
                                        <div className="space-y-1">
                                            <div className="flex justify-between gap-4">
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    Win Rate:
                                                </span>
                                                <span className="font-mono tabular-nums font-bold text-emerald-600 dark:text-[#00C888]">
                                                    {point.winRate.toFixed(1)}%
                                                </span>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    Avg P&L:
                                                </span>
                                                <span
                                                    className={`font-mono tabular-nums font-bold ${point.avgPnL >= 0 ? "text-emerald-600 dark:text-primary" : "text-red-500"}`}
                                                >
                                                    ${point.avgPnL.toFixed(2)}
                                                </span>
                                            </div>
                                            <div className="flex justify-between gap-4">
                                                <span className="text-gray-500 dark:text-gray-400">
                                                    Trades:
                                                </span>
                                                <span className="font-mono tabular-nums">
                                                    {point.tradeCount}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                );
                            }}
                            cursor={{ fill: "transparent" }}
                        />
                        <Bar
                            yAxisId="left"
                            dataKey="winRate"
                            name="Win Rate %"
                            fill="#00C888"
                            radius={[4, 4, 0, 0]}
                            barSize={30}
                        />
                        <Bar
                            yAxisId="right"
                            dataKey="avgPnL"
                            name="Avg PnL $"
                            fill="#10B981"
                            radius={[4, 4, 0, 0]}
                            barSize={30}
                        />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
}
