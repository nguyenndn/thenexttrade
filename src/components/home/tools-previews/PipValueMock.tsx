"use client";

import { useState, useEffect } from "react";

export function PipValueMock() {
    const [hovered, setHovered] = useState(false);
    const [rate, setRate] = useState(1.085);
    const [pipVal, setPipVal] = useState(10.0);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (hovered) {
            interval = setInterval(() => {
                // Mock a floating exchange rate fluctuation
                const diff = (Math.random() - 0.5) * 0.002;
                const newRate = parseFloat((rate + diff).toFixed(4));
                setRate(newRate);
                // Pip value shifts slightly based on rate
                setPipVal(parseFloat((10.0 * (newRate / 1.085)).toFixed(2)));
            }, 300);
        } else {
            setRate(1.085);
            setPipVal(10.0);
        }
        return () => clearInterval(interval);
    }, [hovered, rate]);

    return (
        <div
            className="h-44 w-full bg-[#f4faf8] dark:bg-slate-900/80 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden border border-slate-200/60 dark:border-white/10 select-none cursor-pointer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-teal-500/5 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between z-10 font-mono text-[9px] font-bold text-slate-400 dark:text-slate-400 uppercase tracking-widest">
                <span>Pip Value Calculator</span>
                <span className="text-teal-600/80 dark:text-teal-400 font-black">
                    PAIR: EUR/USD
                </span>
            </div>

            {/* Main Body */}
            <div className="flex-1 flex flex-col justify-center gap-2 z-10 my-1">
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 dark:text-slate-400">
                    <span>Live Mid Rate</span>
                    <span className="font-mono text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-white/10 px-1.5 py-0.5 rounded-lg border border-slate-200 dark:border-white/10">
                        {rate.toFixed(4)}
                    </span>
                </div>

                {/* Triple lot sizes grid */}
                <div className="grid grid-cols-3 gap-1.5 font-mono text-center">
                    <div className="bg-[#ebf5f1] dark:bg-white/[0.04] border border-teal-200/30 dark:border-white/10 rounded-lg p-1.5">
                        <span className="text-[6.5px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                            Standard
                        </span>
                        <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-200 block mt-0.5">
                            ${pipVal.toFixed(2)}
                        </span>
                        <span className="text-[5.5px] text-slate-400 dark:text-slate-500 block mt-0.5">
                            100k Units
                        </span>
                    </div>

                    <div className="bg-[#ebf5f1] dark:bg-white/[0.04] border border-teal-200/30 dark:border-white/10 rounded-lg p-1.5">
                        <span className="text-[6.5px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                            Mini
                        </span>
                        <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-200 block mt-0.5">
                            ${(pipVal / 10).toFixed(2)}
                        </span>
                        <span className="text-[5.5px] text-slate-400 dark:text-slate-500 block mt-0.5">
                            10k Units
                        </span>
                    </div>

                    <div className="bg-[#ebf5f1] dark:bg-white/[0.04] border border-teal-200/30 dark:border-white/10 rounded-lg p-1.5">
                        <span className="text-[6.5px] font-black text-slate-400 dark:text-slate-400 uppercase tracking-wider block">
                            Micro
                        </span>
                        <span className="text-[10.5px] font-bold text-slate-700 dark:text-slate-200 block mt-0.5">
                            ${(pipVal / 100).toFixed(3)}
                        </span>
                        <span className="text-[5.5px] text-slate-400 dark:text-slate-500 block mt-0.5">
                            1k Units
                        </span>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-[8px] font-bold text-slate-400 dark:text-slate-400 flex justify-between items-center z-10 border-t border-slate-100 dark:border-white/10 pt-2 font-mono">
                <span>Account Base: USD</span>
                <span
                    className={
                        hovered ? "text-teal-600 dark:text-teal-400 animate-pulse font-bold" : ""
                    }
                >
                    {hovered ? "Live Tick Active" : "Static Quote"}
                </span>
            </div>
        </div>
    );
}
