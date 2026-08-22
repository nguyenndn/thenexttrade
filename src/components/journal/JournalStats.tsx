import { Activity, Trophy, Layers, Target, Scale } from "lucide-react";

interface StatsProps {
    stats: {
        totalPnL: number;
        winRate: number;
        totalTrades: number;
        winCount: number;
        lossCount: number;
        totalLots?: number;
    };
}

export default function JournalStats({ stats }: StatsProps) {
    const cards = [
        {
            title: "Total Trades",
            value: stats.totalTrades,
            icon: Layers,
            color: "text-blue-500",
            bg: "bg-blue-50 dark:bg-blue-500/10",
            border: "border-t-blue-500",
            desc: "Completed setups",
        },
        {
            title: "Win Rate",
            value: `${stats.winRate.toFixed(1)}%`,
            icon: Trophy,
            color: "text-amber-500",
            bg: "bg-amber-50 dark:bg-amber-500/10",
            border: "border-t-amber-500",
            desc: "Winning percentage",
        },
        {
            title: "Net Profit",
            value: new Intl.NumberFormat("en-US", {
                style: "currency",
                currency: "USD",
                signDisplay: "always",
            }).format(stats.totalPnL),
            icon: Activity,
            color: stats.totalPnL >= 0 ? "text-primary" : "text-red-500",
            bg:
                stats.totalPnL >= 0
                    ? "bg-primary/10"
                    : "bg-red-50 dark:bg-red-500/10",
            border:
                stats.totalPnL >= 0 ? "border-t-primary" : "border-t-red-500",
            desc: "Realized P&L",
        },
        {
            title: "W/L Ratio",
            value: `${stats.winCount} / ${stats.lossCount}`,
            icon: Target,
            color: "text-purple-500",
            bg: "bg-purple-50 dark:bg-purple-500/10",
            border: "border-t-purple-500",
            desc: "Wins vs Losses",
        },
        {
            title: "Total Lots",
            value: (stats.totalLots || 0).toLocaleString("en-US", {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
            }),
            icon: Scale,
            color: "text-sky-500",
            bg: "bg-sky-50 dark:bg-sky-500/10",
            border: "border-t-sky-500",
            desc: "Traded volume",
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 mb-6">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <div
                        key={index}
                        className="rounded-xl border border-dashboard bg-white dark:bg-[#151925] p-3.5 sm:p-4 shadow-sm hover:shadow-md transition-all duration-200 cursor-default"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center ${card.bg} ${card.color}`}
                            >
                                <Icon size={16} aria-hidden="true" />
                            </div>
                            <div className="min-w-0 flex-1">
                                <p
                                    className={`text-lg sm:text-xl font-black tabular-nums leading-none truncate ${card.color}`}
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
