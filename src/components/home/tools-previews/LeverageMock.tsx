"use client";

import { useState } from "react";

export function LeverageMock() {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className="h-44 w-full bg-gray-50/80 dark:bg-[#151925] rounded-lg p-4 flex flex-col justify-between relative overflow-hidden border border-gray-200 dark:border-white/10 select-none cursor-pointer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between z-10 font-mono tabular-nums text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
                <span>Leverage Visualizer</span>
                <span className="text-amber-600 dark:text-gold">RISK METRIC</span>
            </div>

            {/* Main output */}
            <div className="flex-1 flex flex-col justify-center items-center z-10 py-1">
                <span className="text-[8px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                    Effective Leverage
                </span>
                <span className="text-2xl font-black text-amber-600 dark:text-gold tracking-tight font-mono tabular-nums">
                    1:10
                </span>

                {/* Visual Slider Mock */}
                <div className="w-28 h-1 bg-slate-200 dark:bg-white/10 rounded-full relative mt-2 overflow-visible">
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-gold shadow-sm transition-all duration-500"
                        style={{ left: hovered ? "75%" : "25%" }}
                    />
                </div>
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-3 gap-1.5 z-10 border-t border-gray-200 dark:border-white/10 pt-3">
                {/* Margin Used */}
                <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-lg p-1.5 text-center flex flex-col justify-between">
                    <span className="text-[7px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Margin Used
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 font-mono tabular-nums mt-0.5">
                        10.00%
                    </span>
                </div>
                {/* Multiplier */}
                <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-lg p-1.5 text-center flex flex-col justify-between">
                    <span className="text-[7px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        Multiplier
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 font-mono tabular-nums mt-0.5">
                        10x
                    </span>
                </div>
                {/* 1% Move */}
                <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-lg p-1.5 text-center flex flex-col justify-between">
                    <span className="text-[7px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                        1% Move
                    </span>
                    <span className="text-[10px] font-bold text-amber-600 dark:text-gold font-mono tabular-nums mt-0.5">
                        10% ACCT
                    </span>
                </div>
            </div>
        </div>
    );
}
