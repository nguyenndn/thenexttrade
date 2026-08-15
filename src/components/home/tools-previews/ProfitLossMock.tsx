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
            className="h-44 w-full bg-[#f4faf8] dark:bg-[#f4faf8] rounded-xl p-4 flex flex-col justify-between relative overflow-hidden border border-slate-200/60 select-none cursor-pointer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Decorative glow */}
            <div
                className={`absolute top-0 right-0 w-24 h-24 rounded-full blur-2xl pointer-events-none transition-colors duration-300 ${isLong ? "bg-emerald-500/5" : "bg-rose-500/5"}`}
            />

            {/* Header */}
            <div className="flex items-center justify-between z-10 font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Profit/Loss Projection</span>
                <span
                    className={`px-2 py-0.5 rounded-lg text-[8px] font-black tracking-wider ${isLong ? "bg-emerald-50 text-emerald-600 border border-emerald-200/50" : "bg-rose-50 text-rose-600 border border-rose-200/50"}`}
                >
                    {isLong ? "LONG / BUY" : "SHORT / SELL"}
                </span>
            </div>

            {/* P/L Metrics Display */}
            <div className="flex-1 flex flex-col justify-center items-center z-10 py-1">
                <span className="text-[7px] font-black text-slate-500 uppercase tracking-wider mb-0.5">
                    Projected Net P/L
                </span>
                <span
                    className={`text-2xl font-black font-mono tracking-tight transition-all duration-300 ${isLong ? "text-emerald-700 scale-100" : "text-rose-700 scale-105"}`}
                >
                    {isLong ? "+$800.00" : "-$400.00"}
                </span>
                <span
                    className={`text-[8.5px] font-extrabold font-mono mt-0.5 ${isLong ? "text-emerald-600" : "text-rose-600"}`}
                >
                    {isLong ? "+80 Pips" : "-40 Pips"}
                </span>
            </div>

            {/* Trade Parameters List */}
            <div className="grid grid-cols-3 gap-1 z-10 border-t border-slate-100 pt-3 text-center text-[7px] font-bold text-slate-500 font-mono">
                <div className="bg-slate-100/80 border border-slate-200/40 rounded-lg p-1">
                    <span className="block text-slate-400 uppercase text-[6px]">
                        Entry
                    </span>
                    <span className="block text-slate-700 mt-0.5 font-black">
                        1.1000
                    </span>
                </div>
                <div className="bg-slate-100/80 border border-slate-200/40 rounded-lg p-1">
                    <span className="block text-slate-400 uppercase text-[6px]">
                        Exit Target
                    </span>
                    <span className="block text-slate-700 mt-0.5 font-black">
                        {isLong ? "1.1080" : "1.0960"}
                    </span>
                </div>
                <div className="bg-slate-100/80 border border-slate-200/40 rounded-lg p-1">
                    <span className="block text-slate-400 uppercase text-[6px]">
                        Volume
                    </span>
                    <span className="block text-slate-705 mt-0.5 font-black">
                        1.0 Lot
                    </span>
                </div>
            </div>
        </div>
    );
}
