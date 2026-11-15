"use client";

import React from "react";

const MATRIX_ROWS = [
    {
        label: "Sonic R",
        cells: ["BUY", "SELL", "SELL", "SELL", "SELL", "SELL", "SELL"],
    },
    {
        label: "Structure",
        cells: ["BUY", "BUY", "SELL", "SELL", "SELL", "SELL", "SELL"],
    },
    {
        label: "SuperTrend",
        cells: ["BUY", "SELL", "SELL", "SELL", "SELL", "SELL", "SELL"],
    },
    {
        label: "MACD",
        cells: ["BUY", "BUY", "WAIT", "WAIT", "WAIT", "SELL", "WAIT"],
    },
    {
        label: "ADX",
        cells: ["BUY", "WAIT", "SELL", "SELL", "SELL", "SELL", "WAIT"],
    },
    {
        label: "VOL-MOM",
        cells: ["WAIT", "WAIT", "WAIT", "WAIT", "WAIT", "WAIT", "WAIT"],
    },
] as const;

export function TabTrendView() {
    return (
        <div className="space-y-2 animate-in fade-in duration-200 w-full flex-1 flex flex-col justify-between">
            {/* Top Summary Card */}
            <div className="border border-[#232c3b] bg-[#111620] p-2.5 rounded-[4px] space-y-2">
                <div className="grid grid-cols-[1.25fr_1fr_0.8fr] items-center gap-2">
                    <div className="space-y-1.5">
                        <div className="flex items-center gap-3 text-[10.5px] font-black">
                            <span className="text-white">CURRENT BIAS</span>
                            <span className="text-[#ff4757]">▼ SELL</span>
                        </div>
                        <div className="text-[10px] font-black text-white">
                            1 UP · 5 DOWN · 1 RANGE
                        </div>
                    </div>

                    <div className="border-x border-[#232c3b] text-center space-y-1.5">
                        <div className="text-[10.5px] font-black text-white">
                            DAILY TREND
                        </div>
                        <div className="text-[11px] font-black text-[#ff4757]">
                            ▼ SELL
                        </div>
                    </div>

                    <div className="flex justify-center">
                        <div className="flex h-11 w-11 flex-col items-center justify-center rounded-full border border-[#ff4757] bg-[#1e1015]">
                            <span className="text-[10px] font-black text-[#ff4757] leading-none">
                                SELL
                            </span>
                            <span className="mt-0.5 text-[9.5px] font-black text-white leading-none">
                                76%
                            </span>
                        </div>
                    </div>
                </div>

                {/* 7-Timeframe Confluence Spectrum Bar (1 UP green, 1 RANGE blue, 5 DOWN red) */}
                <div className="flex items-center gap-1.5">
                    <span className="text-[9.5px] font-black text-white">M1</span>
                    <div className="grid flex-1 grid-cols-7 gap-1 h-1">
                        <div className="bg-[#00c86f]" />
                        <div className="bg-[#2e86de]" />
                        <div className="bg-[#eb3b5a]" />
                        <div className="bg-[#eb3b5a]" />
                        <div className="bg-[#eb3b5a]" />
                        <div className="bg-[#eb3b5a]" />
                        <div className="bg-[#eb3b5a]" />
                    </div>
                    <span className="text-[9.5px] font-black text-white">D1</span>
                </div>

                {/* Chart Signal & Power Split */}
                <div className="grid grid-cols-3 gap-2 text-center text-[10px] font-black">
                    <div className="border border-[#00c86f] bg-[#0b221a] py-1 text-[#00d67f] rounded-[2px]">
                        CHART: BUY
                    </div>
                    <div className="border border-[#00c86f] bg-[#0b221a] py-1 text-[#00d67f] rounded-[2px]">
                        BUY POWER: 24%
                    </div>
                    <div className="border border-[#eb3b5a] bg-[#281016] py-1 text-[#ff4757] rounded-[2px]">
                        SELL POWER: 76%
                    </div>
                </div>
            </div>

            {/* 42-Signal Multi-Timeframe Matrix */}
            <div className="border border-[#232c3b] bg-[#111620] p-2 rounded-[4px]">
                <div className="grid grid-cols-[74px_repeat(7,1fr)] text-center font-black text-white text-[9.5px] pb-1.5">
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
                            className="grid grid-cols-[74px_repeat(7,1fr)] items-center gap-1 text-center text-[9px] font-black"
                        >
                            <span className="text-white text-[9.5px]">
                                {row.label}
                            </span>
                            {row.cells.map((cell, idx) => {
                                const style =
                                    cell === "BUY"
                                        ? "border border-[#00c86f] bg-[#0b221a] text-[#00d67f]"
                                        : cell === "SELL"
                                          ? "border border-[#eb3b5a] bg-[#281016] text-[#ff4757]"
                                          : "border border-[#2b3545] bg-[#18202c] text-white";
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
