import {
    TrendingUp,
    TrendingDown,
    Percent,
    Target,
    Activity,
    DollarSign,
} from "lucide-react";
import { formatDashboardCurrency } from "@/lib/utils/cent-account";

interface StatsProps {
    stats: {
        netProfit: number;
        winRate: number;
        profitFactor: number;
        totalTrades: number;
        avgWin: number;
        avgLoss: number;
        bestPair: string;
        worstPair: string;
    };
    currency?: string;
}

export function StatsOverview({ stats, currency = "USD" }: StatsProps) {
    const cards = [
        {
            title: "Net Profit",
            value: formatDashboardCurrency(stats.netProfit, currency),
            icon: DollarSign,
            color: stats.netProfit >= 0 ? "text-primary" : "text-red-500",
            bg: stats.netProfit >= 0 ? "bg-primary/10" : "bg-red-500/10",
        },
        {
            title: "Win Rate",
            value: `${stats.winRate.toFixed(1)}%`,
            icon: Percent,
            color: stats.winRate >= 50 ? "text-emerald-500" : "text-amber-500",
            bg: stats.winRate >= 50 ? "bg-emerald-500/10" : "bg-amber-500/10",
        },
        {
            title: "Profit Factor",
            value: stats.profitFactor.toFixed(2),
            icon: Activity,
            color:
                stats.profitFactor >= 1.5
                    ? "text-amber-600 dark:text-gold"
                    : "text-gray-600",
            bg:
                stats.profitFactor >= 1.5
                    ? "bg-gold/10"
                    : "bg-gray-500/10",
        },
        {
            title: "Total Trades",
            value: stats.totalTrades,
            icon: Target,
            color: "text-gray-700",
            bg: "bg-gray-100 dark:text-white dark:bg-white/10",
        },
    ];

    return (
        <>
            {/* Mobile Unified 2x2 Matrix (< sm) */}
            <div className="sm:hidden grid grid-cols-2 rounded-xl border border-dashboard bg-white dark:bg-[#1E2028] shadow-sm overflow-hidden [&>*:nth-child(even)]:border-l [&>*:nth-child(n+3)]:border-t [&>*]:border-dashboard/70 dark:[&>*]:border-white/[0.06]">
                {cards.map((card, idx) => {
                    const Icon = card.icon;
                    const valueColor = card.color.includes("text")
                        ? card.title === "Total Trades"
                            ? "text-gray-700 dark:text-white"
                            : card.color
                        : "text-gray-700 dark:text-white";
                    return (
                        <div
                            key={idx}
                            className="py-2 px-2.5 min-w-0 flex items-center justify-between gap-2"
                        >
                            <div className="min-w-0">
                                <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400 truncate mb-0.5">
                                    {card.title}
                                </p>
                                <h3
                                    className={`text-sm font-black font-mono tabular-nums truncate ${valueColor}`}
                                >
                                    {card.value}
                                </h3>
                            </div>
                            <div
                                className={`w-8 h-8 rounded-lg shrink-0 flex items-center justify-center ${card.bg} ${card.color}`}
                            >
                                <Icon size={15} />
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Desktop Grid (>= sm) */}
            <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-4 sm:gap-4 md:gap-6">
                {cards.map((card, idx) => {
                    const Icon = card.icon;
                    return (
                        <div
                            key={idx}
                            className="bg-white dark:bg-[#1E2028] p-3.5 sm:p-5 rounded-xl border border-dashboard shadow-sm hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between gap-2">
                                <div className="min-w-0">
                                    <p className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-300 mb-1">
                                        {card.title}
                                    </p>
                                    <h3
                                        className={`text-lg sm:text-2xl font-black font-mono tabular-nums truncate ${card.color.includes("text") ? (card.title === "Total Trades" ? "text-gray-700 dark:text-white" : card.color) : "text-gray-700 dark:text-white"}`}
                                    >
                                        {card.value}
                                    </h3>
                                </div>
                                <div
                                    className={`p-2 sm:p-3 rounded-lg shrink-0 ${card.bg} ${card.color}`}
                                >
                                    <Icon size={18} />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </>
    );
}

export function DetailedStats({ stats, currency = "USD" }: StatsProps) {
    return (
        <>
            {/* Mobile Unified 2x2 Matrix (< sm) */}
            <div className="sm:hidden grid grid-cols-2 rounded-xl border border-dashboard bg-white dark:bg-[#1E2028] shadow-sm overflow-hidden [&>*:nth-child(even)]:border-l [&>*:nth-child(n+3)]:border-t [&>*]:border-dashboard/70 dark:[&>*]:border-white/[0.06]">
                <div className="py-2 px-2.5 min-w-0 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-0.5 truncate">
                            Avg Win
                        </p>
                        <p className="text-sm font-black font-mono tabular-nums text-primary truncate">
                            {formatDashboardCurrency(stats.avgWin, currency, {
                                signDisplay: "always",
                            })}
                        </p>
                    </div>
                    <div className="w-8 h-8 bg-primary/10 text-primary rounded-lg shrink-0 flex items-center justify-center">
                        <TrendingUp size={15} />
                    </div>
                </div>

                <div className="py-2 px-2.5 min-w-0 flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-0.5 truncate">
                            Avg Loss
                        </p>
                        <p className="text-sm font-black font-mono tabular-nums text-red-500 truncate">
                            {formatDashboardCurrency(
                                -Math.abs(stats.avgLoss),
                                currency
                            )}
                        </p>
                    </div>
                    <div className="w-8 h-8 bg-red-500/10 text-red-500 rounded-lg shrink-0 flex items-center justify-center">
                        <TrendingDown size={15} />
                    </div>
                </div>

                <div className="py-2 px-2.5 min-w-0">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-0.5 truncate">
                        Best Pair
                    </p>
                    <p className="text-sm font-black font-mono tabular-nums text-gray-700 dark:text-white truncate">
                        {stats.bestPair}
                    </p>
                </div>

                <div className="py-2 px-2.5 min-w-0">
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider mb-0.5 truncate">
                        Worst Pair
                    </p>
                    <p className="text-sm font-black font-mono tabular-nums text-gray-700 dark:text-white truncate">
                        {stats.worstPair}
                    </p>
                </div>
            </div>

            {/* Desktop Grid (>= sm) */}
            <div className="hidden sm:grid sm:grid-cols-1 md:grid-cols-2 sm:gap-4">
                <div className="bg-white dark:bg-[#1E2028] p-3.5 sm:p-5 rounded-xl border border-dashboard flex justify-between items-center group">
                    <div>
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">
                            Avg Win
                        </p>
                        <p className="text-lg sm:text-xl font-bold font-mono tabular-nums text-primary">
                            {formatDashboardCurrency(stats.avgWin, currency, {
                                signDisplay: "always",
                            })}
                        </p>
                    </div>
                    <div className="p-2 bg-primary/10 text-primary rounded-lg">
                        <TrendingUp size={18} />
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1E2028] p-3.5 sm:p-5 rounded-xl border border-dashboard flex justify-between items-center group">
                    <div>
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">
                            Avg Loss
                        </p>
                        <p className="text-lg sm:text-xl font-bold font-mono tabular-nums text-red-500">
                            {formatDashboardCurrency(
                                -Math.abs(stats.avgLoss),
                                currency
                            )}
                        </p>
                    </div>
                    <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
                        <TrendingDown size={18} />
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1E2028] p-3.5 sm:p-5 rounded-xl border border-dashboard flex justify-between items-center">
                    <div>
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">
                            Best Pair
                        </p>
                        <p className="text-lg sm:text-xl font-bold text-gray-700 dark:text-white">
                            {stats.bestPair}
                        </p>
                    </div>
                </div>

                <div className="bg-white dark:bg-[#1E2028] p-3.5 sm:p-5 rounded-xl border border-dashboard flex justify-between items-center">
                    <div>
                        <p className="text-sm text-gray-500 font-bold uppercase tracking-wider mb-1">
                            Worst Pair
                        </p>
                        <p className="text-lg sm:text-xl font-bold text-gray-700 dark:text-white">
                            {stats.worstPair}
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}
