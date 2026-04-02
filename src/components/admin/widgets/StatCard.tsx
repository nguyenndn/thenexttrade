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

    const borderTopStyles: Record<string, string> = {
        blue: "border-t-blue-500",
        emerald: "border-t-emerald-500",
        violet: "border-t-violet-500",
        amber: "border-t-amber-500",
        cyan: "border-t-cyan-500",
        indigo: "border-t-indigo-500",
        rose: "border-t-rose-500",
        green: "border-t-green-500",
        yellow: "border-t-yellow-500",
    };

    return (
        <div className={`bg-white dark:bg-[#0B0E14] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow group border-t-4 ${borderTopStyles[color] || borderTopStyles.blue}`}>
            <div className="flex justify-between items-start">
                <div>
                    <p className="text-sm font-bold text-gray-600 dark:text-gray-300 uppercase tracking-wider">{title}</p>
                    <h3 className="text-3xl font-black mt-2 text-gray-700 dark:text-white tracking-tight">{value}</h3>
                </div>
                <div className={`p-3.5 rounded-xl ${colorStyles[color] || colorStyles.blue} transition-colors`}>
                    <Icon size={24} strokeWidth={2.5} aria-hidden="true" />
                </div>
            </div>
            {change && (
                <div className="mt-4 flex items-center text-sm font-medium">
                    <span 
                        className={`px-2 py-0.5 rounded-lg ${
                            trend === "up" 
                                ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" 
                                : trend === "down" 
                                    ? "bg-red-50 text-red-600 dark:bg-red-500/10" 
                                    : "bg-gray-50 text-gray-600 dark:bg-gray-500/10"
                        }`}
                        aria-label={`Trend is ${trend}`}
                    >
                        {change}
                    </span>
                    <span className="text-gray-500 ml-2 text-xs uppercase tracking-wide">vs last month</span>
                </div>
            )}
        </div>
    );
}
