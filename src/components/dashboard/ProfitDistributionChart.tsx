"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";
import { PieChart as PieChartIcon } from "lucide-react";
import { ChartContainer } from "@/components/ui/ChartContainer";

interface ProfitDistributionChartProps {
    data: {
        name: string;
        value: number;
    }[];
    height?: number | string;
    innerRadius?: number | string;
    outerRadius?: number | string;
}

const COLORS = [
    "hsl(var(--primary))",
    "#3B82F6",
    "#F59E0B",
    "#8B5CF6",
    "#EC4899",
    "#EF4444",
];

export function ProfitDistributionChart({
    data,
    innerRadius = "60%",
    outerRadius = "80%",
}: ProfitDistributionChartProps) {
    const validData = (data || [])
        .filter((d) => d.value !== 0)
        .map((d) => ({ ...d, absValue: Math.abs(d.value) }));

    const header = (
        <div className="px-5 py-3.5 border-b border-dashboard flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
                    <PieChartIcon size={18} />
                </div>
                <div>
                    <h3 className="font-bold text-gray-700 dark:text-white text-sm">
                        Profit Distribution
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        P&L breakdown by symbol
                    </p>
                </div>
            </div>
        </div>
    );

    if (validData.length === 0) {
        return (
            <div className="flex flex-col w-full h-full overflow-hidden">
                {header}
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center font-medium text-sm text-gray-500 dark:text-gray-400">
                    <PieChartIcon size={26} className="mb-2 opacity-40" />
                    No data available
                </div>
            </div>
        );
    }

    const totalProfit = validData.reduce((sum, d) => sum + d.value, 0);

    return (
        <div className="flex flex-col h-full w-full overflow-hidden">
            {header}
            <div className="flex-1 flex flex-col overflow-hidden p-4 min-h-0">
                <ChartContainer
                    height="100%"
                    minHeight={100}
                    className="w-full h-full flex-1"
                >
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} debounce={50}>
                        <PieChart>
                            <defs>
                                {COLORS.map((color, i) => (
                                    <linearGradient
                                        key={`profitGrad${i}`}
                                        id={`profitGrad${i}`}
                                        x1="0"
                                        y1="0"
                                        x2="1"
                                        y2="1"
                                    >
                                        <stop
                                            offset="0%"
                                            stopColor={color}
                                            stopOpacity={1}
                                        />
                                        <stop
                                            offset="100%"
                                            stopColor={color}
                                            stopOpacity={0.7}
                                        />
                                    </linearGradient>
                                ))}
                            </defs>
                            <Pie
                                data={validData}
                                cx="50%"
                                cy="50%"
                                innerRadius={innerRadius}
                                outerRadius={outerRadius}
                                paddingAngle={4}
                                dataKey="absValue"
                                animationDuration={400}
                                animationEasing="ease-out"
                                animationBegin={0}
                                stroke="none"
                            >
                                {validData.map((_, index) => (
                                    <Cell
                                        key={`cell-${index}`}
                                        fill={`url(#profitGrad${index % COLORS.length})`}
                                        className="drop-shadow-sm"
                                    />
                                ))}
                            </Pie>
                            <Tooltip
                                content={({ active, payload }: any) => {
                                    if (active && payload && payload.length) {
                                        const d = payload[0].payload;
                                        return (
                                            <div className="bg-white dark:bg-[#1E2028] p-2.5 border border-dashboard rounded-lg shadow-xl flex items-center gap-2.5">
                                                <div
                                                    className="w-2.5 h-2.5 rounded-full"
                                                    style={{
                                                        backgroundColor:
                                                            COLORS[
                                                                validData.indexOf(
                                                                    d
                                                                ) % COLORS.length
                                                            ],
                                                    }}
                                                />
                                                <div>
                                                    <p className="text-xs font-medium text-gray-500">
                                                        {d.name}
                                                    </p>
                                                    <p className="text-sm font-black text-gray-700 dark:text-white">
                                                        $
                                                        {Number(d.value).toFixed(2)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    }
                                    return null;
                                }}
                            />
                            {/* Center label */}
                            <text
                                x="50%"
                                y="46%"
                                textAnchor="middle"
                                dominantBaseline="central"
                                className="fill-gray-400 text-[8px] font-medium"
                            >
                                TOTAL
                            </text>
                            <text
                                x="50%"
                                y="56%"
                                textAnchor="middle"
                                dominantBaseline="central"
                                className={`text-[10px] font-black ${totalProfit >= 0 ? "fill-emerald-600 dark:fill-emerald-400" : "fill-red-500"}`}
                            >
                                ${Math.abs(totalProfit).toFixed(0)}
                            </text>
                        </PieChart>
                    </ResponsiveContainer>
                </ChartContainer>
            </div>
        </div>
    );
}

