"use client";

import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    Legend,
} from "recharts";

interface WinLossProps {
    data: {
        WIN: number;
        LOSS: number;
        BREAK_EVEN: number;
    };
}

export function WinLossChart({ data }: WinLossProps) {
    const chartData = [
        { name: "Wins", value: data.WIN, color: "#3B82F6" }, // Blue
        { name: "Losses", value: data.LOSS, color: "#EF4444" }, // Red
        { name: "Break Even", value: data.BREAK_EVEN, color: "#9CA3AF" }, // Gray
    ].filter((d) => d.value > 0);

    if (chartData.length === 0) {
        return (
            <div className="h-[300px] flex items-center justify-center text-gray-500 bg-gray-50 dark:bg-white/5 rounded-lg border border-dashed border-dashboard">
                No trades recorded.
            </div>
        );
    }

    return (
        <div className="w-full h-[300px]">
            <ResponsiveContainer
                width="100%"
                height="100%"
                minWidth={0}
                minHeight={200}
            >
                <PieChart>
                    <Pie
                        data={chartData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                    >
                        {chartData.map((entry, index) => (
                            <Cell
                                key={`cell-${index}`}
                                fill={entry.color}
                                strokeWidth={0}
                            />
                        ))}
                    </Pie>
                    <Tooltip
                        content={({ active, payload }) => {
                            if (!active || !payload?.length) return null;
                            const item = payload[0];
                            const total =
                                data.WIN + data.LOSS + data.BREAK_EVEN;
                            const pct =
                                total > 0
                                    ? (
                                          (Number(item.value || 0) / total) *
                                          100
                                      ).toFixed(1)
                                    : "0.0";
                            return (
                                <div className="bg-white dark:bg-[#1E2028] text-gray-800 dark:text-gray-100 px-3 py-2 rounded-lg border border-dashboard shadow-xl text-xs">
                                    <p className="font-bold text-gray-900 dark:text-white mb-0.5">
                                        {item.name}
                                    </p>
                                    <p className="font-mono tabular-nums text-gray-600 dark:text-gray-300">
                                        {item.value} trades ({pct}%)
                                    </p>
                                </div>
                            );
                        }}
                    />
                    <Legend
                        verticalAlign="bottom"
                        height={36}
                        iconType="circle"
                    />
                </PieChart>
            </ResponsiveContainer>
        </div>
    );
}
