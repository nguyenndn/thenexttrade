"use client";

import { Target, TrendingUp, ShieldAlert } from "lucide-react";
import { NumberTicker } from "@/components/ui/NumberTicker";

interface StatsGridProps {
    data: {
        profitFactor: number;
        avgWin: number;
        avgLoss: number;
    };
    vertical?: boolean;
}

export function StatsGrid({ data, vertical = false }: StatsGridProps) {
    const stats = [
        {
            label: "Profit Factor",
            value: (
                <NumberTicker
                    value={data.profitFactor}
                    decimals={2}
                />
            ),
            desc: "Gross Profit / Gross Loss",
            color: "text-blue-500",
            bg: "bg-blue-50 dark:bg-blue-500/10",
            icon: TrendingUp,
        },
        {
            label: "Avg Win",
            value: (
                <NumberTicker
                    value={data.avgWin}
                    prefix="$"
                    decimals={2}
                />
            ),
            desc: "Average profit per winning trade",
            color: "text-green-500",
            bg: "bg-green-50 dark:bg-green-500/10",
            icon: Target,
        },
        {
            label: "Avg Loss",
            value: (
                <NumberTicker
                    value={Math.abs(data.avgLoss)}
                    prefix="-$"
                    decimals={2}
                />
            ),
            desc: "Average loss per losing trade",
            color: "text-red-500",
            bg: "bg-red-50 dark:bg-red-500/10",
            icon: ShieldAlert,
        },
    ];

    return (
        <div
            className={
                vertical
                    ? "flex flex-col gap-4"
                    : "grid grid-cols-1 md:grid-cols-3 gap-4"
            }
        >
            {stats.map((stat, i) => {
                const Icon = stat.icon;
                return (
                    <div
                        key={i}
                        className="bg-white dark:bg-[#1E2028] p-5 rounded-2xl border border-dashboard shadow-sm hover:shadow-md transition-[box-shadow,transform] duration-200 ease-out hover:-translate-y-0.5"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <Icon size={20} className={stat.color} />
                            </div>
                            <h3 className="font-bold text-gray-700 dark:text-white text-sm">
                                {stat.label}
                            </h3>
                        </div>
                        <p className={`text-lg font-black ${stat.color}`}>
                            {stat.value}
                        </p>
                        <p className="text-xs text-gray-500 font-medium mt-1">
                            {stat.desc}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}
