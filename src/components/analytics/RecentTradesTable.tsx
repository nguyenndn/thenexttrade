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
        <div className="bg-white dark:bg-[#1E2028] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900 dark:text-white">
                    Recent Trades
                </h3>
                <Link
                    href="/dashboard/journal"
                    className="text-sm text-[#00C888] hover:underline font-medium"
                >
                    View all →
                </Link>
            </div>

            {trades.length === 0 ? (
                <div className="py-8 text-center text-gray-400">
                    No trades to display
                </div>
            ) : (
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-400 font-bold tracking-wider">
                            <tr>
                                <th className="px-4 py-3 rounded-l-xl">Date</th>
                                <th className="px-4 py-3">Pair</th>
                                <th className="px-4 py-3">Type</th>
                                <th className="px-4 py-3">Result</th>
                                <th className="px-4 py-3 rounded-r-xl text-right">P&L</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {trades.map((trade) => (
                                <tr
                                    key={trade.id}
                                    className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    <td className="px-4 py-3 text-gray-500">
                                        {format(parseISO(trade.entryDate), "MMM dd, HH:mm")}
                                    </td>
                                    <td className="px-4 py-3 font-bold text-gray-900 dark:text-white">
                                        {trade.symbol}
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`text-xs font-bold px-2 py-1 rounded ${trade.type === "BUY"
                                                    ? "bg-green-100 text-green-700 dark:bg-green-500/10 dark:text-green-400"
                                                    : "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400"
                                                }`}
                                        >
                                            {trade.type}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3">
                                        <span
                                            className={`inline-flex items-center gap-1 text-xs font-bold px-2 py-1 rounded ${getResultBadge(
                                                trade.result
                                            )}`}
                                        >
                                            {getResultIcon(trade.result)}
                                            {trade.result}
                                        </span>
                                    </td>
                                    <td
                                        className={`px-4 py-3 text-right font-bold ${trade.pnl >= 0 ? "text-green-500" : "text-red-500"
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
