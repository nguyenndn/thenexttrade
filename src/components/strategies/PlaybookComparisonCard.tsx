"use client";

import { BookOpen, AlertCircle, ShieldCheck, Zap, TrendingUp, Target, Scale } from "lucide-react";

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
    const pnlDiff = playbook.totalPnL - discretionary.totalPnL;

    return (
        <div className="bg-white dark:bg-[#1E2028] border border-dashboard rounded-xl p-6 shadow-sm overflow-hidden relative">
            {/* Ambient background glow */}
            <div className="absolute top-0 right-0 w-80 h-80 bg-primary/5 rounded-full blur-3xl pointer-events-none" />

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 relative z-10 border-b border-dashboard pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                        <Scale size={20} />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-gray-700 dark:text-white flex items-center gap-2">
                            Playbook vs Discretionary Edge
                        </h3>
                        <p className="text-xs text-gray-500 font-medium">
                            Compare your performance when executing disciplined Playbook setups vs impulsive trades
                        </p>
                    </div>
                </div>

                {/* Alpha callout badge */}
                {playbook.totalTrades > 0 && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-primary/10 border border-primary/20 text-primary text-xs font-bold self-start sm:self-auto">
                        <Zap size={14} className="animate-pulse" />
                        <span>
                            {winRateDiff >= 0
                                ? `+${winRateDiff.toFixed(1)}% Win Rate on Playbook Setups`
                                : `Keep optimizing your Playbook entries`}
                        </span>
                    </div>
                )}
            </div>

            {/* Side-by-side comparison grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 relative z-10">
                {/* 1. Playbook Setups (Disciplined) */}
                <div className="p-5 rounded-xl bg-primary/5 border border-primary/20 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-primary animate-ping" />
                            <h4 className="text-sm font-black text-gray-700 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                                <ShieldCheck size={16} className="text-primary" />
                                Playbook Trades
                            </h4>
                        </div>
                        <span className="text-xs font-bold text-primary bg-primary/10 px-2.5 py-0.5 rounded-full">
                            {playbook.totalTrades} {playbook.totalTrades === 1 ? "trade" : "trades"}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/80 dark:bg-[#151925] p-3 rounded-xl border border-dashboard text-center">
                            <p className="text-[10px] uppercase font-bold text-gray-500 mb-0.5">Win Rate</p>
                            <p className="text-xl font-black text-primary">
                                {playbook.winRate.toFixed(1)}%
                            </p>
                        </div>
                        <div className="bg-white/80 dark:bg-[#151925] p-3 rounded-xl border border-dashboard text-center">
                            <p className="text-[10px] uppercase font-bold text-gray-500 mb-0.5">Total P&L</p>
                            <p className={`text-xl font-black ${playbook.totalPnL >= 0 ? "text-primary" : "text-red-500"}`}>
                                ${playbook.totalPnL.toFixed(0)}
                            </p>
                        </div>
                        <div className="bg-white/80 dark:bg-[#151925] p-3 rounded-xl border border-dashboard text-center">
                            <p className="text-[10px] uppercase font-bold text-gray-500 mb-0.5">Profit Factor</p>
                            <p className="text-xl font-black text-gray-700 dark:text-white">
                                {playbook.profitFactor >= 99 ? "MAX" : playbook.profitFactor.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>

                {/* 2. Discretionary / No Playbook */}
                <div className="p-5 rounded-xl bg-gray-50/70 dark:bg-white/[0.02] border border-dashboard relative overflow-hidden">
                    <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-gray-400" />
                            <h4 className="text-sm font-black text-gray-500 dark:text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                                <AlertCircle size={16} className="text-gray-400" />
                                Other / Discretionary
                            </h4>
                        </div>
                        <span className="text-xs font-bold text-gray-500 bg-gray-200 dark:bg-white/10 px-2.5 py-0.5 rounded-full">
                            {discretionary.totalTrades} {discretionary.totalTrades === 1 ? "trade" : "trades"}
                        </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/80 dark:bg-[#151925] p-3 rounded-xl border border-dashboard text-center">
                            <p className="text-[10px] uppercase font-bold text-gray-500 mb-0.5">Win Rate</p>
                            <p className="text-xl font-black text-gray-700 dark:text-white">
                                {discretionary.winRate.toFixed(1)}%
                            </p>
                        </div>
                        <div className="bg-white/80 dark:bg-[#151925] p-3 rounded-xl border border-dashboard text-center">
                            <p className="text-[10px] uppercase font-bold text-gray-500 mb-0.5">Total P&L</p>
                            <p className={`text-xl font-black ${discretionary.totalPnL >= 0 ? "text-green-500" : "text-red-500"}`}>
                                ${discretionary.totalPnL.toFixed(0)}
                            </p>
                        </div>
                        <div className="bg-white/80 dark:bg-[#151925] p-3 rounded-xl border border-dashboard text-center">
                            <p className="text-[10px] uppercase font-bold text-gray-500 mb-0.5">Profit Factor</p>
                            <p className="text-xl font-black text-gray-700 dark:text-white">
                                {discretionary.profitFactor >= 99 ? "MAX" : discretionary.profitFactor.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
