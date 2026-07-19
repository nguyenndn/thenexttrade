"use client";

import { useState, useEffect } from "react";

export function RiskRewardMock() {
    const [hovered, setHovered] = useState(false);
    const [rrRatio, setRrRatio] = useState(2.5);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (hovered) {
            let current = 2.5;
            interval = setInterval(() => {
                current += 0.1;
                if (current >= 3.8) {
                    setRrRatio(3.8);
                    clearInterval(interval);
                } else {
                    setRrRatio(parseFloat(current.toFixed(2)));
                }
            }, 20);
        } else {
            setRrRatio(2.5);
        }
        return () => clearInterval(interval);
    }, [hovered]);

    return (
        <div
            className="h-44 w-full bg-[#f4faf8] dark:bg-[#f4faf8] rounded-xl p-4 flex flex-col justify-between relative overflow-hidden border border-slate-200/60 select-none cursor-pointer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between z-10 font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Risk/Reward Ratio</span>
                <span className="text-emerald-600/80 font-black">
                    R:R = 1:{rrRatio.toFixed(2)}
                </span>
            </div>

            {/* Visual zones */}
            <div className="flex-1 flex flex-col justify-center relative my-2 z-10 gap-0.5">
                {/* Target Zone (Green) */}
                <div
                    className="bg-emerald-100/70 dark:bg-emerald-100/60 border border-emerald-300/40 rounded-t-lg flex items-center justify-between px-3 text-[8px] font-bold text-emerald-700 transition-all duration-350"
                    style={{ height: hovered ? "48px" : "32px" }}
                >
                    <span>TARGET (TP)</span>
                    <span className="font-mono">
                        +{hovered ? "380" : "250"} Pips
                    </span>
                </div>

                {/* Entry Line (Gray) */}
                <div className="h-4 bg-slate-200 border-y border-slate-300/60 flex items-center justify-between px-3 text-[8px] font-black text-slate-600">
                    <span>ENTRY PRICE</span>
                    <span className="font-mono">1.1000</span>
                </div>

                {/* Stop Zone (Red) */}
                <div className="h-8 bg-rose-100/70 dark:bg-rose-100/60 border border-rose-300/40 rounded-b-lg flex items-center justify-between px-3 text-[8px] font-bold text-rose-700">
                    <span>STOP LOSS (SL)</span>
                    <span className="font-mono">-100 Pips</span>
                </div>
            </div>

            {/* Footer */}
            <div className="text-[8px] font-bold text-slate-400 flex justify-between items-center z-10 border-t border-slate-100 pt-2 font-mono">
                <span>Long Position Setup</span>
                <span>Win Prob: {hovered ? "38%" : "50%"}</span>
            </div>
        </div>
    );
}
