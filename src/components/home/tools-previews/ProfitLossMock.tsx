"use client";

import { useState, useEffect } from "react";

export function ProfitLossMock() {
    const [hovered, setHovered] = useState(false);
    const [isLong, setIsLong] = useState(true);

    useEffect(() => {
        if (hovered) {
            setIsLong(false);
        } else {
            setIsLong(true);
        }
    }, [hovered]);

    return (
        <div
            className="h-44 w-full bg-[#f4faf8] dark:bg-slate-900/80 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden border border-slate-200/60 dark:border-white/10 select-none cursor-pointer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Decorative glow */}
            <div
                className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none transition-colors duration-300 ${isLong ? "bg-emerald-500/5" : "bg-rose-500/5"}`}
            />

            {/* Header */}
            <div className="flex items-center justify-between z-10 font-mono text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
                <span>Profit/Loss Projection</span>
                <span
                    className={`px-2 py-0.5 rounded-lg text-[8px] font-black tracking-wider ${isLong ? "bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200/50 dark:border-emerald-500/30" : "bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 border border-rose-200/50 dark:border-rose-500/30"}`}
                >
                    {isLong ? "LONG / BUY" : "SHORT / SELL"}
                </span>
            </div>

            {/* P/L Metrics Display */}
            <div className="flex-1 flex flex-col justify-center items-center z-10 py-1">
                <span className="text-[7px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                    Projected Net P/L
                </span>
                <span
                    className={`text-2xl font-black font-mono tracking-tight transition-all duration-300 ${isLong ? "text-emerald-700 dark:text-emerald-400 scale-100" : "text-rose-700 dark:text-rose-400 scale-105"}`}
                >
                    {isLong ? "+$800.00" : "-$400.00"}
                </span>
                <span
                    className={`text-[8.5px] font-extrabold font-mono mt-0.5 ${isLong ? "text-emerald-600 dark:text-emerald-400" : "text-rose-600 dark:text-rose-400"}`}
                >
                    {isLong ? "+80 Pips" : "-40 Pips"}
                </span>
            </div>

            {/* Trade Parameters List */}
            <div className="grid grid-cols-3 gap-1 z-10 border-t border-slate-100 dark:border-white/10 pt-3 text-center text-[7px] font-bold text-slate-500 dark:text-slate-400 font-mono">
                <div className="bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/40 dark:border-white/10 rounded-lg p-1">
                    <span className="block text-slate-400 dark:text-slate-400 uppercase text-[6px]">
                        Entry
                    </span>
                    <span className="block text-slate-700 dark:text-slate-200 mt-0.5 font-black">
                        1.1000
                    </span>
                </div>
                <div className="bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/40 dark:border-white/10 rounded-lg p-1">
                    <span className="block text-slate-400 dark:text-slate-400 uppercase text-[6px]">
                        Exit Target
                    </span>
                    <span className="block text-slate-700 dark:text-slate-200 mt-0.5 font-black">
                        {isLong ? "1.1080" : "1.0960"}
                    </span>
                </div>
                <div className="bg-slate-100/80 dark:bg-white/[0.04] border border-slate-200/40 dark:border-white/10 rounded-lg p-1">
                    <span className="block text-slate-400 dark:text-slate-400 uppercase text-[6px]">
                        Volume
                    </span>
                    <span className="block text-slate-700 dark:text-slate-200 mt-0.5 font-black">
                        1.0 Lot
                    </span>
                </div>
            </div>
        </div>
    );
}
