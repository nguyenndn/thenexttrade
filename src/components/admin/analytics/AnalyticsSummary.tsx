'use client';

import { Eye, Users, Activity, TrendingUp, ArrowUp, ArrowDown } from 'lucide-react';

interface Props {
    summary: {
        pageviews: number;
        uniqueVisitors: number;
        realTimeVisitors: number;
        avgPagesPerVisitor: number;
    };
    realTime: number;
}

export function AnalyticsSummary({ summary, realTime }: Props) {
    const cards = [
        { label: 'Total Views', value: summary.pageviews, icon: Eye, gradient: 'from-indigo-500 to-indigo-600' },
        { label: 'Unique Visitors', value: summary.uniqueVisitors, icon: Users, gradient: 'from-cyan-500 to-blue-500' },
        { label: 'Live Visitors', value: realTime, icon: Activity, gradient: 'from-emerald-500 to-green-600', pulse: true },
        { label: 'Pages / Visit', value: summary.avgPagesPerVisitor, icon: TrendingUp, gradient: 'from-amber-500 to-orange-500', decimal: true },
    ];

    return (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map(card => {
                const Icon = card.icon;
                return (
                    <div key={card.label}
                        className="group relative overflow-hidden bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-5 shadow-sm hover:shadow-md transition-shadow duration-300">
                        {/* Gradient accent line */}
                        <div className={`absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r ${card.gradient}`} />

                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                                {card.label}
                            </span>
                            <div className={`p-1.5 rounded-lg bg-gradient-to-br ${card.gradient} opacity-80`}>
                                <Icon className={`w-3.5 h-3.5 text-white ${card.pulse ? 'animate-pulse' : ''}`} />
                            </div>
                        </div>
                        <p className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
                            {card.decimal ? card.value.toFixed(1) : card.value.toLocaleString()}
                        </p>
                    </div>
                );
            })}
        </div>
    );
}
