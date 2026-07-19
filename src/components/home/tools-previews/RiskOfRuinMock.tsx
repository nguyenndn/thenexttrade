"use client";

import { useState, useEffect } from "react";

export function RiskOfRuinMock() {
    const [hovered, setHovered] = useState(false);
    const [riskPerTrade, setRiskPerTrade] = useState(2);
    const [ruinProb, setRuinProb] = useState(0.1);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (hovered) {
            let currentRisk = 2;
            interval = setInterval(() => {
                currentRisk += 0.5;
                if (currentRisk >= 10) {
                    setRiskPerTrade(10);
                    setRuinProb(95.8);
                    clearInterval(interval);
                } else {
                    setRiskPerTrade(parseFloat(currentRisk.toFixed(1)));
                    // Exponential approximation for demonstration
                    const ratio = (currentRisk - 2) / 8;
                    const prob = 0.1 + ratio * ratio * 95.7;
                    setRuinProb(parseFloat(prob.toFixed(1)));
                }
            }, 20);
        } else {
            setRiskPerTrade(2);
            setRuinProb(0.1);
        }
        return () => clearInterval(interval);
    }, [hovered]);

    return (
        <div
            className="h-44 w-full bg-[#fdfbf7] dark:bg-[#fdfbf7] rounded-xl p-4 flex flex-col justify-between relative overflow-hidden border border-slate-200/60 select-none cursor-pointer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between z-10 font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Risk of Ruin</span>
                <span className="text-red-600/80 font-black">
                    PROBABILITY ENGINE
                </span>
            </div>

            {/* Middle Gauge Visual */}
            <div className="flex-1 flex items-center justify-between z-10 py-1 gap-2">
                <div className="flex flex-col justify-center">
                    <span className="text-[8px] font-black text-slate-400 uppercase tracking-wider">
                        Win Rate: 45%
                    </span>
                    <span className="text-[10px] font-bold text-slate-700 mt-1 font-mono">
                        Risk:{" "}
                        <span className="text-red-500 font-extrabold">
                            {riskPerTrade}% / trade
                        </span>
                    </span>
                </div>

                <div className="flex flex-col items-center justify-center pr-2">
                    <span
                        className={`text-3xl font-black font-mono transition-colors duration-300 ${ruinProb > 50 ? "text-red-600 animate-pulse" : "text-emerald-600"}`}
                    >
                        {ruinProb.toFixed(1)}%
                    </span>
                    <span className="text-[7px] font-extrabold text-slate-500 uppercase tracking-wider mt-0.5">
                        Probability of Ruin
                    </span>
                </div>
            </div>

            {/* Status Bar */}
            <div className="z-10 border-t border-slate-100 pt-3 flex justify-between items-center text-[8px] font-bold text-slate-400 font-mono">
                <span>Capital Model</span>
                <span
                    className={`px-2 py-0.5 rounded-full text-[7px] uppercase font-black tracking-widest ${ruinProb > 50 ? "bg-red-50 text-red-600 border border-red-200" : "bg-emerald-50 text-emerald-600 border border-emerald-200"}`}
                >
                    {ruinProb > 50 ? "Guaranteed Ruin" : "Statistically Safe"}
                </span>
            </div>
        </div>
    );
}
