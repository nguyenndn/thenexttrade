import { Zap, Activity } from "lucide-react";
import { TRADING_SYSTEM_ITEMS } from "./mt5-suite-data";

export function MT5SuiteConsole() {
    return (
        <div className="relative w-full rounded-xl border border-gray-200 dark:border-white/10 bg-white/95 dark:bg-[#151925] p-4 sm:p-5 md:p-6 shadow-xl overflow-hidden group/mockup">
            {/* Blueprint grid lines overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(156,163,175,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(156,163,175,0.05)_1px,transparent_1px)] bg-[size:16px_16px] pointer-events-none" />

            {/* Terminal Header Bar */}
            <div className="flex items-center justify-between mb-3.5 border-b border-gray-200 dark:border-white/10 pb-3 relative z-10">
                <div className="flex items-center gap-2">
                    <div className="flex gap-1.5">
                        <span className="w-2.5 h-2.5 rounded-full bg-rose-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-amber-500/80" />
                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-500/80" />
                    </div>
                    <span className="text-[10px] font-black font-mono text-gray-700 dark:text-gray-300 uppercase tracking-wider ml-1 flex items-center gap-1.5">
                        <Zap size={11} className="text-gold" />
                        MT5 TRADING SYSTEMS SUITE
                    </span>
                </div>

                <span
                    title="Unlocked with $0 fee via eligible broker deposit"
                    className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-[8px] font-black uppercase text-emerald-600 dark:text-emerald-400 tracking-wider relative cursor-help"
                >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    <span>ELIGIBLE UNLOCK</span>
                </span>
            </div>

            {/* 3 Core Trading System Cards */}
            <div className="space-y-3 relative z-10">
                {TRADING_SYSTEM_ITEMS.map((item, idx) => {
                    const Icon = item.icon;
                    return (
                        <div
                            key={idx}
                            className="p-3.5 sm:p-4 rounded-xl border border-gray-200 dark:border-white/[0.08] bg-gray-50/80 dark:bg-[#0D111C] hover:bg-white dark:hover:bg-white/[0.04] hover:border-gold/30 hover:shadow-sm transition-all duration-300 group/tool"
                        >
                            {/* Header Row: Icon + Title + Category Tag */}
                            <div className="flex items-center justify-between gap-2 mb-2">
                                <div className="flex items-center gap-2.5">
                                    <div
                                        className={`h-7 sm:h-8 w-7 sm:w-8 rounded-lg flex items-center justify-center border shrink-0 transition-transform group-hover/tool:scale-105 ${item.iconColor}`}
                                    >
                                        <Icon size={15} />
                                    </div>
                                    <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white">
                                        {item.title}
                                    </span>
                                </div>
                                <span
                                    className={`shrink-0 text-[8px] sm:text-[9px] font-black font-mono uppercase tracking-wider px-2 sm:px-2.5 py-0.5 rounded-lg border ${item.tagColor}`}
                                >
                                    {item.tag}
                                </span>
                            </div>

                            {/* Description */}
                            <p className="text-[11px] sm:text-xs leading-relaxed text-gray-600 dark:text-gray-400 mb-2.5">
                                {item.desc}
                            </p>

                            {/* Telemetry Parameter Pills */}
                            <div className="grid grid-cols-3 gap-1.5 sm:gap-2">
                                {item.badges.map((b, bIdx) => (
                                    <div
                                        key={bIdx}
                                        className="inline-flex sm:flex items-center justify-center gap-1 sm:gap-1.5 px-2 sm:px-2.5 py-1 rounded-lg bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/[0.08] text-[9px] sm:text-[10px] font-mono tabular-nums shadow-xs text-center whitespace-nowrap"
                                    >
                                        <span className="text-gray-400 font-medium">
                                            {b.label}:
                                        </span>
                                        <span className="font-bold text-gray-700 dark:text-gray-300">
                                            {b.value}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Bottom Console Telemetry Strip */}
            <div className="mt-3.5 pt-3 border-t border-gray-200 dark:border-white/10 flex items-center justify-between text-[9px] sm:text-[10px] font-mono tabular-nums text-gray-500 dark:text-gray-400 relative z-10">
                <div className="flex items-center gap-2">
                    <span className="flex items-center gap-1">
                        <Activity size={11} className="text-emerald-500" />
                        <span>MT5 ALL BROKERS</span>
                    </span>
                    <span>•</span>
                    <span>AUTO-BOUND</span>
                </div>
                <span className="font-bold text-amber-600 dark:text-gold uppercase tracking-wider">
                    100% FREE UNLOCK
                </span>
            </div>
        </div>
    );
}
