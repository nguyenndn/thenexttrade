"use client";

import { useState } from "react";

export function MarginMock() {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className="h-44 w-full bg-[#f4faf8] dark:bg-slate-900/80 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden border border-slate-200/60 dark:border-white/10 select-none cursor-pointer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between z-10 font-mono text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
                <span>Margin Requirement</span>
                <span className="text-emerald-600/80 dark:text-emerald-400">BASE CRNCY: USD</span>
            </div>

            {/* Main output */}
            <div className="flex-1 flex flex-col items-center justify-center z-10 py-1">
                <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                    Required Margin
                </span>
                <span
                    className={`text-2xl font-black text-emerald-700 dark:text-emerald-400 tracking-tight font-mono transition-transform duration-300 ${hovered ? "scale-105" : "scale-100"}`}
                >
                    $1,000
                </span>
                <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                    To Open 1 Std Lot
                </span>
            </div>

            {/* Details Grid */}
            <div className="grid grid-cols-4 gap-1.5 z-10 border-t border-emerald-100/50 dark:border-white/10 pt-3">
                {/* Pos Val */}
                <div className="bg-[#ebf5f1] dark:bg-white/[0.04] border border-emerald-200/40 dark:border-white/10 rounded-lg p-1.5 text-center flex flex-col justify-between">
                    <span className="text-[7px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Pos Val
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 font-mono mt-0.5">
                        $100k
                    </span>
                </div>
                {/* Leverage */}
                <div className="bg-[#ebf5f1] dark:bg-white/[0.04] border border-emerald-200/40 dark:border-white/10 rounded-lg p-1.5 text-center flex flex-col justify-between">
                    <span className="text-[7px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Leverage
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 font-mono mt-0.5">
                        1:100
                    </span>
                </div>
                {/* Mgn % */}
                <div className="bg-[#ebf5f1] dark:bg-white/[0.04] border border-emerald-200/40 dark:border-white/10 rounded-lg p-1.5 text-center flex flex-col justify-between">
                    <span className="text-[7px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Mgn %
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 font-mono mt-0.5">
                        1.00%
                    </span>
                </div>
                {/* 2 Lots */}
                <div className="bg-[#ebf5f1] dark:bg-white/[0.04] border border-emerald-200/40 dark:border-white/10 rounded-lg p-1.5 text-center flex flex-col justify-between">
                    <span className="text-[7px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        2 Lots
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono mt-0.5">
                        $2,000
                    </span>
                </div>
            </div>
        </div>
    );
}
