"use client";

import { X, TrendingUp, TrendingDown, BarChart3 } from "lucide-react";
import { createPortal } from "react-dom";

import { format } from "date-fns";
import Link from "next/link";
import { Button } from "@/components/ui/Button";

interface DayTradeListProps {
    date: string;
    trades: any[];
    stats?: {
        buys: number;
        sells: number;
        totalTrades: number;
        bestTrade: number;
        worstTrade: number;
        avgHoldTimeMinutes: number;
        commissionsAndFees: number;
        winrate: number;
        profitFactor: number;
        expectancy: number;
    };
    startBalance?: number;
    endBalance?: number;
    onClose: () => void;
}

export function DayTradeList({ date, trades, stats, startBalance, endBalance, onClose }: DayTradeListProps) {
    const netPnl = trades.reduce((sum, t) => sum + (t.netPnl || t.pnl || 0), 0);
    const dateObj = new Date(date);
    const displayDate = format(dateObj, "EEE, MMM d, yyyy");

    if (typeof document === "undefined") return null;
    
    // Growth calculation
    const growth = startBalance ? (netPnl / startBalance) * 100 : 0;
    
    const deposit = 0; // Deposit data placeholder

    return createPortal(
        <div 
            className="fixed inset-0 z-[9999] flex items-center justify-center animate-in fade-in duration-200 p-4"
        >
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div 
                className="relative z-10 bg-white dark:bg-[#1E2028] w-full max-w-md rounded-xl shadow-2xl border border-gray-100 dark:border-white/5 flex flex-col max-h-[95vh] overflow-hidden animate-in zoom-in-95 duration-200"
            >
                {/* Close Button Header (No Border) */}
                <div className="px-6 pt-6 pb-2 relative shrink-0">
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                        {displayDate}
                    </h2>
                    <Button 
                        variant="ghost"
                        size="icon"
                        onClick={onClose}
                        className="absolute right-4 top-4 p-2 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-gray-500 transition-colors border-0"
                    >
                        <X size={20} />
                    </Button>
                </div>

                {/* Scrollable Content */}
                <div className="overflow-y-auto flex-1 custom-scrollbar">
                    {/* Net PnL Section */}
                    <div className="px-6 py-4">
                        <div className="flex justify-between items-end pl-4">
                            <div className="border-l-[3px] border-[#3B82F6] pl-4">
                                <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-1">Net P&L</p>
                                <h3 className={`text-[2.25rem] font-bold leading-tight tracking-tight ${netPnl >= 0 ? 'text-[#3B82F6]' : 'text-red-500'}`}>
                                    {netPnl >= 0 ? '+' : ''}{netPnl.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </h3>
                            </div>
                            <div className="flex flex-col items-end pb-1">
                                {growth !== 0 && (
                                    <>
                                        {growth > 0 ? (
                                            <TrendingUp size={20} className="text-[#3B82F6] mb-1" />
                                        ) : (
                                            <TrendingDown size={20} className="text-red-500 mb-1" />
                                        )}
                                        <span className={`text-sm font-bold ${growth >= 0 ? 'text-[#3B82F6]' : 'text-red-500'}`}>
                                            {growth >= 0 ? '+' : ''}{growth.toFixed(2)}%
                                        </span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Balances Section */}
                    <div className="px-6 py-5 border-t border-gray-100 dark:border-white/5">
                        <div className="flex justify-between items-center mb-5">
                            <div>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1 font-medium italic">Start Balance</p>
                                <p className="text-base font-bold text-gray-900 dark:text-white">
                                    ${startBalance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-[11px] text-gray-500 dark:text-gray-400 mb-1 font-medium italic">End Balance</p>
                                <p className="text-base font-bold text-gray-900 dark:text-white">
                                    ${endBalance?.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Deposit</span>
                                <span className="font-bold text-gray-900 dark:text-white">${deposit.toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                                    <span className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-100 dark:bg-white/10 text-[9px] font-bold text-gray-500 dark:text-gray-400">$</span>
                                    Commissions & Fees
                                </span>
                                <span className="font-bold text-gray-900 dark:text-white">
                                    ${stats?.commissionsAndFees ? Math.abs(stats.commissionsAndFees).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Trading Stats */}
                    <div className="px-6 py-5 border-t border-gray-100 dark:border-white/5">
                        <div className="flex items-center gap-2 mb-4">
                            <BarChart3 size={14} className="text-gray-400" />
                            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-widest">Trading Stats</span>
                        </div>

                        <div className="flex justify-between text-xs mb-6 text-gray-500 dark:text-gray-400">
                            <span>Buys <span className="font-bold text-gray-900 dark:text-white ml-1">{stats?.buys || 0}</span></span>
                            <span>Sells <span className="font-bold text-gray-900 dark:text-white ml-1">{stats?.sells || 0}</span></span>
                            <span>Total Trades <span className="font-bold text-gray-900 dark:text-white ml-1">{stats?.totalTrades || trades.length}</span></span>
                        </div>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Best Trade</span>
                                <span className="font-bold text-[#3B82F6]">${stats?.bestTrade ? stats.bestTrade.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00'}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Worst Trade</span>
                                <span className="font-bold text-red-500">
                                    {stats?.worstTrade ? (stats.worstTrade > 0 ? '' : '-') + '$' + Math.abs(stats.worstTrade).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '$0.00'}
                                </span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-gray-500 dark:text-gray-400">Avg Hold Time</span>
                                <span className="font-bold text-gray-900 dark:text-white">{stats?.avgHoldTimeMinutes || 0} min</span>
                            </div>
                        </div>
                    </div>

                    {/* Bottom Percentages Grid */}
                    <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-white/5 border-t border-gray-100 dark:border-white/5">
                        <div className="p-4 text-center">
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1.5 font-bold uppercase tracking-wider">Winrate</p>
                            <p className="font-bold text-gray-900 dark:text-white text-base">
                                {stats?.winrate ? stats.winrate.toFixed(2) : '0'}%
                            </p>
                        </div>
                        <div className="p-4 text-center bg-gray-50/30 dark:bg-white/[0.01]">
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1.5 font-bold uppercase tracking-wider">Profit Factor</p>
                            <p className="font-bold text-[#3B82F6] text-base">
                                {stats?.profitFactor ? stats.profitFactor.toFixed(2) : '0'}
                            </p>
                        </div>
                        <div className="p-4 text-center">
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mb-1.5 font-bold uppercase tracking-wider">Expectancy</p>
                            <p className="font-bold text-[#3B82F6] text-base">
                                {stats?.expectancy ? stats.expectancy.toFixed(2) : '0'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Footer Action */}
                <div className="p-4 bg-white dark:bg-[#1E2028] border-t border-gray-100 dark:border-white/5 shrink-0">
                    <Link
                        href={`/dashboard/journal?from=${date}&to=${date}`}
                        className="block w-full py-2 text-center text-sm font-bold text-[#3B82F6] hover:text-[#2563EB] transition-colors"
                    >
                        View In Journal
                    </Link>
                </div>
            </div>
        </div>,
        document.body
    );
}
