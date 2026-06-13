"use client";

import { useState } from "react";
import { startOfMonth, endOfMonth } from "date-fns";
import { AlertTriangle, TrendingDown, CheckCircle, XCircle, DollarSign } from "lucide-react";

import { MistakeCostChart } from "./MistakeCostChart";
import { MistakeFrequencyChart } from "./MistakeFrequencyChart";
import { getMistakeByCode } from "@/lib/mistakes";
import { Loader2 } from "lucide-react";
import { EmptyStateCTAs } from "@/components/ui/EmptyStateCTAs";



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
 <div className="text-center py-16 bg-white dark:bg-[#1E2028] rounded-xl border-2 border-dashed border-dashboard mt-8">
 {/* Animated CheckCircle Icon */}
 <div className="relative w-20 h-20 mb-6 mx-auto">
 <div className="absolute inset-0 rounded-full bg-green-500/10 dark:bg-green-500/5 animate-[mistakes-ping_3s_cubic-bezier(0,0,0.2,1)_infinite]" />
 <div className="relative w-20 h-20 bg-gray-50 dark:bg-white/5 rounded-full flex items-center justify-center animate-[mistakes-float_3s_ease-in-out_infinite]">
 <CheckCircle size={32} className="text-green-500 dark:text-green-400" strokeWidth={1.5} />
 {/* Sparkle dots */}
 <div className="absolute -top-2 left-3 w-1.5 h-1.5 rounded-full bg-green-400/40 animate-[mistakes-sparkle_2.5s_ease-in-out_infinite_1.2s]" />
 <div className="absolute -bottom-1 -right-1 w-1 h-1 rounded-full bg-green-400/30 animate-[mistakes-sparkle_3s_ease-in-out_infinite_0.8s]" />
 <div className="absolute top-0 -right-2 w-1 h-1 rounded-full bg-green-400/25 animate-[mistakes-sparkle_2s_ease-in-out_infinite_1.5s]" />
 </div>
 </div>

 <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">No Mistakes Recorded</h3>
 <p className="text-gray-600 dark:text-gray-300 px-6 max-w-sm mx-auto mb-2">
 Great job! You haven't logged any mistakes for this period.
 Keep executing your plan with discipline.
 </p>

 <EmptyStateCTAs />

 <style jsx>{`
 @keyframes mistakes-float {
 0%, 100% { transform: translateY(0px); }
 50% { transform: translateY(-6px); }
 }
 @keyframes mistakes-ping {
 0% { transform: scale(1); opacity: 0.3; }
 75%, 100% { transform: scale(1.3); opacity: 0; }
 }
 @keyframes mistakes-sparkle {
 0%, 100% { opacity: 0; transform: scale(0); }
 50% { opacity: 1; transform: scale(1); }
 }
 `}</style>
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
 <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-dashboard shadow-sm hover:shadow-md transition-shadow group">
 <div className="flex items-center gap-3.5 mb-3">
 <div className="p-3 bg-red-500/10 text-red-500 dark:text-red-400 rounded-xl group-hover:bg-red-500 group-hover:text-white transition-colors duration-300 shadow-sm">
 <DollarSign size={22} strokeWidth={2.5} />
 </div>
 <p className="text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300">Cost of Mistakes</p>
 </div>
 <p className="text-3xl font-black text-red-500 tracking-tighter">
 ${Math.abs(data.costOfMistakes).toFixed(2)}
 </p>
 <p className="text-xs text-gray-500 font-medium mt-1.5 flex items-center gap-1.5">
 <span className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></span>
 Total loss from mistake trades
 </p>
 </div>

 {/* Win Rate Gap */}
 <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-dashboard shadow-sm hover:shadow-md transition-shadow group">
 <div className="flex items-center gap-3.5 mb-3">
 <div className="p-3 bg-blue-500/10 text-blue-500 dark:text-blue-400 rounded-xl group-hover:bg-blue-500 group-hover:text-white transition-colors duration-300 shadow-sm">
 <TrendingDown size={22} strokeWidth={2.5} />
 </div>
 <p className="text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300">Performance Gap</p>
 </div>
 <div className="flex items-end gap-2 mb-1">
 <p className="text-3xl font-black text-gray-700 dark:text-white tracking-tighter leading-none">
 {(data.cleanTradeWinRate - data.mistakeTradeWinRate).toFixed(1)}%
 </p>
 <span className="text-xs font-black text-gray-500 uppercase tracking-widest mb-1">diff</span>
 </div>
 <div className="flex items-center gap-2 mt-2 text-[11px] font-bold tracking-wide uppercase">
 <span className="text-primary">{data.cleanTradeWinRate.toFixed(0)}% clean</span>
 <span className="text-gray-300 dark:text-gray-600">vs</span>
 <span className="text-red-500">{data.mistakeTradeWinRate.toFixed(0)}% w/ mistakes</span>
 </div>
 </div>

 {/* Most Frequent */}
 <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-dashboard shadow-sm hover:shadow-md transition-shadow group">
 <div className="flex items-center gap-3.5 mb-4">
 <div className="p-3 bg-amber-500/10 text-amber-500 dark:text-amber-400 rounded-xl group-hover:bg-amber-500 group-hover:text-white transition-colors duration-300 shadow-sm">
 <AlertTriangle size={22} strokeWidth={2.5} />
 </div>
 <p className="text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300">Frequent Issue</p>
 </div>
 {mostFrequent ? (
 <>
 <p className="text-lg font-black text-gray-700 dark:text-white truncate tracking-tight">
 {mostFrequent.emoji} {mostFrequent.name}
 </p>
 <p className="text-xs text-gray-500 font-medium mt-1.5 flex items-center gap-1.5">
 <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
 Occurred {frequentStat?.count || 0} times
 </p>
 </>
 ) : (<p className="text-sm font-medium text-gray-500">None</p>)}
 </div>

 {/* Deadliest Mistake */}
 <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-dashboard shadow-sm hover:shadow-md transition-shadow group">
 <div className="flex items-center gap-3.5 mb-4">
 <div className="p-3 bg-purple-500/10 text-purple-500 dark:text-purple-400 rounded-xl group-hover:bg-purple-500 group-hover:text-white transition-colors duration-300 shadow-sm">
 <XCircle size={22} strokeWidth={2.5} />
 </div>
 <p className="text-[11px] font-black uppercase tracking-wider text-gray-600 dark:text-gray-300">Costliest Mistake</p>
 </div>
 {mostCostly ? (
 <>
 <p className="text-lg font-black text-gray-700 dark:text-white truncate tracking-tight">
 {mostCostly.emoji} {mostCostly.name}
 </p>
 <p className="text-sm text-red-500 font-black mt-1 tracking-tight">
 -${Math.abs(costlyStat?.totalPnL || 0).toFixed(2)}
 </p>
 </>
 ) : (<p className="text-sm font-medium text-gray-500">None</p>)}
 </div>
 </div>

 <div className="grid lg:grid-cols-2 gap-5 h-full">
 {/* Charts */}
 <div className="bg-white dark:bg-[#1E2028] p-6 md:p-8 rounded-xl border border-dashboard shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-md transition-shadow">
 <div className="flex items-center justify-between mb-8">
 <div>
 <h3 className="text-xl font-black text-gray-700 dark:text-white tracking-tight">Mistakes by Cost</h3>
 <p className="text-sm text-gray-500 font-medium">Identify your most expensive errors.</p>
 </div>
 <span className="text-[10px] font-black text-primary bg-primary/10 px-3 py-1.5 rounded-lg uppercase tracking-widest border border-primary/20">Top 5</span>
 </div>
 <MistakeCostChart data={data.mistakeStats} />
 </div>

 <div className="bg-white dark:bg-[#1E2028] p-6 md:p-8 rounded-xl border border-dashboard shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-md transition-shadow">
 <div className="flex items-center justify-between mb-8">
 <div>
 <h3 className="text-xl font-black text-gray-700 dark:text-white tracking-tight">Mistake Frequency</h3>
 <p className="text-sm text-gray-500 font-medium">Track how often these issues occur.</p>
 </div>
 </div>
 <MistakeFrequencyChart data={data.mistakesByCategory} />
 </div>
 </div>
 </div>
 );
}
