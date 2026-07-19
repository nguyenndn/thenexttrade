"use client";

import { useState, useEffect } from "react";

export function DrawdownMock() {
    const [hovered, setHovered] = useState(false);
    const [drawdown, setDrawdown] = useState(20);
    const [recovery, setRecovery] = useState(25);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (hovered) {
            let currentDD = 20;
            interval = setInterval(() => {
                currentDD += 2;
                if (currentDD >= 50) {
                    setDrawdown(50);
                    setRecovery(100); // 50% loss = 100% recovery required
                    clearInterval(interval);
                } else {
                    setDrawdown(currentDD);
                    // Recovery formula: DD / (1 - DD/100)
                    const rec = currentDD / (1 - currentDD / 100);
                    setRecovery(parseFloat(rec.toFixed(1)));
                }
            }, 20);
        } else {
            setDrawdown(20);
            setRecovery(25);
        }
        return () => clearInterval(interval);
    }, [hovered]);

    return (
        <div
            className="h-44 w-full bg-[#faf6f0] dark:bg-[#faf6f0] rounded-xl p-4 flex flex-col justify-between relative overflow-hidden border border-slate-200/60 select-none cursor-pointer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-orange-500/5 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between z-10 font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Asymmetric Recovery</span>
                <span className="text-orange-600/80 font-black">
                    MATH MODEL
                </span>
            </div>

            {/* Main Bar Comparer */}
            <div className="flex-1 flex flex-col justify-center gap-3 z-10 my-1">
                {/* Drawdown (Loss) Bar */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">
                        <span>Account Drawdown</span>
                        <span className="text-rose-600 font-mono">
                            -{drawdown}%
                        </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-rose-500 rounded-full transition-all duration-300"
                            style={{ width: `${drawdown}%` }}
                        />
                    </div>
                </div>

                {/* Recovery Required Bar */}
                <div className="space-y-1">
                    <div className="flex justify-between text-[8px] font-extrabold text-slate-500 uppercase tracking-wider">
                        <span>Recovery Gain Required</span>
                        <span className="text-emerald-600 font-mono">
                            +{recovery}%
                        </span>
                    </div>
                    <div className="h-2 w-full bg-slate-200 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-300 ${drawdown >= 40 ? "bg-red-500" : "bg-amber-500"}`}
                            style={{ width: `${Math.min(recovery, 100)}%` }}
                        />
                    </div>
                </div>
            </div>

            {/* Footer */}
            <div className="text-[8px] font-bold text-slate-400 flex justify-between items-center z-10 border-t border-slate-100 pt-2 font-mono">
                <span>Initial Cap: $10,000</span>
                <span
                    className={drawdown >= 45 ? "text-red-500 font-bold" : ""}
                >
                    {drawdown >= 45 ? "Critical Recovery" : "Healthy Bounds"}
                </span>
            </div>
        </div>
    );
}
