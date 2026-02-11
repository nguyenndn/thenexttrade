"use client";

import {
    Target,
    Scale,
    DollarSign,
    Percent,
    Activity,
    TrendingUp,
    TrendingDown
} from "lucide-react";

interface KPICardsProps {
    summary: {
        totalTrades: number;
        winRate: number;
        profitFactor: number;
        totalPnL: number;
        avgRRR: number;
        currentStreak: {
            type: 'win' | 'loss';
            count: number;
        };
    };
}

export function KPICards({ summary }: KPICardsProps) {
    if (!summary) return null;

    const cards = [
        {
            title: "Win Rate",
            value: `${(summary.winRate || 0).toFixed(1)}%`,
            icon: Target,
            color: "text-purple-500",
            bg: "bg-purple-50 dark:bg-purple-500/10",
            description: (summary.winRate || 0) >= 50 ? "Above average" : "Below average",
        },
        {
            title: "Profit Factor",
            value: summary.profitFactor === Infinity
                ? "∞"
                : (summary.profitFactor || 0).toFixed(2),
            icon: Scale,
            color: "text-blue-500",
            bg: "bg-blue-50 dark:bg-blue-500/10",
            description: (summary.profitFactor || 0) >= 1.5 ? "Healthy" : "Needs improvement",
        },
        {
            title: "Total P&L",
            value: `$${Math.abs(summary.totalPnL || 0).toLocaleString()}`,
            icon: (summary.totalPnL || 0) >= 0 ? TrendingUp : TrendingDown,
            color: (summary.totalPnL || 0) >= 0 ? "text-green-500" : "text-red-500",
            bg: (summary.totalPnL || 0) >= 0
                ? "bg-green-50 dark:bg-green-500/10"
                : "bg-red-50 dark:bg-red-500/10",
            prefix: (summary.totalPnL || 0) >= 0 ? "+" : "-",
        },
        {
            title: "Avg R:R",
            value: `1:${(summary.avgRRR || 0).toFixed(1)}`,
            icon: Percent,
            color: "text-yellow-500",
            bg: "bg-yellow-50 dark:bg-yellow-500/10",
            description: (summary.avgRRR || 0) >= 2 ? "Excellent" : "Review exits",
        },
        {
            title: "Total Trades",
            value: summary.totalTrades.toString(),
            icon: Activity,
            color: "text-gray-500",
            bg: "bg-gray-50 dark:bg-gray-500/10",
            description: `${summary.currentStreak.count} ${summary.currentStreak.type} streak`,
        },
    ];

    return (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <div
                        key={index}
                        className="bg-white dark:bg-[#1E2028] p-5 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow"
                    >
                        <div className="flex items-center gap-3 mb-3">
                            <div className={`p-2.5 rounded-xl ${card.bg}`}>
                                <Icon size={18} className={card.color} />
                            </div>
                        </div>
                        <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 mb-1">
                            {card.title}
                        </h3>
                        <p className={`text-2xl font-black ${card.color.includes('green') || card.color.includes('red') ? card.color : 'text-gray-900 dark:text-white'}`}>
                            {card.prefix && card.prefix}
                            {card.value}
                        </p>
                        {card.description && (
                            <p className="text-xs text-gray-400 mt-1">{card.description}</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
