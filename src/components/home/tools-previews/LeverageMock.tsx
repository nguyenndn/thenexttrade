"use client";

import { useState } from "react";

export function LeverageMock() {
    const [hovered, setHovered] = useState(false);

    return (
        <div
            className="h-44 w-full bg-slate-50 dark:bg-slate-50 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden border border-slate-200/80 select-none cursor-pointer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-blue-500/5 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between z-10 font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Leverage Visualizer</span>
                <span className="text-blue-600/80">RISK METRIC</span>
            </div>

            {/* Main output */}
            <div className="flex-1 flex flex-col justify-center items-center z-10 py-1">
                <span className="text-[8px] font-black text-slate-500 uppercase tracking-wider mb-0.5">
                    Effective Leverage
                </span>
                <span className="text-2xl font-black text-blue-700 tracking-tight font-mono">
                    1:10
                </span>

                {/* Visual Slider Mock */}
                <div className="w-28 h-1 bg-slate-200 rounded-full relative mt-2 overflow-visible">
                    <div
                        className="absolute top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-blue-500 shadow-[0_0_6px_#3b82f6] transition-all duration-500"
                        style={{ left: hovered ? "75%" : "25%" }}
                    />
                </div>
            </div>

            {/* Detail grid */}
            <div className="grid grid-cols-3 gap-1.5 z-10 border-t border-slate-100 pt-3">
                {/* Margin Used */}
                <div className="bg-[#edf4fc] border border-blue-200/40 rounded-lg p-1.5 text-center flex flex-col justify-between">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-wider">
                        Margin Used
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 font-mono mt-0.5">
                        10.00%
                    </span>
                </div>
                {/* Multiplier */}
                <div className="bg-[#edf4fc] border border-blue-200/40 rounded-lg p-1.5 text-center flex flex-col justify-between">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-wider">
                        Multiplier
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 font-mono mt-0.5">
                        10x
                    </span>
                </div>
                {/* 1% Move */}
                <div className="bg-[#edf4fc] border border-blue-200/40 rounded-lg p-1.5 text-center flex flex-col justify-between">
                    <span className="text-[7px] font-black text-slate-500 uppercase tracking-wider">
                        1% Move
                    </span>
                    <span className="text-[10px] font-bold text-blue-600 font-mono mt-0.5">
                        10% ACCT
                    </span>
                </div>
            </div>
        </div>
    );
}
