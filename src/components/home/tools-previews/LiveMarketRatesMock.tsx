"use client";

import { useState, useEffect } from "react";

export function LiveMarketRatesMock() {
    const [hovered, setHovered] = useState(false);
    const [eurusd, setEurusd] = useState(1.0852);
    const [xauusd, setXauusd] = useState(2320.45);
    const [btcusd, setBtcusd] = useState(67250);

    const [eurusdDirection, setEurusdDirection] = useState<
        "up" | "down" | null
    >(null);
    const [xauusdDirection, setXauusdDirection] = useState<
        "up" | "down" | null
    >(null);

    useEffect(() => {
        let interval: NodeJS.Timeout;
        if (hovered) {
            interval = setInterval(() => {
                // EURUSD fluctuation
                const eurUp = Math.random() > 0.5;
                setEurusdDirection(eurUp ? "up" : "down");
                setEurusd((prev) =>
                    parseFloat((prev + (eurUp ? 0.0003 : -0.0003)).toFixed(4))
                );

                // XAUUSD fluctuation
                const xauUp = Math.random() > 0.5;
                setXauusdDirection(xauUp ? "up" : "down");
                setXauusd((prev) =>
                    parseFloat((prev + (xauUp ? 0.8 : -0.8)).toFixed(2))
                );

                // Reset directions shortly after to clear flash classes
                setTimeout(() => {
                    setEurusdDirection(null);
                    setXauusdDirection(null);
                }, 200);
            }, 550);
        } else {
            setEurusd(1.0852);
            setXauusd(2320.45);
            setBtcusd(67250);
            setEurusdDirection(null);
            setXauusdDirection(null);
        }
        return () => clearInterval(interval);
    }, [hovered]);

    return (
        <div
            className="h-44 w-full bg-slate-50 dark:bg-slate-50 rounded-xl p-4 flex flex-col justify-between relative overflow-hidden border border-slate-200/80 select-none cursor-pointer"
            onMouseEnter={() => setHovered(true)}
            onMouseLeave={() => setHovered(false)}
        >
            {/* Decorative glow */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-2xl pointer-events-none" />

            {/* Header */}
            <div className="flex items-center justify-between z-10 font-mono text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                <span>Live Rates Ticker</span>
                <div className="flex items-center gap-1 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-[8px] text-emerald-600 font-extrabold uppercase tracking-wider">
                        TICK FEED
                    </span>
                </div>
            </div>

            {/* Rates Rows */}
            <div className="flex-1 flex flex-col justify-center gap-1.5 z-10 my-1 font-mono text-[9.5px] font-bold">
                {/* Row 1 */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-600">EUR/USD</span>
                    <span
                        className={`px-1.5 py-0.5 rounded transition-colors duration-200 ${eurusdDirection === "up" ? "bg-emerald-100 text-emerald-700" : eurusdDirection === "down" ? "bg-rose-100 text-rose-700" : "text-slate-800"}`}
                    >
                        {eurusd.toFixed(4)}
                    </span>
                </div>

                {/* Row 2 */}
                <div className="flex items-center justify-between border-b border-slate-100 pb-1">
                    <span className="text-slate-600">XAU/USD</span>
                    <span
                        className={`px-1.5 py-0.5 rounded transition-colors duration-200 ${xauusdDirection === "up" ? "bg-emerald-100 text-emerald-700" : xauusdDirection === "down" ? "bg-rose-100 text-rose-700" : "text-slate-800"}`}
                    >
                        ${xauusd.toFixed(2)}
                    </span>
                </div>

                {/* Row 3 */}
                <div className="flex items-center justify-between">
                    <span className="text-slate-600">BTC/USD</span>
                    <span className="text-slate-800 px-1.5 py-0.5 font-bold">
                        ${btcusd.toLocaleString()}
                    </span>
                </div>
            </div>

            {/* Footer */}
            <div className="text-[8px] font-bold text-slate-400 flex justify-between items-center z-10 border-t border-slate-100 pt-2 font-mono">
                <span>Latency: ~12ms</span>
                <span className={hovered ? "text-emerald-600 font-bold" : ""}>
                    {hovered ? "Rates Fluctuation Active" : "Rates Frozen"}
                </span>
            </div>
        </div>
    );
}
