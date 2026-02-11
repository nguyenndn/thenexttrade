"use client";

import { X } from "lucide-react";

interface DayTradeListProps {
    date: string;
    trades: any[];
    onClose: () => void;
}

export function DayTradeList({ date, trades, onClose }: DayTradeListProps) {
    const totalPnL = trades.reduce((sum, t) => sum + (t.pnl || 0), 0);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-[#151925] w-full max-w-md rounded-xl shadow-2xl border border-gray-100 dark:border-white/10 overflow-hidden animate-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >

                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/5 flex justify-between items-center bg-gray-50/50 dark:bg-white/5">
                    <div>
                        <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                            Trades on {date}
                        </h3>
                        <p className={`text-sm font-bold ${totalPnL >= 0 ? 'text-primary' : 'text-red-500'}`}>
                            Day Total: {totalPnL >= 0 ? '+' : ''}${totalPnL.toFixed(2)}
                        </p>
                    </div>

                    <button
                        onClick={onClose}
                        className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-white/10 text-gray-500 transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* List */}
                <div className="max-h-[60vh] overflow-y-auto p-4 space-y-3">
                    {trades.length === 0 ? (
                        <p className="text-center text-gray-500 py-8">No trades recorded.</p>
                    ) : (
                        trades.map((trade: any) => (
                            <div
                                key={trade.id}
                                className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-[#0B0E14] border border-gray-100 dark:border-white/5 hover:border-primary/30 transition-all"
                            >
                                <div className="flex items-center gap-3">
                                    <div className={`w-1 h-8 rounded-full ${trade.pnl >= 0 ? 'bg-primary' : 'bg-red-500'}`}></div>
                                    <div>
                                        <div className="font-bold text-gray-900 dark:text-white text-sm">
                                            {trade.symbol}
                                        </div>
                                        <div className={`text-xs font-bold uppercase ${trade.type === 'BUY' ? 'text-green-500' : 'text-red-500'}`}>
                                            {trade.type}
                                        </div>
                                    </div>
                                </div>

                                <div className="text-right">
                                    <div className={`font-bold text-sm ${trade.pnl >= 0 ? 'text-primary' : 'text-red-500'}`}>
                                        {trade.pnl >= 0 ? '+' : ''}${trade.pnl.toFixed(2)}
                                    </div>
                                    <div className="text-xs text-gray-500 uppercase font-bold tracking-wider">
                                        {trade.result}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
}
