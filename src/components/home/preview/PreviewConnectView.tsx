import { CheckCircle2, ShieldCheck, Zap } from "lucide-react";

export function PreviewConnectView() {
    return (
        <div className="h-full flex-1 flex flex-col justify-between gap-2 animate-in fade-in duration-300">
            {/* Live MT5 → TheNextTrade Streaming Telemetry Banner */}
            <div className="p-2 sm:p-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 dark:bg-emerald-500/[0.07] flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                    {/* MT5 → Streaming Packet Track → TheNextTrade (matching brag.mp4 Scene 3) */}
                    <div
                        aria-hidden="true"
                        className="flex items-center gap-1.5 sm:gap-2 shrink-0 select-none"
                    >
                        <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/15 flex flex-col items-center justify-center shadow-xs shrink-0">
                            <span className="text-[9.5px] sm:text-[10px] font-black leading-none text-gray-800 dark:text-slate-200">MT5</span>
                            <span className="text-[6.5px] sm:text-[7px] font-bold leading-none text-amber-600 dark:text-amber-400 mt-0.5">CLOUD</span>
                        </div>

                        <div className="relative w-16 sm:w-24 h-6 flex items-center overflow-hidden">
                            <div className="w-full border-t-[1.5px] border-dashed border-gray-300 dark:border-white/20" />
                            <span className="absolute top-1/2 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_#F59E0B] animate-mt5-packet" />
                            <span className="absolute top-1/2 h-2 w-2 sm:h-2.5 sm:w-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_#10B981] animate-mt5-packet-delayed" />
                        </div>

                        <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-emerald-500/15 dark:bg-emerald-500/15 border border-emerald-500/35 flex items-center justify-center shadow-xs shrink-0">
                            <img
                                src="/images/logo_thenexttrade_brain.png"
                                alt=""
                                width={20}
                                height={20}
                                className="w-4 h-4 sm:w-5 sm:h-5 object-contain"
                            />
                        </div>
                    </div>

                    <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                            <span className="text-[11px] sm:text-xs font-bold text-gray-900 dark:text-white truncate">
                                Trade Manager EA
                            </span>
                        </div>
                        <span className="text-[9px] sm:text-[10px] text-gray-500 dark:text-gray-400 block truncate">
                            Vantage Live Server ·{" "}
                            <span className="tabular-nums font-semibold text-gray-700 dark:text-gray-300">
                                12ms
                            </span>
                        </span>
                    </div>
                </div>
                <span className="hidden sm:inline-flex px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 tabular-nums text-[9px] font-black uppercase tracking-wider shrink-0">
                    Synced just now
                </span>
            </div>

            {/* Live Auto-Synced Executions */}
            <div className="p-2.5 rounded-xl bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 shadow-sm flex-1 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-1.5 shrink-0">
                    <div className="flex items-center gap-1.5">
                        <Zap size={11} className="text-gold" />
                        <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">
                            Live Stream (Auto Synced)
                        </span>
                    </div>
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-bold">
                        Real-Time Stream
                    </span>
                </div>

                <div className="space-y-1.5">
                    <div className="p-1.5 sm:p-2 rounded-lg bg-gray-50/80 dark:bg-white/[0.02] border border-gray-100 dark:border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded-lg text-[8px] font-black uppercase bg-emerald-100 dark:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400">
                                BUY
                            </span>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-xs text-gray-900 dark:text-white">
                                        XAUUSD
                                    </span>
                                    <span className="text-[9px] tabular-nums text-gray-400">
                                        1.50 Lots
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
                                    <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                        <ShieldCheck size={10} /> SL/TP Active
                                    </span>
                                    <span>·</span>
                                    <span className="tabular-nums">R:R 1:2.8</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs sm:text-sm tabular-nums font-extrabold text-emerald-600 dark:text-emerald-400 block">
                                +$420.50
                            </span>
                            <span className="text-[8px] tabular-nums text-gray-400">
                                Just now
                            </span>
                        </div>
                    </div>

                    <div className="p-1.5 sm:p-2 rounded-lg bg-gray-50/80 dark:bg-white/[0.02] border border-gray-100 dark:border-white/10 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <span className="px-1.5 py-0.5 rounded-lg text-[8px] font-black uppercase bg-red-100 dark:bg-red-500/20 text-red-700 dark:text-red-400">
                                SELL
                            </span>
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="font-extrabold text-xs text-gray-900 dark:text-white">
                                        EURUSD
                                    </span>
                                    <span className="text-[9px] tabular-nums text-gray-400">
                                        2.00 Lots
                                    </span>
                                </div>
                                <div className="flex items-center gap-1.5 text-[9px] text-gray-500">
                                    <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium">
                                        <CheckCircle2 size={10} /> Plan Matched
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <span className="text-xs sm:text-sm tabular-nums font-extrabold text-emerald-600 dark:text-emerald-400 block">
                                +$180.00
                            </span>
                            <span className="text-[8px] tabular-nums text-gray-400">
                                14m ago
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Sync summary bar */}
            <div className="px-2.5 py-1.5 rounded-xl bg-gold/[0.08] dark:bg-gold/[0.04] border border-gold/20 flex items-center justify-between text-[10px] shrink-0">
                <span className="text-gray-600 dark:text-gray-300 font-medium">
                    MT5 Chart / VPS Auto Heartbeat
                </span>
                <span className="tabular-nums font-bold text-gold">100% Real-time</span>
            </div>
        </div>
    );
}
