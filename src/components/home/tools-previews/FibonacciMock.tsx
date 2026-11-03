"use client";

import { useState } from "react";

export function FibonacciMock() {
    const [hovered, setHovered] = useState(false);

    const levels = [
        {
            label: "100%",
            price: "1.2050",
            color: "bg-slate-400",
            textColor: "text-slate-500 dark:text-slate-400",
        },
        {
            label: "78.6%",
            price: "1.1925",
            color: "bg-emerald-500",
            textColor: "text-emerald-600 dark:text-emerald-400",
        },
        {
            label: "61.8%",
            price: "1.1834",
            color: "bg-gold",
            textColor: "text-amber-600 dark:text-gold",
        },
        {
            label: "50%",
            price: "1.1775",
            color: "bg-amber-500",
            textColor: "text-amber-600 dark:text-amber-400",
        },
        {
            label: "38.2%",
            price: "1.1716",
            color: "bg-emerald-500/70",
            textColor: "text-emerald-600 dark:text-emerald-400",
        },
        {
            label: "0%",
            price: "1.1550",
            color: "bg-slate-400",
            textColor: "text-slate-500 dark:text-slate-400",
        },
    ];

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
                <span>Fibonacci Levels</span>
                <span className="text-amber-600 dark:text-gold">RETRACEMENT MODEL</span>
            </div>

            {/* Levels list */}
            <div className="flex-1 flex flex-col justify-center gap-1.5 z-10 py-1.5 font-mono tabular-nums text-[9px] font-bold">
                {levels.map((lvl) => (
                    <div
                        key={lvl.label}
                        className="flex items-center justify-between gap-3"
                    >
                        <span
                            className={`w-8 text-left ${lvl.textColor} font-black`}
                        >
                            {lvl.label}
                        </span>
                        <div className="flex-1 h-1 bg-slate-200 dark:bg-white/10 rounded-full overflow-hidden relative">
                            <div
                                className={`absolute h-full ${lvl.color} rounded-full transition-all duration-700 ease-out`}
                                style={{
                                    width: hovered
                                        ? "100%"
                                        : lvl.label === "100%"
                                          ? "100%"
                                          : lvl.label === "78.6%"
                                            ? "78.6%"
                                            : lvl.label === "61.8%"
                                              ? "61.8%"
                                              : lvl.label === "50%"
                                                ? "50%"
                                                : lvl.label === "38.2%"
                                                  ? "38.2%"
                                                  : "10%",
                                }}
                            />
                        </div>
                        <span className="w-10 text-right text-slate-500 dark:text-slate-400">
                            {lvl.price}
                        </span>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="text-[8px] font-bold text-slate-400 dark:text-slate-400 flex justify-between items-center z-10 border-t border-gray-200 dark:border-white/10 pt-2 font-mono tabular-nums">
                <span>EURUSD Daily Anchor</span>
                <span>Auto calculate active</span>
            </div>
        </div>
    );
}
