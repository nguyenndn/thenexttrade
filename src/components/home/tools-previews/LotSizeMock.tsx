"use client";

import { useState, useEffect } from "react";

export function LotSizeMock() {
    const [hovered, setHovered] = useState(false);
    const [displayValue, setDisplayValue] = useState(0.33);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (hovered) {
            let current = 0.0;
            interval = setInterval(() => {
                current += 0.03;
                if (current >= 0.33) {
                    setDisplayValue(0.33);
                    clearInterval(interval);
                } else {
                    setDisplayValue(parseFloat(current.toFixed(2)));
                }
            }, 30);
        } else {
            setDisplayValue(0.33);
        }

        return () => clearInterval(interval);
    }, [hovered]);

    return (
        <div
            className="h-44 w-full bg-gray-50/80 dark:bg-[#151925] rounded-lg p-4 flex flex-col justify-between relative overflow-hidden border border-gray-200 dark:border-white/10 select-none cursor-pointer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gold/5 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between z-10 font-mono tabular-nums text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Optimal Lot Size</span>
                <span className="text-amber-600 dark:text-gold">RISK MODEL: 1.0%</span>
            </div>

            {/* Main output display */}
            <div className="flex-1 flex flex-col items-center justify-center z-10 py-1">
                <span className="text-3xl font-black text-amber-600 dark:text-gold tracking-tight font-mono tabular-nums">
                    {displayValue.toFixed(2)}
                </span>
                <span className="text-[9px] font-extrabold text-slate-500 dark:text-slate-400 uppercase tracking-wider mt-0.5">
                    Standard Lots · Optimized
                </span>
            </div>

            {/* Lower grid metrics */}
            <div className="grid grid-cols-4 gap-2 z-10 border-t border-gray-200 dark:border-white/10 pt-3">
                {/* Risk */}
                <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-lg py-1.5 px-1 text-center flex flex-col items-center justify-center">
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider leading-none">
                        Risk $
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 font-mono tabular-nums mt-1 leading-none">
                        $200
                    </span>
                </div>
                {/* Max DD */}
                <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-lg py-1.5 px-1 text-center flex flex-col items-center justify-center">
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider leading-none">
                        Max DD
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 dark:text-slate-200 font-mono tabular-nums mt-1 leading-none">
                        6.0%
                    </span>
                </div>
                {/* Avg P/L */}
                <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-lg py-1.5 px-1 text-center flex flex-col items-center justify-center">
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider leading-none">
                        Avg P/L
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1 leading-none">
                        +$400
                    </span>
                </div>
                {/* Growth */}
                <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-lg py-1.5 px-1 text-center flex flex-col items-center justify-center">
                    <span className="text-[7px] font-black text-slate-400 uppercase tracking-wider leading-none">
                        Growth
                    </span>
                    <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-1 leading-none">
                        +4.0%
                    </span>
                </div>
            </div>
        </div>
    );
}
