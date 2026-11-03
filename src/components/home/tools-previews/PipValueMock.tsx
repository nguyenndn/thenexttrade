"use client";

import { useState, useEffect } from "react";

export function PipValueMock() {
    const [hovered, setHovered] = useState(false);
    const [rate, setRate] = useState(1.085);
    const [pipVal, setPipVal] = useState(10.0);

    useEffect(() => {
        if (!hovered) {
            setRate(1.085);
            setPipVal(10.0);
            return;
        }

        const interval = setInterval(() => {
            setRate((prev) => {
                const diff = (Math.random() - 0.5) * 0.002;
                const newRate = parseFloat((prev + diff).toFixed(4));
                setPipVal(parseFloat((10.0 * (newRate / 1.085)).toFixed(2)));
                return newRate;
            });
        }, 300);

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
                <span>Pip Value Calculator</span>
                <span className="text-amber-600 dark:text-gold font-black">
                    PAIR: EUR/USD
                </span>
            </div>

            {/* Main Body */}
            <div className="flex-1 flex flex-col justify-center gap-2 z-10 my-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <span>Live Mid Rate</span>
                    <span className="font-mono tabular-nums text-slate-700 dark:text-slate-200 bg-white dark:bg-white/10 px-1.5 py-0.5 rounded-lg border border-gray-200 dark:border-white/10">
                        {rate.toFixed(4)}
                    </span>
                </div>

                {/* Triple lot sizes grid */}
                <div className="grid grid-cols-3 gap-2 font-mono tabular-nums text-center">
                    <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-lg py-1.5 px-1 flex flex-col items-center justify-center">
                        <span className="text-[6.5px] font-sans font-black text-slate-400 uppercase tracking-wider block leading-none">
                            Standard
                        </span>
                        <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-200 block mt-1 leading-none">
                            ${pipVal.toFixed(2)}
                        </span>
                        <span className="text-[5.5px] text-slate-400 dark:text-slate-500 block mt-1 leading-none">
                            100k Units
                        </span>
                    </div>

                    <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-lg py-1.5 px-1 flex flex-col items-center justify-center">
                        <span className="text-[6.5px] font-sans font-black text-slate-400 uppercase tracking-wider block leading-none">
                            Mini
                        </span>
                        <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-200 block mt-1 leading-none">
                            ${(pipVal / 10).toFixed(2)}
                        </span>
                        <span className="text-[5.5px] text-slate-400 dark:text-slate-500 block mt-1 leading-none">
                            10k Units
                        </span>
                    </div>

                    <div className="bg-white dark:bg-white/[0.03] border border-gray-200 dark:border-white/10 rounded-lg py-1.5 px-1 flex flex-col items-center justify-center">
                        <span className="text-[6.5px] font-sans font-black text-slate-400 uppercase tracking-wider block leading-none">
                            Micro
                        </span>
                        <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-200 block mt-1 leading-none">
                            ${(pipVal / 100).toFixed(3)}
                        </span>
                        <span className="text-[5.5px] text-slate-400 dark:text-slate-500 block mt-1 leading-none">
                            1k Units
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-[8px] font-bold text-slate-400 flex justify-between items-center z-10 border-t border-gray-200 dark:border-white/10 pt-2 font-mono tabular-nums">
                <span>Account Base: USD</span>
                <span className="inline-flex items-center gap-1">
                    {hovered && (
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse shrink-0" />
                    )}
                    <span
                        className={
                            hovered
                                ? "text-emerald-600 dark:text-emerald-400 font-bold"
                                : ""
                        }
                    >
                        {hovered ? "Live Tick Active" : "Static Quote"}
                    </span>
                </span>
            </div>
        </div>
    );
}
