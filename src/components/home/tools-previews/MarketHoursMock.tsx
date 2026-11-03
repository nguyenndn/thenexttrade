"use client";

import { useEffect, useState } from "react";

export function MarketHoursMock() {
    const [mounted, setMounted] = useState(false);
    const [nowPercent, setNowPercent] = useState(45); // default fallback

    useEffect(() => {
        setMounted(true);
        const updateTime = () => {
            const date = new Date();
            const hours = date.getHours();
            const minutes = date.getMinutes();
            const totalMinutes = hours * 60 + minutes;
            const percent = (totalMinutes / 1440) * 100;
            setNowPercent(percent);
        };

        updateTime();
        const interval = setInterval(updateTime, 60000);
        return () => clearInterval(interval);
    }, []);

    return (
        <div className="h-44 w-full bg-gray-50/80 dark:bg-[#151925] rounded-lg p-4 flex flex-col justify-between relative overflow-hidden border border-gray-200 dark:border-white/10 select-none">
            {/* Glow effect */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between z-10">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest font-mono tabular-nums">
                    Sessions Timeline
                </span>
                <div className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-500/30 px-2 py-0.5 rounded-lg">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-extrabold uppercase tracking-wider">
                        LIVE SESSIONS
                    </span>
                </div>
            </div>

            {/* Grid Timeline Bars */}
            <div className="flex-1 flex flex-col justify-center gap-2.5 relative my-2 z-10">
                {/* Time markers at the top */}
                <div className="flex justify-between text-[9px] font-bold text-slate-400 dark:text-slate-400 font-mono tabular-nums px-1">
                    <span>00</span>
                    <span>06</span>
                    <span>12</span>
                    <span>18</span>
                    <span>24</span>
                </div>

                {/* SYD Session */}
                <div className="relative h-2 w-full bg-slate-200/60 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="absolute h-full bg-slate-500/80 rounded-full"
                        style={{ left: "0%", width: "29.1%" }} // 0h - 7h
                    />
                    <div
                        className="absolute h-full bg-slate-500/80 rounded-full"
                        style={{ left: "91.6%", width: "8.4%" }} // 22h - 24h
                    />
                    <span className="absolute left-2.5 top-0 text-[7px] font-black text-white uppercase tracking-wider leading-none pt-0.5">
                        SYD
                    </span>
                </div>

                {/* TKY Session */}
                <div className="relative h-2 w-full bg-slate-200/60 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="absolute h-full bg-amber-500/80 rounded-full"
                        style={{ left: "0%", width: "37.5%" }} // 0h - 9h
                    />
                    <span className="absolute left-2.5 top-0 text-[7px] font-black text-white uppercase tracking-wider leading-none pt-0.5">
                        TKY
                    </span>
                </div>

                {/* LDN Session */}
                <div className="relative h-2 w-full bg-slate-200/60 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="absolute h-full bg-gold/90 rounded-full"
                        style={{ left: "33.3%", width: "37.5%" }} // 8h - 17h
                    />
                    <span className="absolute left-1/3 ml-2.5 top-0 text-[7px] font-black text-slate-950 uppercase tracking-wider leading-none pt-0.5">
                        LDN
                    </span>
                </div>

                {/* NY Session */}
                <div className="relative h-2 w-full bg-slate-200/60 dark:bg-white/10 rounded-full overflow-hidden">
                    <div
                        className="absolute h-full bg-emerald-500/80 rounded-full"
                        style={{ left: "54.1%", width: "37.5%" }} // 13h - 22h
                    />
                    <span className="absolute left-[54.1%] ml-2.5 top-0 text-[7px] font-black text-white uppercase tracking-wider leading-none pt-0.5">
                        NY
                    </span>
                </div>

                {/* NOW Vertical Marker */}
                {mounted && (
                    <div
                        className="absolute top-4 bottom-0 w-px border-l border-dashed border-rose-500/70 z-20 flex flex-col items-center transition-all duration-1000"
                        style={{ left: `${nowPercent}%` }}
                    >
                        <div className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                        <span className="absolute top-[-10px] text-[7px] font-black text-rose-500 bg-white dark:bg-[#1E2028] px-1.5 rounded-lg border border-rose-200 dark:border-rose-500/40 shadow-sm leading-none py-0.5 select-none whitespace-nowrap">
                            NOW
                        </span>
                    </div>
                )}
            </div>

            {/* Footer Info */}
            <div className="text-[8px] font-bold text-slate-400 dark:text-slate-400 flex justify-between items-center z-10 border-t border-gray-200 dark:border-white/10 pt-2 font-mono tabular-nums">
                <span>GMT+7 timezone</span>
                <span>Auto-sync active</span>
            </div>
        </div>
    );
}
