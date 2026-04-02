import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatsWidgetProps {
    title: string;
    value: string | number;
    icon: LucideIcon;
    trend?: {
        value: number;
        label: string;
        isPositive: boolean;
    };
    color?: "blue" | "green" | "purple" | "orange";
}

export function StatsWidget({ title, value, icon: Icon, trend, color = "blue" }: StatsWidgetProps) {
    const colorStyles = {
        blue: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
        green: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
        purple: "text-purple-500 bg-purple-50 dark:bg-purple-500/10",
        orange: "text-orange-500 bg-orange-50 dark:bg-orange-500/10",
    };

    return (
        <div className="bg-white dark:bg-[#0B0E14] border border-gray-100 dark:border-white/5 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-4">
                <div className={cn("p-3 rounded-xl", colorStyles[color])}>
                    <Icon className="w-6 h-6" />
                </div>
                {trend && (
                    <div className={cn(
                        "flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full",
                        trend.isPositive 
                            ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10" 
                            : "text-red-600 bg-red-50 dark:bg-red-500/10"
                    )}>
                        {trend.isPositive ? "+" : ""}{trend.value}%
                        <span className="opacity-70 hidden sm:inline">{trend.label}</span>
                    </div>
                )}
            </div>
            
            <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">{title}</p>
                <h3 className="text-2xl font-bold text-gray-700 dark:text-white">{value}</h3>
            </div>
        </div>
    );
}
