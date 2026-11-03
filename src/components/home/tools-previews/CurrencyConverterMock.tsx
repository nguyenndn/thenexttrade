"use client";

import { useState } from "react";
import { ArrowUpDown } from "lucide-react";

export function CurrencyConverterMock() {
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
                <span>Currency Converter</span>
                <span className="text-amber-600 dark:text-gold font-black">
                    RATE: 1.0850
                </span>
            </div>

            {/* Inputs mockup */}
            <div className="flex-1 flex flex-col justify-center gap-1.5 z-10 my-1 font-mono tabular-nums">
                {/* Source currency input */}
                <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-lg p-2 flex justify-between items-center text-[10px] font-bold text-slate-700 dark:text-slate-200">
                    <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded-lg bg-gold/10 border border-gold/20 text-[8px] font-black text-amber-600 dark:text-gold leading-none">
                            {hovered ? "EU" : "US"}
                        </span>
                        <span>{hovered ? "EUR" : "USD"}</span>
                    </div>
                    <span>1.00</span>
                </div>

                {/* Swap icon row */}
                <div className="flex justify-center -my-2.5 relative z-20">
                    <div
                        className={`w-5 h-5 rounded-lg bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 shadow-sm flex items-center justify-center text-amber-600 dark:text-gold transition-transform duration-500 ${hovered ? "rotate-180" : "rotate-0"}`}
                    >
                        <ArrowUpDown className="w-3 h-3" />
                    </div>
                </div>

                {/* Target currency output */}
                <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-lg p-2 flex justify-between items-center text-[10px] font-bold text-slate-700 dark:text-slate-200">
                    <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-black text-emerald-600 dark:text-emerald-400 leading-none">
                            {hovered ? "US" : "EU"}
                        </span>
                        <span>{hovered ? "USD" : "EUR"}</span>
                    </div>
                    <span>{hovered ? "1.0850" : "0.9216"}</span>
                </div>
            </div>

            {/* Footer */}
            <div className="text-[8px] font-bold text-slate-400 dark:text-slate-400 flex justify-between items-center z-10 border-t border-gray-200 dark:border-white/10 pt-2 font-mono tabular-nums">
                <span>Quotes: Real-time</span>
                <span>Hover to swap directions</span>
            </div>
        </div>
    );
}
