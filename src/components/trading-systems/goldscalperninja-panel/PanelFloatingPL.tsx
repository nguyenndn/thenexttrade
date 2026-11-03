"use client";

import React from "react";

interface PanelFloatingPLProps {
    floatingPL: number;
}

export function PanelFloatingPL({ floatingPL }: PanelFloatingPLProps) {
    const isPositiveOrZero = floatingPL >= 0;
    const absValue = Math.abs(floatingPL).toFixed(2);
    const displayValue = `${isPositiveOrZero ? "+" : "-"}$${absValue}`;

    return (
        <div className="mb-1.5 border border-rose-600 bg-[#0c1321] px-2 py-2 text-center shadow-inner">
            <div className="mb-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
                FLOATING  P / L
            </div>
            <div
                className={`text-[28px] md:text-[30px] font-black leading-none py-1 tabular-nums ${
                    isPositiveOrZero ? "text-emerald-400" : "text-rose-500"
                }`}
            >
                {displayValue}
            </div>
        </div>
    );
}
