"use client";

import { AlertCircle, ShieldCheck, Zap } from "lucide-react";

export interface PlaybookSummary {
    playbook: {
        totalTrades: number;
        winRate: number;
        totalPnL: number;
        profitFactor: number;
    };
    discretionary: {
        totalTrades: number;
        winRate: number;
        totalPnL: number;
        profitFactor: number;
    };
}

export function PlaybookComparisonCard({ summary }: { summary?: PlaybookSummary }) {
    if (!summary || (summary.playbook.totalTrades === 0 && summary.discretionary.totalTrades === 0)) {
        return null;
    }

    const { playbook, discretionary } = summary;
    const winRateDiff = playbook.winRate - discretionary.winRate;

    const formatCurrency = (amount: number) => {
        const isNegative = amount < 0;
        const absVal = Math.abs(amount).toLocaleString("en-US", {
            maximumFractionDigits: 0,
        });
        return isNegative ? `-$${absVal}` : `$${absVal}`;
    };

    return (
        <div className="bg-white dark:bg-[#1E2028] border border-dashboard rounded-lg p-3.5 sm:p-4 shadow-sm overflow-hidden relative">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-3 relative z-10 border-b border-dashboard/80 pb-2.5">
                <div>
                    <h3 className="text-sm sm:text-base font-bold text-gray-800 dark:text-white">
                        Playbook vs Discretionary Edge
                    </h3>
                    <p className="text-[11px] text-gray-500 font-medium">
                        Compare your performance when executing disciplined Playbook setups vs impulsive trades
                    </p>
                </div>

                {/* Alpha callout badge */}
                {playbook.totalTrades > 0 && (
                    <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-amber-500/10 border border-amber-500/20 text-gold dark:text-amber-400 text-[11px] font-bold self-start sm:self-auto">
                        <Zap size={13} className="animate-pulse shrink-0" />
                        <span>
                            {winRateDiff >= 0
                                ? `+${winRateDiff.toFixed(1)}% Win Rate with Playbook`
                                : `Keep optimizing your Playbook entries`}
                        </span>
                    </div>
                )}
            </div>

            {/* Side-by-side comparison grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 relative z-10">
                {/* 1. Playbook Setups (Disciplined) */}
                <div className="p-3 sm:p-3.5 rounded-lg bg-gray-50/70 dark:bg-white/[0.02] border border-dashboard relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-gray-400" />
                            <h4 className="text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldCheck size={14} className="text-gray-500 dark:text-gray-400" />
                                Playbook Trades
                            </h4>
                        </div>
                        <span className="text-[11px] font-semibold text-gray-500 bg-gray-200/80 dark:bg-white/10 px-2 py-0.5 rounded-lg">
                            {`${playbook.totalTrades} ${playbook.totalTrades === 1 ? "trade" : "trades"}`}
                        </span>
                    </div>

                    {/* Compact Flat Inline Strip */}
                    <div className="grid grid-cols-3 divide-x divide-dashboard/60 bg-white/70 dark:bg-black/20 rounded-lg p-2 border border-dashboard/50">
                        <div className="text-center px-1">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Win Rate</p>
                            <p className="text-base sm:text-lg font-black text-emerald-500 leading-tight">
                                {`${playbook.winRate.toFixed(1)}%`}
                            </p>
                        </div>
                        <div className="text-center px-1">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Total P&L</p>
                            <p className={`text-base sm:text-lg font-black leading-tight ${playbook.totalPnL >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                {formatCurrency(playbook.totalPnL)}
                            </p>
                        </div>
                        <div className="text-center px-1">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Profit Factor</p>
                            <p className="text-base sm:text-lg font-black text-gray-800 dark:text-white leading-tight">
                                {playbook.profitFactor >= 99 ? "MAX" : playbook.profitFactor.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Discretionary / No Playbook */}
                <div className="p-3 sm:p-3.5 rounded-lg bg-gray-50/70 dark:bg-white/[0.02] border border-dashboard relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-1.5">
                            <span className="w-2 h-2 rounded-full bg-gray-400" />
                            <h4 className="text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <AlertCircle size={14} className="text-gray-400" />
                                Other / Discretionary
                            </h4>
                        </div>
                        <span className="text-[11px] font-semibold text-gray-500 bg-gray-200/80 dark:bg-white/10 px-2 py-0.5 rounded-lg">
                            {`${discretionary.totalTrades} ${discretionary.totalTrades === 1 ? "trade" : "trades"}`}
                        </span>
                    </div>

                    {/* Compact Flat Inline Strip */}
                    <div className="grid grid-cols-3 divide-x divide-dashboard/60 bg-white/70 dark:bg-black/20 rounded-lg p-2 border border-dashboard/50">
                        <div className="text-center px-1">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Win Rate</p>
                            <p className="text-base sm:text-lg font-black text-gray-700 dark:text-gray-200 leading-tight">
                                {`${discretionary.winRate.toFixed(1)}%`}
                            </p>
                        </div>
                        <div className="text-center px-1">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Total P&L</p>
                            <p className={`text-base sm:text-lg font-black leading-tight ${discretionary.totalPnL >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                                {formatCurrency(discretionary.totalPnL)}
                            </p>
                        </div>
                        <div className="text-center px-1">
                            <p className="text-[10px] uppercase font-bold text-gray-400 mb-0.5">Profit Factor</p>
                            <p className="text-base sm:text-lg font-black text-gray-800 dark:text-white leading-tight">
                                {discretionary.profitFactor >= 99 ? "MAX" : discretionary.profitFactor.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
