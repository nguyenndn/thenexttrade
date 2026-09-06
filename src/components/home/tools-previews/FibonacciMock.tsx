"use client";

import { useState } from "react";

export function FibonacciMock() {
    const [hovered, setHovered] = useState(false);

    const levels = [
        {
            label: "100%",
            price: "1.2050",
            color: "bg-amber-500",
            textColor: "text-amber-600",
        },
        {
            label: "78.6%",
            price: "1.1925",
            color: "bg-cyan-500",
            textColor: "text-cyan-600",
        },
        {
            label: "61.8%",
            price: "1.1834",
            color: "bg-violet-500",
            textColor: "text-violet-600",
        },
        {
            label: "50%",
            price: "1.1775",
            color: "bg-emerald-500",
            textColor: "text-emerald-600",
        },
        {
            label: "38.2%",
            price: "1.1716",
            color: "bg-blue-500",
            textColor: "text-blue-600",
        },
        {
            label: "0%",
            price: "1.1550",
            color: "bg-slate-400",
            textColor: "text-slate-500",
        },
    ];

    return (
        <div
            className="h-44 w-full bg-slate-50 dark:bg-slate-900/80 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden border border-slate-200/80 dark:border-white/10 select-none cursor-pointer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-violet-500/5 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between z-10 font-mono text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
                <span>Fibonacci Levels</span>
                <span className="text-violet-600/80 dark:text-violet-400">RETRACEMENT MODEL</span>
            </div>

            {/* Levels list */}
            <div className="flex-1 flex flex-col justify-center gap-1.5 z-10 py-1.5 font-mono text-[9px] font-bold">
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
            <div className="text-[8px] font-bold text-slate-400 dark:text-slate-400 flex justify-between items-center z-10 border-t border-slate-100 dark:border-white/10 pt-2 font-mono">
                <span>EURUSD Daily Anchor</span>
                <span>Auto calculate active</span>
            </div>
        </div>
    );
}
