'use client';

import { Filter } from 'lucide-react';

interface Props {
    funnel?: {
        visitors: number;
        interested: number;
        signedUp: number;
        activated: number;
    };
}

const STAGES = [
    { key: 'visitors', label: 'All Visitors', desc: 'Total unique sessions', color: '#6366f1' },
    { key: 'interested', label: 'Interested', desc: 'Clicked CTA / Download', color: '#22d3ee' },
    { key: 'signedUp', label: 'Signed Up', desc: 'Completed registration', color: '#10b981' },
    { key: 'activated', label: 'Activated', desc: 'First trade sync', color: '#f59e0b' },
] as const;

export function FunnelPanel({ funnel }: Props) {
    const hasData = funnel && funnel.visitors > 0;

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 p-6">
            <div className="flex items-center gap-2 mb-6">
                <Filter className="w-4 h-4 text-indigo-500" />
                <h2 className="text-base font-semibold text-gray-900 dark:text-white">Conversion Funnel</h2>
            </div>

            {hasData ? (
                <div className="flex flex-col items-center gap-2">
                    {STAGES.map((stage, i) => {
                        const value = funnel[stage.key as keyof typeof funnel];
                        const pct = Math.round((value / funnel.visitors) * 100);
                        // Funnel shape: progressively narrower bars
                        const widthPct = 100 - (i * 15);
                        const dropRate = i > 0
                            ? Math.round(((funnel[STAGES[i - 1].key as keyof typeof funnel] - value) / funnel[STAGES[i - 1].key as keyof typeof funnel]) * 100)
                            : 0;

                        return (
                            <div key={stage.key} className="w-full" style={{ maxWidth: `${widthPct}%` }}>
                                {/* Drop-off indicator */}
                                {i > 0 && dropRate > 0 && (
                                    <div className="text-center mb-1">
                                        <span className="text-[10px] text-red-400 font-medium">↓ {dropRate}% drop-off</span>
                                    </div>
                                )}
                                <div className="rounded-xl p-4 text-center transition-all hover:scale-[1.01]"
                                    style={{ backgroundColor: `${stage.color}15`, borderLeft: `3px solid ${stage.color}` }}>
                                    <div className="flex items-center justify-between">
                                        <div className="text-left">
                                            <p className="text-sm font-semibold text-gray-900 dark:text-white">{stage.label}</p>
                                            <p className="text-[11px] text-gray-500 dark:text-gray-400">{stage.desc}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-xl font-bold" style={{ color: stage.color }}>{value.toLocaleString()}</p>
                                            <p className="text-[11px] text-gray-400">{pct}%</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="text-center py-12">
                    <Filter className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-sm text-gray-400">No funnel data yet. Start tracking events to see conversion rates.</p>
                </div>
            )}
        </div>
    );
}
