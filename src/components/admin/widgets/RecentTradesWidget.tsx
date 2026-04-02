"use client";

import { ArrowDownRight, ArrowUpRight, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

interface Trade {
    id: string;
    symbol: string;
    type: "BUY" | "SELL";
    entryPrice: number;
    pnl: number | null;
    createdAt: Date;
    user: {
        name: string | null;
        image: string | null;
    };
}

const itemVariants = {
    hidden: { opacity: 0, x: -16 },
    visible: (i: number) => ({
        opacity: 1,
        x: 0,
        transition: { delay: i * 0.08, duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] as const },
    }),
};

export function RecentTradesWidget({ trades }: { trades: Trade[] }) {
    return (
        <div className="bg-white dark:bg-[#0B0E14] border border-gray-200 dark:border-white/10 rounded-xl p-6 h-full flex flex-col shadow-sm hover:shadow-md transition-shadow">
            <h3 className="text-lg font-bold text-gray-700 dark:text-white mb-4 flex items-center gap-2">
                <Clock className="w-5 h-5 text-blue-500" aria-hidden="true" />
                Recent Trading Activity
            </h3>

            <div className="space-y-3 flex-1 overflow-y-auto pr-2 custom-scrollbar">
                {trades.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 text-gray-500">
                        <ArrowUpRight className="w-10 h-10 mb-3 opacity-30" />
                        <p className="font-medium">No recent trades</p>
                        <p className="text-xs mt-1">Trading activity will appear here</p>
                    </div>
                ) : (
                    trades.map((trade, i) => (
                        <motion.div
                            key={trade.id}
                            custom={i}
                            initial="hidden"
                            animate="visible"
                            variants={itemVariants}
                            className="flex items-center justify-between group p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs shadow-sm",
                                    trade.type === "BUY"
                                        ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 ring-1 ring-emerald-500/20"
                                        : "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 ring-1 ring-red-500/20"
                                )}>
                                    {trade.type === "BUY" ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                                </div>
                                <div>
                                    <div className="font-bold text-gray-700 dark:text-white flex items-center gap-2">
                                        {trade.symbol}
                                        <span className="text-xs font-normal text-gray-600 dark:text-gray-300">
                                            by {trade.user.name || "Unknown"}
                                        </span>
                                    </div>
                                    <div className="text-xs text-gray-600 dark:text-gray-300">
                                        Entry: {trade.entryPrice}
                                    </div>
                                </div>
                            </div>

                            <div className="text-right">
                                <div className={cn(
                                    "font-bold text-sm",
                                    (trade.pnl || 0) >= 0 ? "text-emerald-500" : "text-red-500"
                                )}>
                                    {(trade.pnl || 0) > 0 ? "+" : ""}{trade.pnl ? `$${trade.pnl}` : "-"}
                                </div>
                                <div className="text-xs text-gray-500">
                                    {formatDistanceToNow(new Date(trade.createdAt), { addSuffix: true })}
                                </div>
                            </div>
                        </motion.div>
                    ))
                )}
            </div>
        </div>
    );
}
