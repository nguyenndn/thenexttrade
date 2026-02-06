"use client";

import { Info } from "lucide-react";
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
            bg: "bg-blue-50 dark:bg-blue-500/10"
        },
        {
            label: "Avg Win",
            value: `$${data.avgWin.toFixed(2)}`,
            desc: "Average profit per winning trade",
            color: "text-green-500",
            bg: "bg-green-50 dark:bg-green-500/10"
        },
        {
            label: "Avg Loss",
            value: `$${data.avgLoss.toFixed(2)}`,
            desc: "Average loss per losing trade",
            color: "text-red-500",
            bg: "bg-red-50 dark:bg-red-500/10"
        },
    ];

    return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {stats.map((stat, i) => (
                <div key={i} className="flex items-center justify-between p-4 bg-white dark:bg-[#0B0E14] border border-gray-100 dark:border-white/5 rounded-2xl shadow-sm">
                    <div>
                        <div className="flex items-center gap-1.5 mb-1">
                            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">{stat.label}</span>
                            <TooltipProvider>
                                <Tooltip>
                                    <TooltipTrigger>
                                        <Info size={12} className="text-gray-300 hover:text-gray-500" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <p>{stat.desc}</p>
                                    </TooltipContent>
                                </Tooltip>
                            </TooltipProvider>
                        </div>
                        <div className={`text-xl font-black ${stat.color}`}>
                            {stat.value}
                        </div>
                    </div>
                    <div className={`h-10 w-10 rounded-full flex items-center justify-center ${stat.bg}`}>
                        {/* Optional mini visual or icon */}
                        <div className={`h-1.5 w-1.5 rounded-full ${stat.color.replace('text-', 'bg-')}`}></div>
                    </div>
                </div>
            ))}
        </div>
    );
}
