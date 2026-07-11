import { LucideIcon } from "lucide-react";

export interface StatCardProps {
 title: string;
 value: string | number;
 change?: string;
 icon: LucideIcon;
 trend?: "up" | "down" | "neutral";
 color?: "blue" | "emerald" | "violet" | "amber" | "cyan" | "indigo" | "rose" | "green" | "yellow";
}

export function StatCard({ title, value, change, icon: Icon, trend, color = "blue" }: StatCardProps) {
 const colorStyles: Record<string, string> = {
 blue: "bg-blue-50/50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 ring-1 ring-blue-500/20",
 emerald: "bg-emerald-50/50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 ring-1 ring-emerald-500/20",
 violet: "bg-violet-50/50 text-violet-600 dark:bg-violet-500/10 dark:text-violet-400 ring-1 ring-violet-500/20",
 amber: "bg-amber-50/50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 ring-1 ring-amber-500/20",
 cyan: "bg-cyan-50/50 text-cyan-600 dark:bg-cyan-500/10 dark:text-cyan-400 ring-1 ring-cyan-500/20",
 indigo: "bg-indigo-50/50 text-indigo-600 dark:bg-indigo-500/10 dark:text-indigo-400 ring-1 ring-indigo-500/20",
 rose: "bg-rose-50/50 text-rose-600 dark:bg-rose-500/10 dark:text-rose-400 ring-1 ring-rose-500/20",
 green: "bg-green-50/50 text-green-600 dark:bg-green-500/10 dark:text-green-400 ring-1 ring-green-500/20",
 yellow: "bg-yellow-50/50 text-yellow-600 dark:bg-yellow-500/10 dark:text-yellow-400 ring-1 ring-yellow-500/20",
 };

 return (
 <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-4 shadow-sm hover:shadow-md transition-shadow cursor-default">
 <div className="flex items-center gap-3">
 <div className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${colorStyles[color] || colorStyles.blue}`}>
 <Icon size={16} aria-hidden="true" />
 </div>
 <div>
 <div className="flex items-center gap-2">
 <p className="text-xl font-black text-gray-800 dark:text-white tabular-nums leading-none">
 {value}
 </p>
 {change && (
 <span 
 className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md ${
 trend === "up" 
 ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400" 
 : trend === "down" 
 ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400" 
 : "bg-gray-50 text-gray-600 dark:bg-gray-500/10 dark:text-gray-400"
 }`}
 aria-label={`Trend is ${trend}`}
 >
 {change}
 </span>
 )}
 </div>
 <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-1 uppercase tracking-wider">{title}</p>
 </div>
 </div>
 </div>
 );
}
