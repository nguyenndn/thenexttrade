"use client";

import React from "react";

const MATRIX_ROWS = [
    {
        label: "Sonic R",
        cells: ["BUY", "BUY", "SELL", "SELL", "SELL", "SELL", "SELL"],
    },
    {
        label: "Structure",
        cells: ["WAIT", "BUY", "BUY", "BUY", "BUY", "WAIT", "SELL"],
    },
    {
        label: "SuperTrend",
        cells: ["BUY", "BUY", "BUY", "BUY", "BUY", "SELL", "SELL"],
    },
    {
        label: "MACD",
        cells: ["WAIT", "BUY", "BUY", "BUY", "WAIT", "SELL", "SELL"],
    },
    {
        label: "ADX",
        cells: ["BUY", "BUY", "WAIT", "BUY", "WAIT", "SELL", "SELL"],
    },
    {
        label: "VOL-MOM",
        cells: ["WAIT", "WAIT", "WAIT", "BUY", "BUY", "WAIT", "WAIT"],
    },
] as const;

export function TabTrendView() {
    return (
        <div className="space-y-2 animate-in fade-in duration-200 w-full flex-1 flex flex-col justify-between">
            {/* Top Summary Card */}
            <div className="border border-slate-800 bg-[#090e17] p-2.5 rounded-[2px] space-y-2">
                <div className="grid grid-cols-[1.2fr_1fr_0.8fr] items-center gap-2">
                    <div className="space-y-1">
                        <div className="flex items-center gap-3 text-[10.5px] font-black">
                            <span className="text-white">CURRENT BIAS</span>
                            <span className="text-[#00e5a3]">▲ BUY</span>
                        </div>
                        <div className="text-[10px] font-black text-white">
                            5 UP · 2 DOWN · 0 RANGE
                        </div>
                    </div>

                    <div className="border-x border-slate-800 text-center space-y-1">
                        <div className="text-[10.5px] font-black text-white">
                            DAILY TREND
                        </div>
                        <div className="text-[11px] font-black text-[#ff4a5a]">
                            ▼ SELL
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <div className="flex h-11 w-11 flex-col items-center justify-center rounded-full border border-[#00e5a3] bg-[#072212]/40">
                            <span className="text-[10px] font-black text-[#00e5a3] leading-none">
                                BUY
                            </span>
                            <span className="mt-0.5 text-[9.5px] font-black text-white leading-none">
                                61%
                            </span>
                        </div>
                    </div>
                </div>

                {/* 7-Timeframe Confluence Spectrum Bar (5 green, 2 red) */}
                <div className="flex items-center gap-1.5">
                    <span className="text-[9.5px] font-black text-white">M1</span>
                    <div className="grid flex-1 grid-cols-7 gap-1 h-1.5">
                        <div className="bg-[#00c853]" />
                        <div className="bg-[#00c853]" />
                        <div className="bg-[#00c853]" />
                        <div className="bg-[#00c853]" />
                        <div className="bg-[#00c853]" />
                        <div className="bg-[#ff3b5c]" />
                        <div className="bg-[#ff3b5c]" />
                    </div>
                    <span className="text-[9.5px] font-black text-white">D1</span>
                </div>

                {/* Chart Signal & Equal-Weight Power Split */}
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-black">
                    <div className="border border-[#00e5a3]/60 bg-[#072212]/50 py-1 text-[#00e5a3] rounded-[2px]">
                        CHART: BUY
                    </div>
                    <div className="border border-[#00e5a3]/60 bg-[#072212]/50 py-1 text-[#00e5a3] rounded-[2px]">
                        BUY POWER: 61%
                    </div>
                    <div className="border border-[#ff4a5a]/60 bg-[#260a0c]/50 py-1 text-[#ff4a5a] rounded-[2px]">
                        SELL POWER: 39%
                    </div>
                </div>
            </div>

            {/* 42-Signal Multi-Timeframe Matrix (6 Indicators x 7 Timeframes) */}
            <div className="border border-slate-800 bg-[#090e17] p-1.5 rounded-[2px]">
                <div className="grid grid-cols-[72px_repeat(7,1fr)] text-center font-black text-white text-[9.5px] pb-1">
                    <span>TF</span>
                    <span>M1</span>
                    <span>M5</span>
                    <span>M15</span>
                    <span>M30</span>
                    <span>H1</span>
                    <span>H4</span>
                    <span>D1</span>
                </div>

                <div className="space-y-1">
                    {MATRIX_ROWS.map((row) => (
                        <div
                            key={row.label}
                            className="grid grid-cols-[72px_repeat(7,1fr)] items-center gap-1 text-center text-[9px] font-black"
                        >
                            <span className="text-white text-[9.5px]">
                                {row.label}
                            </span>
                            {row.cells.map((cell, idx) => {
                                const style =
                                    cell === "BUY"
                                        ? "border border-[#00c07f] bg-[#072212] text-[#00e5a3]"
                                        : cell === "SELL"
                                          ? "border border-[#ff4a5a] bg-[#260a0c] text-[#ff4a5a]"
                                          : "border border-slate-700/80 bg-[#161e2b] text-white";
                                return (
                                    <span
                                        key={idx}
                                        className={`py-1 rounded-[2px] ${style}`}
                                    >
                                        {cell}
                                    </span>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

