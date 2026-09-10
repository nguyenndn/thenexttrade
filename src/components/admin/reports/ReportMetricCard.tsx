import Link from "next/link";
import { TrendingUp, TrendingDown, Minus, Activity } from "lucide-react";
import { cn } from "@/lib/utils";

interface ReportMetricCardProps {
    label: string;
    value: string | number;
    helper?: string;
    trendPercent?: number | null;
    tone?: "default" | "good" | "warning" | "danger" | "purple" | "cyan" | "emerald" | "amber";
    icon?: React.ElementType;
    gradient?: string;
    href?: string;
}

const toneGradients: Record<string, string> = {
    default: "from-indigo-500 to-blue-600",
    good: "from-emerald-500 to-teal-600",
    warning: "from-amber-500 to-orange-500",
    danger: "from-rose-500 to-red-600",
    purple: "from-indigo-500 to-purple-600",
    cyan: "from-cyan-500 to-blue-500",
    emerald: "from-emerald-500 to-teal-600",
    amber: "from-amber-500 to-orange-500",
};

export function ReportMetricCard({
    label,
    value,
    helper,
    trendPercent,
    tone = "default",
    icon: IconProp,
    gradient,
    href,
}: ReportMetricCardProps) {
    const Icon = IconProp || Activity;
    const bgGradient = gradient || toneGradients[tone] || toneGradients.default;

    const content = (
        <div
            className={cn(
                "rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-4 shadow-sm hover:shadow-md transition-shadow cursor-default",
                href && "hover:border-primary/40 cursor-pointer"
            )}
        >
            <div className="flex items-center gap-3">
                <div
                    className={cn(
                        "w-9 h-9 shrink-0 rounded-xl flex items-center justify-center bg-gradient-to-br text-white shadow-xs",
                        bgGradient
                    )}
                >
                    <Icon size={16} aria-hidden="true" />
                </div>

                <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                        <p className="text-xl font-black text-gray-900 dark:text-white tabular-nums leading-none truncate">
                            {typeof value === "number" ? value.toLocaleString() : value}
                        </p>

                        {trendPercent !== null && trendPercent !== undefined && (
                            <span
                                className={cn(
                                    "inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[10px] font-bold shrink-0",
                                    trendPercent > 0
                                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
                                        : trendPercent < 0
                                          ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                                          : "bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-gray-400"
                                )}
                            >
                                {trendPercent > 0 ? (
                                    <TrendingUp size={10} />
                                ) : trendPercent < 0 ? (
                                    <TrendingDown size={10} />
                                ) : (
                                    <Minus size={10} />
                                )}
                                {Math.abs(trendPercent)}%
                            </span>
                        )}
                    </div>

                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 truncate">
                        {label}
                    </p>

                    {helper && (
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                            {helper}
                        </p>
                    )}
                </div>
            </div>
        </div>
    );

    if (href) {
        return <Link href={href}>{content}</Link>;
    }

    return content;
}
