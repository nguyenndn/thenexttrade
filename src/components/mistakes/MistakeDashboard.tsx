"use client";

import { useState } from "react";
import { startOfMonth, endOfMonth } from "date-fns";
import { AlertTriangle, TrendingDown, CheckCircle, XCircle, DollarSign } from "lucide-react";

import { MistakeCostChart } from "./MistakeCostChart";
import { MistakeFrequencyChart } from "./MistakeFrequencyChart";
import { getMistakeByCode } from "@/lib/mistakes";
import { Loader2 } from "lucide-react";



import { useMistakeStats } from "@/hooks/useMistakeStats";

export function MistakeDashboard() {
    const [dateRange, setDateRange] = useState({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date()),
    });

    const { data, isLoading } = useMistakeStats(dateRange.start, dateRange.end);

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="animate-spin text-primary" size={32} />
            </div>
        );
    }

    if (!data || data.tradesWithMistakes === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 dark:bg-white/5 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10">
                <div className="p-4 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-500 rounded-full mb-4">
                    <CheckCircle size={32} />
                </div>
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">No Mistakes Recorded</h3>
                <p className="text-gray-500 max-w-md">
                    Great job! You haven't logged any mistakes for this period.
                    Keep executing your plan with discipline.
                </p>
            </div>
        );
    }

    const mostCostly = data.mostCostlyMistake ? getMistakeByCode(data.mostCostlyMistake) : null;
    const mostFrequent = data.mostFrequentMistake ? getMistakeByCode(data.mostFrequentMistake) : null;
    
    const costlyStat = mostCostly ? data.mistakeStats.find(s => s.code === mostCostly.code) : null;
    const frequentStat = mostFrequent ? data.mistakeStats.find(s => s.code === mostFrequent.code) : null;

    return (
        <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* Cost of Mistakes */}
                <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center gap-3.5 mb-3">
                        <div className="p-3 bg-red-500/10 text-red-500 dark:text-red-400 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors duration-300 shadow-sm">
                            <DollarSign size={22} strokeWidth={2.5} />
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Cost of Mistakes</p>
                    </div>
                    <p className="text-3xl font-black text-red-500 tracking-tighter">
                        ${Math.abs(data.costOfMistakes).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400 font-medium mt-1.5 flex items-center gap-1.5">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
                        Total loss from mistake trades
                    </p>
                </div>

                {/* Win Rate Gap */}
                <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center gap-3.5 mb-3">
                        <div className="p-3 bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300 shadow-sm">
                            <TrendingDown size={22} strokeWidth={2.5} />
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Performance Gap</p>
                    </div>
                    <div className="flex items-end gap-2 mb-1">
                        <p className="text-3xl font-black text-gray-900 dark:text-white tracking-tighter leading-none">
                            {(data.cleanTradeWinRate - data.mistakeTradeWinRate).toFixed(1)}%
                        </p>
                        <span className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">diff</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-[11px] font-bold tracking-wide uppercase">
                        <span className="text-primary">{data.cleanTradeWinRate.toFixed(0)}% clean</span>
                        <span className="text-gray-300 dark:text-gray-600">vs</span>
                        <span className="text-red-500">{data.mistakeTradeWinRate.toFixed(0)}% w/ mistakes</span>
                    </div>
                </div>

                {/* Most Frequent */}
                <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center gap-3.5 mb-4">
                        <div className="p-3 bg-amber-500/10 text-amber-500 dark:text-amber-400 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300 shadow-sm">
                            <AlertTriangle size={22} strokeWidth={2.5} />
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Frequent Issue</p>
                    </div>
                    {mostFrequent ? (
                        <>
                            <p className="text-lg font-black text-gray-900 dark:text-white truncate tracking-tight">
                                {mostFrequent.emoji} {mostFrequent.name}
                            </p>
                            <p className="text-xs text-gray-400 font-medium mt-1.5 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                                Occurred {frequentStat?.count || 0} times
                            </p>
                        </>
                    ) : (<p className="text-sm font-medium text-gray-400">None</p>)}
                </div>

                {/* Deadliest Mistake */}
                <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow group">
                    <div className="flex items-center gap-3.5 mb-4">
                        <div className="p-3 bg-purple-500/10 text-purple-500 dark:text-purple-400 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300 shadow-sm">
                            <XCircle size={22} strokeWidth={2.5} />
                        </div>
                        <p className="text-[11px] font-black uppercase tracking-wider text-gray-500 dark:text-gray-400">Costliest Mistake</p>
                    </div>
                    {mostCostly ? (
                        <>
                            <p className="text-lg font-black text-gray-900 dark:text-white truncate tracking-tight">
                                {mostCostly.emoji} {mostCostly.name}
                            </p>
                            <p className="text-sm text-red-500 font-black mt-1 tracking-tight">
                                -${Math.abs(costlyStat?.totalPnL || 0).toFixed(2)}
                            </p>
                        </>
                    ) : (<p className="text-sm font-medium text-gray-400">None</p>)}
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-5 h-full">
                {/* Charts */}
                <div className="bg-white dark:bg-[#1E2028] p-6 md:p-8 rounded-xl border border-gray-200 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Mistakes by Cost</h3>
                            <p className="text-sm text-gray-400 font-medium">Identify your most expensive errors.</p>
                        </div>
                        <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-primary/20">Top 5</span>
                    </div>
                    <MistakeCostChart data={data.mistakeStats} />
                </div>

                <div className="bg-white dark:bg-[#1E2028] p-6 md:p-8 rounded-xl border border-gray-200 dark:border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h3 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">Mistake Frequency</h3>
                            <p className="text-sm text-gray-400 font-medium">Track how often these issues occur.</p>
                        </div>
                    </div>
                    <MistakeFrequencyChart data={data.mistakesByCategory} />
                </div>
            </div>
        </div>
    );
}
