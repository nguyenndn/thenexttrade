"use client";

import { ArrowRight, Clock } from "lucide-react";
import { format } from "date-fns";
import Link from "next/link";

interface Trade {
    id: string;
    symbol: string;
    type: string;
    pnl: number | null;
    exitDate: Date | string | null;
    lotSize?: number;
}

interface RecentTradesMiniProps {
    trades: Trade[];
}

export function RecentTradesMini({ trades }: RecentTradesMiniProps) {
    const displayTrades = trades.slice(0, 5);

    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD',
            signDisplay: 'always',
        }).format(value);
    };

    const formatDate = (date: Date | string | null) => {
        if (!date) return "—";
        return format(new Date(date), "MMM dd, HH:mm");
    };

    return (
        <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow overflow-hidden h-[360px] flex flex-col border-t-4 border-t-indigo-500">
            {/* Header */}
            <div className="px-5 py-4 border-b border-gray-200 dark:border-white/10 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
                        <Clock size={18} />
                    </div>
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-sm">Recent Trades</h3>
                        <p className="text-xs text-gray-400">Latest closed positions</p>
                    </div>
                </div>
                <Link
                    href="/dashboard/journal"
                    className="flex items-center gap-1 text-xs font-bold text-primary hover:text-primary/80 transition-colors group"
                >
                    View All
                    <ArrowRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
            </div>

            {/* Table */}
            {displayTrades.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-gray-600 dark:text-gray-300 font-medium">
                    <Clock size={28} className="mb-2 opacity-50" />
                    <p className="text-sm">No data available</p>
                </div>
            ) : (
                <div className="divide-y divide-gray-50 dark:divide-white/5 flex-1 flex flex-col overflow-hidden">
                    {/* Table header */}
                    <div className="grid grid-cols-12 gap-2 px-5 py-2.5 text-[10px] font-bold uppercase tracking-wider text-gray-400 bg-gray-50 dark:bg-white/[0.02]">
                        <div className="col-span-4">Symbol</div>
                        <div className="col-span-2 text-center">Type</div>
                        <div className="col-span-3 text-right">P&L</div>
                        <div className="col-span-3 text-right">Date</div>
                    </div>
                    {/* Rows */}
                    <div className="flex-1 overflow-hidden divide-y divide-gray-50 dark:divide-white/5">
                        {displayTrades.map((trade) => (
                        <div
                            key={trade.id}
                            className="grid grid-cols-12 gap-2 items-center px-5 py-3 hover:bg-gray-50/50 dark:hover:bg-white/[0.02] transition-colors cursor-default"
                        >
                            <div className="col-span-4 flex items-center gap-2">
                                <span className="font-bold text-sm text-gray-800 dark:text-gray-200">
                                    {trade.symbol}
                                </span>
                                {trade.lotSize && (
                                    <span className="text-[10px] text-gray-400 font-medium">
                                        {Number(trade.lotSize).toFixed(2)}
                                    </span>
                                )}
                            </div>
                            <div className="col-span-2 text-center">
                                <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                                    trade.type?.toLowerCase() === 'buy'
                                        ? 'bg-blue-100 dark:bg-blue-500/20 text-blue-600 dark:text-blue-400'
                                        : 'bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400'
                                }`}>
                                    {trade.type || '—'}
                                </span>
                            </div>
                            <div className={`col-span-3 text-right font-bold text-sm ${
                                (trade.pnl || 0) >= 0 ? 'text-primary' : 'text-red-500'
                            }`}>
                                {formatCurrency(trade.pnl || 0)}
                            </div>
                            <div className="col-span-3 text-right text-xs text-gray-400 font-medium">
                                {formatDate(trade.exitDate)}
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
            )}
        </div>
    );
}
