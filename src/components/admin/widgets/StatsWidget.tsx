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

export function StatsWidget({
    title,
    value,
    icon: Icon,
    trend,
    color = "blue",
}: StatsWidgetProps) {
    const colorStyles = {
        blue: "text-blue-500 bg-blue-50 dark:bg-blue-500/10",
        green: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10",
        purple: "text-purple-500 bg-purple-50 dark:bg-purple-500/10",
        orange: "text-orange-500 bg-orange-50 dark:bg-orange-500/10",
    };

    return (
        <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-4 shadow-sm hover:shadow-md transition-shadow cursor-default">
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        "w-9 h-9 shrink-0 rounded-xl flex items-center justify-center",
                        colorStyles[color]
                    )}
                >
                    <Icon size={16} aria-hidden="true" />
                </div>
                <div>
                    <div className="flex items-center gap-2">
                        <p className="text-xl font-black text-gray-800 dark:text-white tabular-nums leading-none">
                            {value}
                        </p>
                        {trend && (
                            <span
                                className={cn(
                                    "text-[10px] font-bold px-1.5 py-0.5 rounded-md",
                                    trend.isPositive
                                        ? "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400"
                                        : "text-red-600 bg-red-50 dark:bg-red-500/10 dark:text-red-400"
                                )}
                            >
                                {trend.isPositive ? "+" : ""}
                                {trend.value}%
                            </span>
                        )}
                    </div>
                    <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-1 uppercase tracking-wider">
                        {title}
                    </p>
                </div>
            </div>
        </div>
    );
}
