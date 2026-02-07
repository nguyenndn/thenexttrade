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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, i) => {
                const Icon = stat.icon;
                const borderColor = i === 0 ? "border-t-blue-500" : i === 1 ? "border-t-green-500" : "border-t-red-500";
                return (
                    <div key={i} className={`bg-white dark:bg-[#0B0E14] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow border-t-4 ${borderColor}`}>
                        <div className="flex justify-between items-start mb-4">
                            <div className={`p-3 rounded-xl ${stat.bg}`}>
                                <Icon size={20} className={stat.color} />
                            </div>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <div className="p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">
                                            <Info size={16} className="text-gray-300 hover:text-gray-500" />
                                        </div>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{stat.desc}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{stat.label}</h3>
                        <p className={`text-2xl font-black ${stat.color}`}>{stat.value}</p>
                    </div>
                );
            })}
        </div>
    );
}
