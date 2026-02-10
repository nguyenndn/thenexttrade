"use client";

import { TrendingUp, TrendingDown, Target, Activity } from "lucide-react";

interface StatsProps {
    stats: {
        totalPnL: number;
        winRate: number;
        totalTrades: number;
        winCount: number;
        lossCount: number;
    };
}

export default function JournalStats({ stats }: StatsProps) {
    return (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <div className="bg-white dark:bg-[#1E2028] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-blue-50 dark:bg-blue-500/10 text-blue-500 rounded-lg">
                        <Activity size={18} />
                    </div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Trades</span>
                </div>
                <div className="text-2xl font-black text-gray-900 dark:text-white pl-1">
                    {stats.totalTrades}
                </div>
            </div>

            <div className="bg-white dark:bg-[#1E2028] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-purple-50 dark:bg-purple-500/10 text-purple-500 rounded-lg">
                        <Target size={18} />
                    </div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Win Rate</span>
                </div>
                <div className="text-2xl font-black text-gray-900 dark:text-white pl-1">
                    {stats.winRate.toFixed(1)}%
                </div>
            </div>

            <div className="bg-white dark:bg-[#1E2028] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-green-50 dark:bg-green-500/10 text-green-500 rounded-lg">
                        <TrendingUp size={18} />
                    </div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Net Profit</span>
                </div>
                <div className={`text-2xl font-black pl-1 ${stats.totalPnL >= 0 ? "text-primary" : "text-red-500"}`}>
                    ${stats.totalPnL.toLocaleString()}
                </div>
            </div>

            <div className="bg-white dark:bg-[#1E2028] p-5 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 bg-orange-50 dark:bg-orange-500/10 text-orange-500 rounded-lg">
                        <TrendingDown size={18} />
                    </div>
                    <span className="text-sm font-medium text-gray-500 dark:text-gray-400">W/L Ratio</span>
                </div>
                <div className="text-2xl font-black text-gray-900 dark:text-white pl-1">
                    {stats.winCount}/{stats.lossCount}
                </div>
            </div>
        </div>
    );
}
