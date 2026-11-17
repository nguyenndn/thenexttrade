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
            mobileMatrixBorder:
                "border-l border-dashboard/70 dark:border-white/[0.06]",
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
            mobileMatrixBorder:
                "border-t border-dashboard/70 dark:border-white/[0.06]",
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
            hideOnMobile: true,
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
            hideOnMobile: true,
        },
        {
            title: "W/L Ratio",
            value: `${stats.winCount} / ${stats.lossCount}`,
            icon: Target,
            color: "text-amber-600 dark:text-gold",
            bg: "bg-gold/10",
            desc: "Wins vs Losses",
            mobileMatrixBorder:
                "border-l border-t border-dashboard/70 dark:border-white/[0.06]",
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
            hideOnMobile: true,
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-0 sm:gap-4 mb-0 md:mb-6 rounded-xl sm:rounded-none border border-dashboard sm:border-0 bg-white dark:bg-[#1E2028] sm:bg-transparent dark:sm:bg-transparent shadow-sm sm:shadow-none overflow-hidden sm:overflow-visible">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <div
                        key={index}
                        className={`${card.hideOnMobile ? "hidden sm:block " : ""}${card.mobileMatrixBorder ? `${card.mobileMatrixBorder} ` : ""}sm:rounded-xl sm:border sm:border-dashboard sm:dark:border-dashboard sm:bg-white sm:dark:bg-[#1E2028] py-2 px-2.5 sm:p-4 sm:shadow-sm sm:hover:shadow-md transition-all duration-200 cursor-default min-w-0`}
                    >
                        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                            <div
                                className={`w-8 h-8 sm:w-9 sm:h-9 shrink-0 rounded-lg flex items-center justify-center ${card.bg} ${card.color}`}
                            >
                                <Icon size={16} aria-hidden="true" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p
                                    className={`text-base sm:text-xl font-black font-mono tabular-nums leading-tight sm:leading-none truncate ${card.color}`}
                                >
                                    {card.value}
                                </p>
                                <p className="text-[10px] sm:text-[11px] text-gray-500 dark:text-gray-400 font-semibold sm:font-medium mt-0.5 sm:mt-1 uppercase tracking-wider truncate">
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
