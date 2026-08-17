"use client";

import {
    Eye,
    Users,
    Activity,
    TrendingUp,
    ArrowUp,
    ArrowDown,
    Minus,
} from "lucide-react";

interface Props {
    summary: {
        pageviews: number;
        uniqueVisitors: number;
        realTimeVisitors: number;
        avgPagesPerVisitor: number;
        viewsTrend: number;
        visitorsTrend: number;
    };
    realTime: number;
}

function TrendBadge({ value }: { value: number | undefined }) {
    if (value === undefined || value === null) return null;
    const isUp = value > 0;
    const isDown = value < 0;
    const Icon = isUp ? ArrowUp : isDown ? ArrowDown : Minus;
    const color = isUp
        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
        : isDown
          ? "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
          : "bg-gray-50 text-gray-500 dark:bg-white/5 dark:text-gray-400";

    return (
        <span
            className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-lg text-[10px] font-bold ${color}`}
        >
            <Icon size={10} />
            {Math.abs(value)}%
        </span>
    );
}

export function AnalyticsSummary({ summary, realTime }: Props) {
    const cards = [
        {
            label: "Total Views",
            value: summary.pageviews,
            icon: Eye,
            gradient: "from-indigo-500 to-indigo-600",
            trend: summary.viewsTrend,
        },
        {
            label: "Unique Visitors",
            value: summary.uniqueVisitors,
            icon: Users,
            gradient: "from-cyan-500 to-blue-500",
            trend: summary.visitorsTrend,
        },
        {
            label: "Live Visitors",
            value: realTime,
            icon: Activity,
            gradient: "from-emerald-500 to-green-600",
            pulse: true,
        },
        {
            label: "Pages / Visit",
            value: summary.avgPagesPerVisitor,
            icon: TrendingUp,
            gradient: "from-amber-500 to-orange-500",
            decimal: true,
        },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card) => {
                const Icon = card.icon;
                return (
                    <div
                        key={card.label}
                        className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-4 shadow-sm hover:shadow-md transition-shadow cursor-default"
                    >
                        <div className="flex items-center gap-3">
                            <div
                                className={`w-9 h-9 shrink-0 rounded-xl flex items-center justify-center bg-gradient-to-br ${card.gradient}`}
                            >
                                <Icon
                                    size={16}
                                    aria-hidden="true"
                                    className={`text-white ${card.pulse ? "animate-pulse" : ""}`}
                                />
                            </div>
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="text-xl font-black text-gray-800 dark:text-white tabular-nums leading-none">
                                        {card.decimal
                                            ? card.value.toFixed(1)
                                            : card.value.toLocaleString()}
                                    </p>
                                    {"trend" in card &&
                                        card.trend !== undefined && (
                                            <TrendBadge value={card.trend} />
                                        )}
                                </div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 font-medium mt-1 uppercase tracking-wider">
                                    {card.label}
                                </p>
                            </div>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
