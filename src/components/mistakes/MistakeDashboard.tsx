"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { toast } from "sonner";
import { AlertTriangle, TrendingDown, CheckCircle, XCircle, ArrowUp, ArrowDown, DollarSign } from "lucide-react";

import { MistakeCostChart } from "./MistakeCostChart";
import { MistakeFrequencyChart } from "./MistakeFrequencyChart";
import { getMistakeByCode } from "@/lib/mistakes";
import { Loader2 } from "lucide-react";

interface MistakeData {
    mistakeStats: Array<{
        code: string;
        name: string;
        category: string;
        severity: string;
        emoji: string;
        count: number;
        totalPnL: number;
        avgPnL: number;
        winRate: number;
    }>;
    totalMistakes: number;
    mostCostlyMistake: string | null;
    mostFrequentMistake: string | null;
    mistakesByCategory: Record<string, number>;
    tradesWithMistakes: number;
    tradesWithoutMistakes: number;
    cleanTradeWinRate: number;
    mistakeTradeWinRate: number;
    costOfMistakes: number;
}

export function MistakeDashboard() {
    const [data, setData] = useState<MistakeData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [dateRange, setDateRange] = useState({
        start: startOfMonth(new Date()),
        end: endOfMonth(new Date()),
    });

    const fetchData = async () => {
        try {
            setIsLoading(true);
            const params = new URLSearchParams({
                startDate: format(dateRange.start, "yyyy-MM-dd"),
                endDate: format(dateRange.end, "yyyy-MM-dd"),
            });

            const res = await fetch(`/api/analytics/mistakes?${params}`);
            if (!res.ok) throw new Error("Failed to fetch");

            const json = await res.json();
            setData(json);
        } catch (error) {
            toast.error("Failed to load mistake data");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [dateRange]);

    if (isLoading) {
        return (
            <div className="flex h-96 items-center justify-center">
                <Loader2 className="animate-spin text-[#00C888]" size={32} />
            </div>
        );
    }

    if (!data || data.tradesWithMistakes === 0) {
        return (
            <div className="flex flex-col items-center justify-center p-12 text-center bg-gray-50 dark:bg-white/5 rounded-3xl border-2 border-dashed border-gray-200 dark:border-white/10">
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

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Cost of Mistakes */}
                <div className="bg-white dark:bg-[#1E2028] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-red-100 dark:bg-red-500/10 text-red-500 rounded-lg">
                            <DollarSign size={20} />
                        </div>
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Cost of Mistakes</p>
                    </div>
                    <p className="text-2xl font-black text-red-500">
                        ${Math.abs(data.costOfMistakes).toFixed(2)}
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                        Total loss from mistake trades
                    </p>
                </div>

                {/* Win Rate Gap */}
                <div className="bg-white dark:bg-[#1E2028] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-500/10 text-blue-500 rounded-lg">
                            <TrendingDown size={20} />
                        </div>
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Performance Gap</p>
                    </div>
                    <div className="flex items-baseline gap-2">
                        <p className="text-2xl font-black text-gray-900 dark:text-white">
                            {(data.cleanTradeWinRate - data.mistakeTradeWinRate).toFixed(1)}%
                        </p>
                        <span className="text-xs font-bold text-gray-400">diff</span>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs">
                        <span className="text-green-500 font-bold">{data.cleanTradeWinRate.toFixed(0)}% clean</span>
                        <span className="text-gray-300">vs</span>
                        <span className="text-red-500 font-bold">{data.mistakeTradeWinRate.toFixed(0)}% w/ mistakes</span>
                    </div>
                </div>

                {/* Most Frequent */}
                <div className="bg-white dark:bg-[#1E2028] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-500/10 text-yellow-500 rounded-lg">
                            <AlertTriangle size={20} />
                        </div>
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Frequent Issue</p>
                    </div>
                    {mostFrequent ? (
                        <>
                            <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
                                {mostFrequent.emoji} {mostFrequent.name}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                                Occurred {data.mistakeStats.find(s => s.code === mostFrequent.code)?.count} times
                            </p>
                        </>
                    ) : (<p className="text-gray-400">None</p>)}
                </div>

                {/* Deadliest Mistake */}
                <div className="bg-white dark:bg-[#1E2028] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-500/10 text-purple-500 rounded-lg">
                            <XCircle size={20} />
                        </div>
                        <p className="text-sm font-bold text-gray-500 dark:text-gray-400">Costliest Mistake</p>
                    </div>
                    {mostCostly ? (
                        <>
                            <p className="text-lg font-bold text-gray-900 dark:text-white truncate">
                                {mostCostly.emoji} {mostCostly.name}
                            </p>
                            <p className="text-xs text-red-500 font-bold mt-1">
                                -${Math.abs(data.mistakeStats.find(s => s.code === mostCostly.code)?.totalPnL || 0).toFixed(2)}
                            </p>
                        </>
                    ) : (<p className="text-gray-400">None</p>)}
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 h-full">
                {/* Charts */}
                <div className="bg-white dark:bg-[#1E2028] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-lg">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
                        Mistakes by Cost
                        <span className="text-xs font-normal text-gray-400 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-full">Top 5</span>
                    </h3>
                    <MistakeCostChart data={data.mistakeStats} />
                </div>

                <div className="bg-white dark:bg-[#1E2028] p-6 rounded-3xl border border-gray-100 dark:border-white/5 shadow-lg">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-6">Mistake Frequency</h3>
                    <MistakeFrequencyChart data={data.mistakesByCategory} />
                </div>
            </div>
        </div>
    );
}
