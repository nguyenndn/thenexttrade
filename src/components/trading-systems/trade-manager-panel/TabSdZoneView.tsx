"use client";

import React, { useState } from "react";

const HISTOGRAM_BARS = [
    4, 4, 4, 4, 4, 6, 12, 18, 36, 62, 85, 100, 92, 82, 68, 52, 48, 42, 34, 24,
    18, 12, 14, 14, 12, 8, 6, 4, 4, 4, 6, 8, 12, 10, 8, 6, 6, 6, 4, 4, 4, 4,
];

export function TabSdZoneView() {
    const [selectedTf, setSelectedTf] = useState("M1");
    const [obEnabled, setObEnabled] = useState(false);

    return (
        <div className="animate-in fade-in duration-200 w-full flex-1 flex flex-col justify-between">
            {/* Top Toolbar: Supply/Demand Counter, M1-H4 Selector, OB Toggle */}
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-3 text-[10.5px] font-black uppercase">
                    <div>
                        <span className="text-[#ff3b5c] mr-1">0</span>
                        <span className="text-white">SUPPLY</span>
                    </div>
                    <div>
                        <span className="text-[#00e5a3] mr-1">0</span>
                        <span className="text-white">DEMAND</span>
                    </div>
                </div>

                <div className="flex items-center gap-1 select-none">
                    {["M1", "M5", "M15", "M30", "H1", "H4"].map((tf) => (
                        <div
                            key={tf}
                            onClick={() => setSelectedTf(tf)}
                            className={`cursor-pointer border px-2 py-0.5 text-[10px] font-black transition-colors rounded-[2px] ${
                                selectedTf === tf
                                    ? "border-[#1e88e5] bg-[#153456] text-white"
                                    : "border-slate-700 bg-[#0d1420] text-white hover:border-slate-500"
                            }`}
                        >
                            {tf}
                        </div>
                    ))}
                </div>

                <div
                    onClick={() => setObEnabled(!obEnabled)}
                    className={`cursor-pointer select-none border px-3 py-0.5 text-[10px] font-black uppercase rounded-[2px] transition-colors ${
                        obEnabled
                            ? "border-[#00e5a3] bg-[#07261a] text-[#00e5a3]"
                            : "border-slate-600 bg-[#141c28] text-white"
                    }`}
                >
                    {obEnabled ? "OB ON" : "OB OFF"}
                </div>
            </div>

            {/* Section Title */}
            <div className="my-1.5 text-center text-[10.5px] font-black uppercase tracking-wide text-[#ffd21f]">
                INSTITUTIONAL VOLUME PROFILE &amp; POC MAGNET
            </div>

            {/* 3 Institutional Volume Profile Bars */}
            <div className="space-y-1.5">
                <div className="relative flex items-center justify-between border border-[#ffd21f]/40 bg-[#1f1a0d] px-3 py-1.5 pl-3.5 text-[10px] font-black text-[#ffd21f]">
                    <span className="absolute left-0 top-0 h-full w-1.5 bg-[#ffd21f]" />
                    <span>DAILY POC (MAGNET): 3900.36 (-568 pips)</span>
                    <span className="text-[9.5px]">[ HIGH ATTRACTION ]</span>
                </div>

                <div className="relative flex items-center justify-between border border-[#ff4a5a]/40 bg-[#241016] px-3 py-1.5 pl-3.5 text-[10px] font-black text-[#ff6b7a]">
                    <span className="absolute left-0 top-0 h-full w-1.5 bg-[#ff4a5a]" />
                    <span>VAH (Value Area High): 3942.97 (-142 pips)</span>
                    <span className="text-[9.5px]">[ Strong Rejection Wall ]</span>
                </div>

                <div className="relative flex items-center justify-between border border-[#00e5a3]/40 bg-[#0a2319] px-3 py-1.5 pl-3.5 text-[10px] font-black text-[#2CE59B]">
                    <span className="absolute left-0 top-0 h-full w-1.5 bg-[#00e5a3]" />
                    <span>VAL (Value Area Low): 3879.88 (-773 pips)</span>
                    <span className="text-[9.5px]">[ Strong Support Wall ]</span>
                </div>
            </div>

            {/* Live Volume Profile Distribution Deck */}
            <div className="mt-2 border border-slate-800 bg-[#090e17] p-2 rounded-[2px]">
                <div className="mb-1 flex items-center justify-between text-[9px] font-black">
                    <span className="text-[#ff5c6c] uppercase">
                        AUCTION: ABOVE VAH (EXPANSION)
                    </span>
                    <span className="text-slate-400">
                        High: 3965.11 | Low: 3879.88
                    </span>
                </div>

                <div className="relative h-20 w-full flex items-end gap-[1px] pt-3 px-1 border-b border-slate-800">
                    {/* VAL Marker */}
                    <div className="absolute left-1 top-1 bottom-0 w-px bg-[#00e5a3] z-10">
                        <span className="pl-1 text-[7.5px] font-black text-[#00e5a3]">VAL</span>
                    </div>
                    {/* VAH Marker */}
                    <div className="absolute left-[73%] top-1 bottom-0 w-px bg-[#ff4a5a] z-10">
                        <span className="pl-1 text-[7.5px] font-black text-[#ff4a5a]">VAH</span>
                    </div>
                    {/* Live BID Marker */}
                    <div className="absolute left-[90%] top-1 bottom-0 w-px bg-white z-10">
                        <span className="-ml-2 bg-[#090e17] px-0.5 text-[7.5px] font-black text-white">BID</span>
                    </div>

                    {HISTOGRAM_BARS.map((heightPct, idx) => {
                        const isPoc = idx === 11;
                        return (
                            <div
                                key={idx}
                                style={{ height: `${heightPct}%` }}
                                className={`flex-1 ${
                                    isPoc ? "bg-[#ffd21f] relative z-10" : "bg-[#226699]"
                                }`}
                            >
                                {isPoc && (
                                    <span className="absolute -top-2.5 -left-1 text-[7.5px] font-black text-[#ffd21f]">
                                        POC
                                    </span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 1-Click Value Area Action Buttons */}
            <div className="mt-2 grid grid-cols-2 gap-2">
                <div className="cursor-pointer select-none border border-[#ffd21f]/60 bg-[#261f0e] hover:bg-[#332a12] py-1.5 text-center text-[10.5px] font-black uppercase text-[#ffd21f] rounded-[2px] transition-colors">
                    SNAP TP TO POC
                </div>
                <div className="cursor-pointer select-none border border-[#00c0ff]/60 bg-[#082233] hover:bg-[#0c2f47] py-1.5 text-center text-[10.5px] font-black uppercase text-[#00d4ff] rounded-[2px] transition-colors">
                    LIMIT AT VALUE AREA
                </div>
            </div>

            <div className="mt-1 text-center text-[8.5px] font-semibold text-slate-400">
                Institutional Auction Market Theory | Real-Time Volume Distribution
            </div>
        </div>
    );
}

