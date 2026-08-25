"use client";

import { CheckCircle2, Cpu, ShieldCheck, Zap } from "lucide-react";

export function PreviewConnectView() {
    return (
        <div className="h-full flex flex-col justify-between animate-in fade-in duration-300">
            {/* Live Connection Banner */}
            <div className="p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 dark:bg-emerald-500/[0.06] flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                        <Cpu size={16} />
                    </div>
                    <div>
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            <span className="text-xs font-bold text-gray-900 dark:text-white">
                                Trade Manager EA
                            </span>
                        </div>
                        <span className="text-[10px] text-gray-500 dark:text-gray-400">
                            Vantage Live Server · Latency 12ms
                        </span>
                    </div>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-[10px] font-black uppercase tracking-wider">
                    Connected
                </span>
            </div>

            {/* Live Auto-Synced Executions */}
            <div className="p-3 rounded-xl bg-white dark:bg-white/[0.02] border border-gray-200/60 dark:border-white/10 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5">
                        <Zap size={12} className="text-gold" />
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                            Live Stream (Auto Synced)
                        </span>
                    </div>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                        Real-Time Stream
                    </span>
                </div>

                <div className="space-y-1.5">
                    {/* Execution 1 */}
                    <div className="p-2 rounded-lg bg-gray-50/80 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                                BUY
                            </span>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-xs text-gray-900 dark:text-white">
                                        XAUUSD
                                    </span>
                                    <span className="text-[9px] font-mono text-gray-400">
                                        1.50 Lots
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-[9px] text-gray-500">
                                    <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                        <ShieldCheck size={10} /> SL/TP Active
                                    </span>
                                    <span>·</span>
                                    <span>R:R 1:2.8</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 block">
                                +$420.50
                            </span>
                            <span className="text-[9px] text-gray-400">
                                Just now
                            </span>
                        </div>
                    </div>

                    {/* Execution 2 */}
                    <div className="p-2 rounded-lg bg-gray-50/80 dark:bg-white/[0.02] border border-gray-100 dark:border-white/5 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
                                SELL
                            </span>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-xs text-gray-900 dark:text-white">
                                        EURUSD
                                    </span>
                                    <span className="text-[9px] font-mono text-gray-400">
                                        2.00 Lots
                                    </span>
                                </div>
                                <div className="flex items-center gap-2 text-[9px] text-gray-500">
                                    <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                        <CheckCircle2 size={10} /> Plan Matched
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs sm:text-sm font-extrabold text-emerald-600 dark:text-emerald-400 block">
                                +$180.00
                            </span>
                            <span className="text-[9px] text-gray-400">
                                14m ago
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sync summary bar */}
            <div className="px-3 py-2 rounded-xl bg-gold/[0.08] dark:bg-gold/[0.04] border border-gold/20 flex items-center justify-between text-[10px]">
                <span className="text-gray-600 dark:text-gray-300 font-medium">
                    MT5 Chart / VPS Auto Heartbeat
                </span>
                <span className="font-bold text-gold">100% Real-time</span>
            </div>
        </div>
    );
}
