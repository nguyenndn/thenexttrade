import { Activity, Trophy, Layers, Target } from "lucide-react";

interface StatsProps {
    stats: {
        totalPnL: number;
        winRate: number;
        totalTrades: number;
        winCount: number;
        lossCount: number;
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
            desc: "Completed setups"
        },
        {
            title: "Win Rate",
            value: `${stats.winRate.toFixed(1)}%`,
            icon: Trophy,
            color: "text-amber-500",
            bg: "bg-amber-50 dark:bg-amber-500/10",
            border: "border-t-amber-500",
            desc: "Winning percentage"
        },
        {
            title: "Net Profit",
            value: new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', signDisplay: 'always' }).format(stats.totalPnL),
            icon: Activity,
            color: stats.totalPnL >= 0 ? "text-primary" : "text-red-500",
            bg: stats.totalPnL >= 0 ? "bg-primary/10" : "bg-red-50 dark:bg-red-500/10",
            border: stats.totalPnL >= 0 ? "border-t-primary" : "border-t-red-500",
            desc: "Realized P&L"
        },
        {
            title: "W/L Ratio",
            value: `${stats.winCount} / ${stats.lossCount}`,
            icon: Target,
            color: "text-purple-500",
            bg: "bg-purple-50 dark:bg-purple-500/10",
            border: "border-t-purple-500",
            desc: "Wins vs Losses"
        }
    ];

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <div key={index} className={`bg-white dark:bg-[#1E2028] p-5 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-all duration-200 hover:-translate-y-0.5 border-t-4 ${card.border}`}>
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-3 rounded-xl ${card.bg}`}>
                                <Icon size={20} className={card.color} />
                            </div>
                            <h3 className="text-gray-500 text-xs font-bold uppercase tracking-wider">{card.title}</h3>
                        </div>
                        <p className={`text-2xl font-black ${card.color}`}>{card.value}</p>
                        <p className="text-xs text-gray-400 font-medium mt-1">{card.desc}</p>
                    </div>
                );
            })}
        </div>
    );
}
