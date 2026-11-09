import { Activity, Trophy, Layers, Target, Scale, Receipt, Repeat } from "lucide-react";
import { formatDashboardCurrency } from "@/lib/utils/cent-account";

interface StatsProps {
    stats: {
        totalPnL: number;
        winRate: number;
        totalTrades: number;
        winCount: number;
        lossCount: number;
        totalLots?: number;
        totalCommission?: number;
        totalSwap?: number;
    };
    currency?: string;
}

export default function JournalStats({ stats, currency = "USD" }: StatsProps) {
    const cards = [
        {
            title: "Total Trades",
            value: stats.totalTrades,
            icon: Layers,
            color: "text-amber-600 dark:text-gold",
            bg: "bg-gold/10",
            desc: "Completed setups",
        },
        {
            title: "Win Rate",
            value: `${stats.winRate.toFixed(1)}%`,
            icon: Trophy,
            color: "text-amber-600 dark:text-gold",
            bg: "bg-gold/10",
            desc: "Winning percentage",
        },
        {
            title: "Net Profit",
            value: formatDashboardCurrency(stats.totalPnL, currency, {
                signDisplay: "always",
            }),
            icon: Activity,
            color: stats.totalPnL >= 0 ? "text-primary" : "text-red-500",
            bg:
                stats.totalPnL >= 0
                    ? "bg-primary/10"
                    : "bg-red-50 dark:bg-red-500/10",
            desc: "Realized P&L",
        },
        {
            title: "Total Commission",
            value: formatDashboardCurrency(stats.totalCommission || 0, currency),
            icon: Receipt,
            color:
                (stats.totalCommission || 0) < 0
                    ? "text-rose-500 dark:text-rose-400"
                    : "text-gray-700 dark:text-gray-300",
            bg:
                (stats.totalCommission || 0) < 0
                    ? "bg-rose-50 dark:bg-rose-500/10"
                    : "bg-gray-100 dark:bg-white/5",
            desc: "Broker fees deducted",
        },
        {
            title: "Total Swap",
            value: formatDashboardCurrency(stats.totalSwap || 0, currency),
            icon: Repeat,
            color:
                (stats.totalSwap || 0) > 0
                    ? "text-primary"
                    : (stats.totalSwap || 0) < 0
                      ? "text-rose-500 dark:text-rose-400"
                      : "text-gray-700 dark:text-gray-300",
            bg:
                (stats.totalSwap || 0) > 0
                    ? "bg-primary/10"
                    : (stats.totalSwap || 0) < 0
                      ? "bg-rose-50 dark:bg-rose-500/10"
                      : "bg-gray-100 dark:bg-white/5",
            desc: "Overnight rollover fees",
        },
        {
            title: "W/L Ratio",
            value: `${stats.winCount} / ${stats.lossCount}`,
            icon: Target,
            color: "text-amber-600 dark:text-gold",
            bg: "bg-gold/10",
            desc: "Wins vs Losses",
        },
        {
            title: "Total Lots",
            value: (stats.totalLots || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
            icon: Scale,
            color: "text-amber-600 dark:text-gold",
            bg: "bg-gold/10",
            desc: "Traded volume",
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3 sm:gap-4 mb-6">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <div
                        key={index}
                        className="rounded-xl border border-dashboard bg-white dark:bg-[#1E2028] p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-default"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-9 h-9 shrink-0 rounded-lg flex items-center justify-center ${card.bg} ${card.color}`}
                            >
                                <Icon size={16} aria-hidden="true" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p
                                    className={`text-lg sm:text-xl font-black font-mono tabular-nums leading-none truncate ${card.color}`}
                                >
                                    {card.value}
                                </p>
                                <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-1 uppercase tracking-wider truncate">
                                    {card.title}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
