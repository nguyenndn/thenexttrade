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
import { Scale } from "lucide-react";
import { ChartContainer } from "@/components/ui/ChartContainer";

interface WinLossComparisonChartProps {
    avgWin: number;
    avgLoss: number;
}

export function WinLossComparisonChart({
    avgWin,
    avgLoss,
}: WinLossComparisonChartProps) {
    const hasData = avgWin > 0 || avgLoss > 0;

    const header = (
        <div className="px-5 py-3.5 border-b border-dashboard flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
                <div className="p-2 bg-cyan-500/10 rounded-lg text-cyan-500">
                    <Scale size={18} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-700 dark:text-white text-sm">
                        Win / Loss Comparison
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Average win vs average loss size
                    </p>
                </div>
            </div>
        </div>
    );

    if (!hasData) {
        return (
            <div className="w-full h-full flex flex-col overflow-hidden">
                {header}
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center font-medium text-sm text-gray-500 dark:text-gray-400">
                    <Scale size={26} className="mb-2 opacity-40" />
                    No data available
                </div>
            </div>
        );
    }

    const chartData = [
        { name: "Average Win", value: avgWin, color: "hsl(var(--primary))" },
        { name: "Average Loss", value: avgLoss, color: "#EF4444" },
    ];

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {header}
            <div className="flex-1 flex flex-col justify-between overflow-hidden p-4 pb-2 min-h-0">
                <ChartContainer
                    height="100%"
                    minHeight={100}
                    className="w-full h-full flex-1"
                >
                    <ResponsiveContainer
                        width="100%"
                        height="100%"
                        minWidth={0}
                        minHeight={0}
                        debounce={50}
                    >
                        <BarChart
                            data={chartData}
                            margin={{ top: 15, right: 15, left: -20, bottom: 5 }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                vertical={false}
                                stroke="#E5E7EB"
                                className="dark:stroke-white/5"
                            />
                            <XAxis
                                dataKey="name"
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fill: "var(--text-secondary)",
                                    fontSize: 11,
                                    fontWeight: 600,
                                }}
                            />
                            <YAxis
                                axisLine={false}
                                tickLine={false}
                                tick={{
                                    fill: "var(--text-secondary)",
                                    fontSize: 11,
                                }}
                                tickFormatter={(v) => `$${v}`}
                            />
                            <Tooltip
                                cursor={{ fill: "rgba(156,163,175,0.06)" }}
                                content={({ active, payload }: any) => {
                                    if (active && payload && payload.length) {
                                        const entry = payload[0].payload;
                                        return (
                                            <div className="bg-white dark:bg-[#1E2028] p-3 border border-dashboard rounded-lg shadow-xl">
                                                <p className="text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                                                    {entry.name}
                                                </p>
                                                <p className="text-sm font-black text-gray-900 dark:text-white">
                                                    $
                                                    {Number(entry.value).toFixed(2)}
                                                </p>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            <Bar
                                dataKey="value"
                                radius={[6, 6, 0, 0]}
                                maxBarSize={45}
                                isAnimationActive={true}
                                animationDuration={400}
                                animationEasing="ease-out"
                            >
                                {chartData.map((entry, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={entry.color}
                                    />
                                ))}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                </ChartContainer>

                {/* Extra insights inside widget */}
                <div className="flex items-center justify-around text-xs mt-2 border-t border-gray-100 dark:border-white/5 pt-2.5 shrink-0">
                    <div className="text-center">
                        <p className="text-gray-400">Ratio (W/L)</p>
                        <p className="font-extrabold text-gray-800 dark:text-gray-200">
                            {avgLoss > 0
                                ? (avgWin / avgLoss).toFixed(2)
                                : avgWin > 0
                                  ? "Infinity"
                                  : "0.00"}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-400">Avg Win</p>
                        <p className="font-extrabold text-emerald-500">
                            ${avgWin.toFixed(2)}
                        </p>
                    </div>
                    <div className="text-center">
                        <p className="text-gray-400">Avg Loss</p>
                        <p className="font-extrabold text-red-500">
                            ${avgLoss.toFixed(2)}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

