
import {
    TrendingUp,
    TrendingDown,
    Percent,
    Target,
    Activity,
    DollarSign
} from "lucide-react";

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
    }
}

export function StatsOverview({ stats }: StatsProps) {
    const cards = [
        {
            title: "Net Profit",
            value: stats.netProfit.toLocaleString("en-US", { style: "currency", currency: "USD" }),
            icon: DollarSign,
            color: stats.netProfit >= 0 ? "text-primary" : "text-red-500",
            bg: stats.netProfit >= 0 ? "bg-primary/10" : "bg-red-500/10"
        },
        {
            title: "Win Rate",
            value: `${stats.winRate.toFixed(1)}%`,
            icon: Percent,
            color: stats.winRate >= 50 ? "text-blue-500" : "text-yellow-500",
            bg: stats.winRate >= 50 ? "bg-blue-500/10" : "bg-yellow-500/10"
        },
        {
            title: "Profit Factor",
            value: stats.profitFactor.toFixed(2),
            icon: Activity,
            color: stats.profitFactor >= 1.5 ? "text-purple-500" : "text-gray-500",
            bg: stats.profitFactor >= 1.5 ? "bg-purple-500/10" : "bg-gray-500/10"
        },
        {
            title: "Total Trades",
            value: stats.totalTrades,
            icon: Target,
            color: "text-gray-900",
            bg: "bg-gray-100 dark:text-white dark:bg-white/10"
        }
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {cards.map((card, idx) => {
                const Icon = card.icon;
                return (
                    <div key={idx} className="bg-white dark:bg-[#1E2028] p-5 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">{card.title}</p>
                                <h3 className={`text-2xl font-black ${card.color.includes('text') ? card.title === 'Total Trades' ? 'text-gray-900 dark:text-white' : card.color : 'text-gray-900 dark:text-white'}`}>
                                    {card.value}
                                </h3>
                            </div>
                            <div className={`p-3 rounded-xl ${card.bg} ${card.color}`}>
                                <Icon size={20} />
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export function DetailedStats({ stats }: StatsProps) {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#1E2028] p-5 rounded-xl border border-gray-100 dark:border-white/5 flex justify-between items-center group">
                <div>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Avg Win</p>
                    <p className="text-xl font-bold text-primary group-hover:scale-105 transition-transform">
                        +${stats.avgWin.toFixed(2)}
                    </p>
                </div>
                <div className="p-2 bg-primary/10 text-primary rounded-lg">
                    <TrendingUp size={18} />
                </div>
            </div>

            <div className="bg-white dark:bg-[#1E2028] p-5 rounded-xl border border-gray-100 dark:border-white/5 flex justify-between items-center group">
                <div>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Avg Loss</p>
                    <p className="text-xl font-bold text-red-500 group-hover:scale-105 transition-transform">
                        -${Math.abs(stats.avgLoss).toFixed(2)}
                    </p>
                </div>
                <div className="p-2 bg-red-500/10 text-red-500 rounded-lg">
                    <TrendingDown size={18} />
                </div>
            </div>

            <div className="bg-white dark:bg-[#1E2028] p-5 rounded-xl border border-gray-100 dark:border-white/5 flex justify-between items-center">
                <div>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Best Pair</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {stats.bestPair}
                    </p>
                </div>
            </div>

            <div className="bg-white dark:bg-[#1E2028] p-5 rounded-xl border border-gray-100 dark:border-white/5 flex justify-between items-center">
                <div>
                    <p className="text-sm text-gray-400 font-bold uppercase tracking-wider mb-1">Worst Pair</p>
                    <p className="text-xl font-bold text-gray-900 dark:text-white">
                        {stats.worstPair}
                    </p>
                </div>
            </div>
        </div>
    )
}
