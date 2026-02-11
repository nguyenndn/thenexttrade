"use client";

import { Info, Target, TrendingUp, ShieldAlert } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface StatsGridProps {
    data: {
        profitFactor: number;
        avgWin: number;
        avgLoss: number;
    };
}

export function StatsGrid({ data }: StatsGridProps) {
    const stats = [
        {
            label: "Profit Factor",
            value: data.profitFactor.toFixed(2),
            desc: "Gross Profit / Gross Loss",
            color: "text-blue-500",
            bg: "bg-blue-50 dark:bg-blue-500/10",
            icon: TrendingUp
        },
        {
            label: "Avg Win",
            value: `$${data.avgWin.toFixed(2)}`,
            desc: "Average profit per winning trade",
            color: "text-green-500",
            bg: "bg-green-50 dark:bg-green-500/10",
            icon: Target
        },
        {
            label: "Avg Loss",
            value: `$${data.avgLoss.toFixed(2)}`,
            desc: "Average loss per losing trade",
            color: "text-red-500",
            bg: "bg-red-50 dark:bg-red-500/10",
            icon: ShieldAlert
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {stats.map((stat, i) => {
                const Icon = stat.icon;
                const borderColor = i === 0 ? "border-t-blue-500" : i === 1 ? "border-t-green-500" : "border-t-red-500";
                return (
                    <div key={i} className={`bg-white dark:bg-[#0B0E14] p-5 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow border-t-4 ${borderColor}`}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <Icon size={20} className={stat.color} />
                            </div>
                            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{stat.label}</h3>

                        </div>
                        <p className={`text-lg font-black ${stat.color}`}>{stat.value}</p>
                        <p className="text-xs text-gray-400 font-medium mt-1">{stat.desc}</p>
                    </div>
                );
            })}
        </div>
    );
}
