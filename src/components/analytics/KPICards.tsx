"use client";

import {
    Target,
    Scale,
    Percent,
    Activity,
    TrendingUp,
    TrendingDown,
} from "lucide-react";
import { formatDashboardCurrency } from "@/lib/utils/cent-account";

interface KPICardsProps {
    summary: {
        totalTrades: number;
        winRate: number;
        profitFactor: number;
        totalPnL: number;
        avgRRR: number;
        currency?: string;
        currentStreak: {
            type: "win" | "loss";
            count: number;
        };
    };
    currency?: string;
}

export function KPICards({ summary, currency }: KPICardsProps) {
    if (!summary) return null;

    const resolvedCurrency = currency || summary.currency || "USD";

    const cards = [
        {
            title: "Win Rate",
            value: `${(summary.winRate || 0).toFixed(1)}%`,
            icon: Target,
            color:
                (summary.winRate || 0) >= 50
                    ? "text-emerald-500"
                    : "text-amber-500",
            bg:
                (summary.winRate || 0) >= 50
                    ? "bg-emerald-50 dark:bg-emerald-500/10"
                    : "bg-amber-50 dark:bg-amber-500/10",
            description:
                (summary.winRate || 0) >= 50
                    ? "Above average"
                    : "Below average",
        },
        {
            title: "Profit Factor",
            value:
                summary.profitFactor === Infinity
                    ? "MAX"
                    : (summary.profitFactor ?? 0).toFixed(2),
            icon: Scale,
            color: "text-amber-500",
            bg: "bg-amber-50 dark:bg-amber-500/10",
            description:
                (summary.profitFactor || 0) >= 1.5
                    ? "Healthy"
                    : "Needs improvement",
        },
        {
            title: "Total P&L",
            value: formatDashboardCurrency(
                summary.totalPnL || 0,
                resolvedCurrency,
                { signDisplay: "always" }
            ),
            icon: (summary.totalPnL || 0) >= 0 ? TrendingUp : TrendingDown,
            color:
                (summary.totalPnL || 0) >= 0
                    ? "text-emerald-500"
                    : "text-red-500",
            bg:
                (summary.totalPnL || 0) >= 0
                    ? "bg-emerald-50 dark:bg-emerald-500/10"
                    : "bg-red-50 dark:bg-red-500/10",
        },
        {
            title: "Avg R:R",
            value: `1:${(summary.avgRRR || 0).toFixed(1)}`,
            icon: Percent,
            color: "text-amber-500",
            bg: "bg-amber-50 dark:bg-amber-500/10",
            description:
                (summary.avgRRR || 0) >= 2 ? "Excellent" : "Review exits",
        },
        {
            title: "Total Trades",
            value: summary.totalTrades.toString(),
            icon: Activity,
            color: "text-gray-600",
            bg: "bg-gray-50 dark:bg-gray-500/10",
            description: `${summary.currentStreak.count} ${summary.currentStreak.type} streak`,
        },
    ];

    return (
        <>
            {/* Mobile Unified 2x2 Matrix (< sm) */}
            <div className="sm:hidden grid grid-cols-2 rounded-xl border border-dashboard bg-white dark:bg-[#1E2028] shadow-sm overflow-hidden [&>*:nth-child(even)]:border-l [&>*:nth-child(n+3)]:border-t [&>*]:border-dashboard/70 dark:[&>*]:border-white/[0.06]">
                {cards.map((card, index) => {
                    const Icon = card.icon;
                    let colorClass = "text-gray-700 dark:text-white";
                    if (
                        card.title === "Total P&L" &&
                        card.color.includes("emerald")
                    ) {
                        colorClass = "text-[#00C888]";
                    } else if (card.color.includes("red")) {
                        colorClass = "text-red-500";
                    }
                    const isFullSpan = index === cards.length - 1 && cards.length % 2 === 1;

                    return (
                        <div
                            key={index}
                            className={`py-2 px-2.5 min-w-0 flex items-center gap-2 ${isFullSpan ? "col-span-2 justify-between" : ""}`}
                        >
                            <div className="flex items-center gap-2 min-w-0">
                                <div
                                    className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${card.bg}`}
                                >
                                    <Icon
                                        size={15}
                                        className={card.color}
                                        strokeWidth={2.25}
                                    />
                                </div>
                                <div className="min-w-0">
                                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate">
                                        {card.title}
                                    </p>
                                    <p
                                        className={`text-sm font-black font-mono tabular-nums tracking-tight ${colorClass} truncate`}
                                    >
                                        {card.value}
                                    </p>
                                </div>
                            </div>
                            {isFullSpan && card.description && (
                                <span className="text-[11px] text-gray-500 font-medium flex items-center gap-1.5 shrink-0">
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${card.color.replace("text-", "bg-")}`}
                                    />
                                    {card.description}
                                </span>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Desktop Grid (>= sm) */}
            <div className="hidden sm:grid sm:grid-cols-3 lg:grid-cols-5 sm:gap-5">
                {cards.map((card, index) => {
                    const Icon = card.icon;

                    // Set text color properly aligned with Journal style - clean and strong
                    let colorClass = "text-gray-700 dark:text-white";
                    if (
                        card.title === "Total P&L" &&
                        card.color.includes("emerald")
                    )
                        colorClass = "text-[#00C888]";
                    else if (card.color.includes("red"))
                        colorClass = "text-red-500";

                    return (
                        <div
                            key={index}
                            className={`bg-white dark:bg-[#1E2028] p-3.5 sm:p-6 rounded-xl border border-dashboard shadow-sm hover:shadow-md transition-shadow duration-200 group border-t-4 ${card.color.replace("text-", "border-t-")}`}
                        >
                            <div className="flex items-center gap-3 mb-3 sm:mb-4">
                                <div
                                    className={`p-2 sm:p-3 rounded-lg ${card.bg} text-opacity-80 group-hover:bg-opacity-100 transition-colors shadow-sm relative z-10`}
                                >
                                    <Icon
                                        size={20}
                                        className={card.color}
                                        strokeWidth={2.5}
                                    />
                                </div>
                            </div>
                            <h3 className="text-[11px] font-bold uppercase tracking-widest text-gray-600 dark:text-gray-300 mb-1 sm:mb-1.5 relative z-10">
                                {card.title}
                            </h3>
                            <p
                                className={`text-lg sm:text-2xl font-bold font-mono tabular-nums tracking-tight ${colorClass} relative z-10 truncate`}
                            >
                                {card.value}
                            </p>
                            {card.description && (
                                <p className="text-xs text-gray-500 font-medium mt-1.5 flex items-center gap-1.5 relative z-10">
                                    <span
                                        className={`w-1.5 h-1.5 rounded-full shrink-0 ${card.color.replace("text-", "bg-")}`}
                                    ></span>
                                    {card.description}
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>
        </>
    );
}
