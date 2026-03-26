"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";

interface PlanAdherenceProps {
    data: {
        followed: { count: number; winRate: number; totalPnL: number };
        notFollowed: { count: number; winRate: number; totalPnL: number };
    };
}

export function PlanAdherence({ data }: PlanAdherenceProps) {
    const chartData = [
        { name: "Followed Plan", value: data.followed.count, color: "#10B981" },
        { name: "Deviated", value: data.notFollowed.count, color: "#EF4444" },
    ].filter(d => d.value > 0);

    return (
        <div className="bg-white dark:bg-[#1E2028] p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col h-full">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                Plan Adherence
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
                <div className="h-64 w-full">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0}>
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
                                    <Cell key={`cell-${index}`} fill={entry.color} />
                                ))}
                            </Pie>
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#1F2937",
                                    border: "none",
                                    borderRadius: "8px",
                                    color: "#F3F4F6",
                                }}
                            />
                            <Legend verticalAlign="bottom" height={36} />
                        </PieChart>
                    </ResponsiveContainer>
                </div>

                <div className="space-y-4">
                    <div className="p-4 bg-green-50 dark:bg-green-500/10 rounded-xl border border-green-100 dark:border-green-500/20">
                        <div className="text-sm font-bold text-green-700 dark:text-green-400 mb-1">Followed Plan</div>
                        <div className="flex justify-between items-end">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.followed.count} <span className="text-xs font-normal text-gray-500">trades</span></div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-green-600 dark:text-green-400">{data.followed.winRate.toFixed(1)}% WR</div>
                                <div className="text-xs text-gray-500">${data.followed.totalPnL.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 bg-red-50 dark:bg-red-500/10 rounded-xl border border-red-100 dark:border-red-500/20">
                        <div className="text-sm font-bold text-red-700 dark:text-red-400 mb-1">Deviated</div>
                        <div className="flex justify-between items-end">
                            <div className="text-2xl font-bold text-gray-900 dark:text-white">{data.notFollowed.count} <span className="text-xs font-normal text-gray-500">trades</span></div>
                            <div className="text-right">
                                <div className="text-sm font-bold text-red-600 dark:text-red-400">{data.notFollowed.winRate.toFixed(1)}% WR</div>
                                <div className="text-xs text-gray-500">${data.notFollowed.totalPnL.toFixed(2)}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
