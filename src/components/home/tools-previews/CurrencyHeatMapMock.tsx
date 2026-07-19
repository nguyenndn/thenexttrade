"use client";

import { useState } from "react";

export function CurrencyHeatMapMock() {
    const [hovered, setHovered] = useState(false);

    const currencies = [
        {
            name: "USD",
            strength: 3.2,
            color: "bg-emerald-500",
            barWidth: "85%",
        },
        {
            name: "EUR",
            strength: 1.8,
            color: "bg-emerald-400/70",
            barWidth: "60%",
        },
        {
            name: "GBP",
            strength: -0.6,
            color: "bg-rose-400/70",
            barWidth: "40%",
        },
        { name: "JPY", strength: -2.8, color: "bg-rose-500", barWidth: "75%" },
    ];

    const hoveredWidths = ["95%", "75%", "30%", "85%"];

    return (
        <div
            className="h-44 w-full bg-[#fdfbf7] dark:bg-[#fdfbf7] rounded-xl p-4 flex flex-col justify-between relative overflow-hidden border border-slate-200/60 select-none cursor-pointer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between z-10 font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Currency Strength Map</span>
                <span className="text-emerald-600/80 font-black">
                    24H TIMEFRAME
                </span>
            </div>

            {/* Strength Bars */}
            <div className="flex-1 flex flex-col justify-center gap-1.5 z-10 my-1 font-mono text-[8.5px] font-bold">
                {currencies.map((curr, idx) => (
                    <div key={curr.name} className="flex items-center gap-2">
                        <span className="w-8 text-slate-600">{curr.name}</span>
                        <div className="flex-1 h-2 bg-slate-200/70 rounded-full overflow-hidden">
                            <div
                                className={`h-full ${curr.color} rounded-full transition-all duration-500 ease-out`}
                                style={{
                                    width: hovered
                                        ? hoveredWidths[idx]
                                        : curr.barWidth,
                                }}
                            />
                        </div>
                        <span
                            className={`w-8 text-right font-black ${curr.strength >= 0 ? "text-emerald-600" : "text-rose-600"}`}
                        >
                            {curr.strength >= 0 ? "+" : ""}
                            {hovered
                                ? (curr.strength * 1.25).toFixed(1)
                                : curr.strength.toFixed(1)}
                            %
                        </span>
                    </div>
                ))}
            </div>

            {/* Footer */}
            <div className="text-[8px] font-bold text-slate-400 flex justify-between items-center z-10 border-t border-slate-100 pt-2 font-mono">
                <span>Currencies Tracked: 8</span>
                <span>Auto-ranking sorted</span>
            </div>
        </div>
    );
}
