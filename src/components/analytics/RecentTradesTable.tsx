"use client";

import { format, parseISO } from "date-fns";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";

interface RecentTradesTableProps {
    trades: Array<{
        id: string;
        symbol: string;
        type: string;
        pnl: number;
        entryDate: string;
        result: string;
    }>;
}

export function RecentTradesTable({ trades }: RecentTradesTableProps) {
    if (!trades) return null;

    const getResultIcon = (result: string) => {
        switch (result) {
            case "WIN":
                return <TrendingUp size={14} className="text-green-500" />;
            case "LOSS":
                return <TrendingDown size={14} className="text-red-500" />;
            default:
                return <Minus size={14} className="text-gray-400" />;
        }
    };

    const getResultBadge = (result: string) => {
        switch (result) {
            case "WIN":
                return "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400";
            case "LOSS":
                return "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400";
            default:
                return "bg-gray-100 text-gray-700 dark:bg-gray-500/10 dark:text-gray-400";
        }
    };

    return (
        <div className="bg-white dark:bg-[#1E2028] p-6 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm hover:shadow-md transition-shadow group">
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-6 bg-[#00C888] rounded-full"></div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-lg">
                        Recent Trades
                    </h3>
                </div>
                <Link
                    href="/dashboard/journal"
                    className="text-xs font-bold uppercase tracking-widest text-[#00C888] hover:opacity-80 transition-opacity bg-[#00C888]/10 px-3 py-1.5 rounded-lg border border-[#00C888]/20"
                >
                    View journal
                </Link>
            </div>

            {trades.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                    No trades to display
                </div>
            ) : (
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-white/10">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-400 font-bold tracking-wider border-b border-gray-200 dark:border-white/10">
                            <tr>
                                <th className="px-4 py-3">Date</th>
                                <th className="px-4 py-3">Pair</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Result</th>
                                <th className="px-4 py-3 text-right">P&L</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {trades.map((trade) => (
                                <tr
                                    key={trade.id}
                                    className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors group/row"
                                >
                                    <td className="px-4 py-3.5 text-gray-500 font-medium whitespace-nowrap">
                                        {format(parseISO(trade.entryDate), "MMM dd, HH:mm")}
                                    </td>
                                    <td className="px-4 py-3.5 font-bold text-gray-900 dark:text-white whitespace-nowrap">
                                        {trade.symbol}
                                    </td>
                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                        <span
                                            className={`text-[11px] font-bold px-2 py-1 rounded inline-block ${trade.type === "BUY"
                                                    ? "bg-emerald-50 text-emerald-600 dark:bg-[#00C888]/10 dark:text-[#00C888]"
                                                    : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
                                                }`}
                                        >
                                            {trade.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3.5 whitespace-nowrap">
                                        <span
                                            className={`inline-flex items-center gap-1.5 text-[11px] font-bold px-2 py-1 rounded ${trade.result === "WIN" ? "bg-emerald-50 dark:bg-[#00C888]/10 text-emerald-600 dark:text-[#00C888]" : trade.result === "LOSS" ? "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400" : "bg-gray-50 dark:bg-white/5 text-gray-500 dark:text-gray-400"}`}
                                        >
                                            {getResultIcon(trade.result)}
                                            {trade.result}
                                        </span>
                                    </td>
                                    <td
                                        className={`px-4 py-3.5 text-right font-bold whitespace-nowrap ${trade.pnl >= 0 ? "text-emerald-500 dark:text-[#00C888]" : "text-red-500"
                                            }`}
                                    >
                                        {trade.pnl >= 0 ? "+" : ""}${trade.pnl.toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}
