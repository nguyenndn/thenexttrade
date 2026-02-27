"use client";

import { AlertTriangle } from "lucide-react";

interface TiltIndicatorsProps {
    data: {
        revengeTradeCount: number;
        fomoTradeCount: number;
        avgPnLAfterLoss: number;
        avgPnLAfterWin: number;
        currentLossStreak: number;
        maxLossStreak: number;
        sizingUpCount: number;
    };
}

export function TiltIndicators({ data }: TiltIndicatorsProps) {
    return (
        <div className="bg-white dark:bg-[#1E2028] p-5 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow cursor-pointer group flex flex-col h-full">
            <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <AlertTriangle size={18} className="text-orange-500" />
                Tilt Indicators
            </h3>

            <div className="space-y-6">
                {/* Behavioral Flags */}
                <div className="grid grid-cols-2 gap-4">
                    <IndicatorCard
                        label="Revenge Trades"
                        value={data.revengeTradeCount}
                        isGood={data.revengeTradeCount === 0}
                        subtext="Tagged manually"
                    />
                    <IndicatorCard
                        label="FOMO Trades"
                        value={data.fomoTradeCount}
                        isGood={data.fomoTradeCount === 0}
                        subtext="Tagged manually"
                    />
                    <IndicatorCard
                        label="Sizing Up > 50%"
                        value={data.sizingUpCount}
                        isGood={data.sizingUpCount === 0}
                        subtext="After loss (Martingale risk)"
                    />
                    <IndicatorCard
                        label="Max Loss Streak"
                        value={data.maxLossStreak}
                        isGood={data.maxLossStreak < 3}
                        subtext={`Current streak: ${data.currentLossStreak}`}
                    />
                </div>

                {/* Performance Context */}
                <div className="space-y-3 pt-4 border-t border-gray-100 dark:border-white/5">
                    <h4 className="text-xs font-bold uppercase text-gray-400">
                        Performance Context
                    </h4>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                            Avg P&L After Win
                        </span>
                        <span className={`font-bold ${data.avgPnLAfterWin >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            ${data.avgPnLAfterWin.toFixed(2)}
                        </span>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-300">
                            Avg P&L After Loss
                        </span>
                        <span className={`font-bold ${data.avgPnLAfterLoss >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            ${data.avgPnLAfterLoss.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}

function IndicatorCard({
    label,
    value,
    isGood,
    subtext
}: {
    label: string;
    value: number;
    isGood: boolean;
    subtext?: string;
}) {
    return (
        <div className={`
            p-3 rounded-xl border transition-colors
            ${isGood
                ? 'bg-gray-50 dark:bg-white/5 border-transparent'
                : 'bg-red-50 dark:bg-red-500/10 border-red-100 dark:border-red-500/20'
            }
        `}>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">{label}</p>
            <p className={`text-2xl font-black ${isGood ? 'text-gray-900 dark:text-white' : 'text-red-500'}`}>
                {value}
            </p>
            {subtext && (
                <p className="text-[10px] text-gray-400 mt-1">{subtext}</p>
            )}
        </div>
    );
}
