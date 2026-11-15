"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { HISTOGRAM_BARS } from "./trade-manager-data";

export function TabSdZoneView() {
    const [selectedTf, setSelectedTf] = useState("M1");
    const [vpEnabled, setVpEnabled] = useState(false);
    const [obEnabled, setObEnabled] = useState(false);

    return (
        <div className="animate-in fade-in duration-200 w-full flex-1 flex flex-col justify-between">
            {/* Top Toolbar: 5 SUPPLY / 5 DEMAND, M1-H4, VP OFF, OB OFF */}
            <div className="flex flex-wrap items-center justify-between gap-1.5 border-b border-slate-800 pb-2">
                <div className="flex items-center gap-3 text-[10.5px] font-black uppercase">
                    <div>
                        <span className="text-[#ff4757] mr-1">5</span>
                        <span className="text-white">SUPPLY</span>
                    </div>
                    <div>
                        <span className="text-[#2ecc71] mr-1">5</span>
                        <span className="text-white">DEMAND</span>
                    </div>
                </div>

                <div className="flex items-center gap-1">
                    {["M1", "M5", "M15", "M30", "H1", "H4"].map((tf) => (
                        <Button
                            key={tf}
                            type="button"
                            variant="ghost"
                            onClick={() => setSelectedTf(tf)}
                            className={`h-auto px-2 py-0.5 text-[10px] font-black rounded-[2px] ${
                                selectedTf === tf
                                    ? "border border-[#2196f3] bg-[#16365c] text-white hover:bg-[#1c4370]"
                                    : "border border-[#2b3545] bg-[#121822] text-white hover:border-slate-500"
                            }`}
                        >
                            {tf}
                        </Button>
                    ))}
                </div>

                <div className="flex items-center gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setVpEnabled((v) => !v)}
                        className={`h-auto px-2.5 py-0.5 text-[10px] font-black uppercase rounded-[2px] ${
                            vpEnabled
                                ? "border border-[#00d4ff] bg-[#0c2d3e] text-[#00d4ff]"
                                : "border border-[#3a4556] bg-[#171e29] text-white hover:bg-[#1f2836]"
                        }`}
                    >
                        {vpEnabled ? "VP ON" : "VP OFF"}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setObEnabled((v) => !v)}
                        className={`h-auto px-2.5 py-0.5 text-[10px] font-black uppercase rounded-[2px] ${
                            obEnabled
                                ? "border border-[#2ecc71] bg-[#0c2e1f] text-[#2ecc71]"
                                : "border border-[#3a4556] bg-[#171e29] text-white hover:bg-[#1f2836]"
                        }`}
                    >
                        {obEnabled ? "OB ON" : "OB OFF"}
                    </Button>
                </div>
            </div>

            <div className="my-1.5 text-center text-[10.5px] font-black uppercase tracking-wide text-[#fbbf24]">
                INSTITUTIONAL VOLUME PROFILE &amp; POC MAGNET
            </div>

            {/* 3 Institutional Volume Profile Bars */}
            <div className="space-y-1.5">
                <div className="relative flex items-center justify-between border border-[#8a6d1f] bg-[#211b0c] px-3 py-1.5 pl-3.5 text-[10px] font-black text-[#fbbf24]">
                    <span className="absolute left-0 top-0 h-full w-1.5 bg-[#fbbf24]" />
                    <span>DAILY POC (MAGNET): 3878.77 (-30 pips)</span>
                    <span className="text-[9px] text-[#fde68a]">[ HIGH ATTRACTION ]</span>
                </div>
                <div className="relative flex items-center justify-between border border-[#6e2432] bg-[#241016] px-3 py-1.5 pl-3.5 text-[10px] font-black text-[#ff6b7a]">
                    <span className="absolute left-0 top-0 h-full w-1.5 bg-[#f0475c]" />
                    <span>VAH (Value Area High): 3899.30 (+175 pips)</span>
                    <span className="text-[9px] text-[#fbbf24]">[ OB + VAH CONFLUENCE ]</span>
                </div>
                <div className="relative flex items-center justify-between border border-[#1a6642] bg-[#0b2318] px-3 py-1.5 pl-3.5 text-[10px] font-black text-[#2ecc71]">
                    <span className="absolute left-0 top-0 h-full w-1.5 bg-[#2ecc71]" />
                    <span>VAL (Value Area Low): 3874.81 (-70 pips)</span>
                    <span className="text-[9px] text-[#fbbf24]">[ OB + VAL CONFLUENCE ]</span>
                </div>
            </div>

            {/* Live Volume Profile Distribution Deck */}
            <div className="mt-2 border border-[#1e293b] bg-[#0a101a] p-2 rounded-[2px]">
                <div className="mb-1 flex items-center justify-between text-[9.5px] font-black">
                    <span className="text-[#00d4ff] uppercase">AUCTION: INSIDE VALUE AREA</span>
                    <span className="text-slate-400">High: 3923.07 | Low: 3867.61</span>
                </div>

                <div className="relative h-20 w-full flex items-end gap-[1px] pt-3 px-1 border-b border-slate-800">
                    <div className="absolute left-[15%] top-0.5 bottom-0 w-px bg-[#2ecc71] z-20">
                        <span className="-ml-7 border border-[#2ecc71]/80 bg-[#0b121c] px-1 py-0.5 text-[7.5px] font-black text-[#2ecc71]">VAL</span>
                    </div>
                    <div className="absolute left-[26%] top-0.5 bottom-0 w-px bg-white z-20">
                        <span className="-ml-3 border border-slate-400 bg-[#0b121c] px-1 py-0.5 text-[7.5px] font-black text-white top-4 relative">BID</span>
                    </div>
                    <div className="absolute left-[56%] top-0.5 bottom-0 w-px bg-[#f0475c] z-20">
                        <span className="ml-1 border border-[#f0475c]/80 bg-[#0b121c] px-1 py-0.5 text-[7.5px] font-black text-[#ff6b7a]">VAH</span>
                    </div>

                    {HISTOGRAM_BARS.map((heightPct, idx) => {
                        const isPoc = idx === 8;
                        const inValueArea = idx >= 6 && idx <= 23;
                        return (
                            <div
                                key={idx}
                                style={{ height: `${heightPct}%` }}
                                className={`flex-1 ${isPoc ? "bg-[#f5b014] relative z-10" : inValueArea ? "bg-[#1967a8]" : "bg-[#172230]"}`}
                            >
                                {isPoc && (
                                    <span className="absolute -top-3 -left-1.5 border border-[#f5b014] bg-[#0b121c] px-1 py-0.5 text-[7.5px] font-black text-[#fbbf24]">POC</span>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="mt-2 grid grid-cols-2 gap-2">
                <Button type="button" variant="ghost" className="h-auto border border-[#b8860b] bg-[#241c0c] hover:bg-[#322710] py-1.5 text-[10.5px] font-black uppercase text-[#fbbf24] rounded-[2px]">SNAP TP TO POC</Button>
                <Button type="button" variant="ghost" className="h-auto border border-[#0e7490] bg-[#08222e] hover:bg-[#0d3142] py-1.5 text-[10.5px] font-black uppercase text-[#00d4ff] rounded-[2px]">LIMIT AT VALUE AREA</Button>
            </div>

            <div className="mt-1 text-center text-[8.5px] font-semibold text-slate-400">
                Institutional Auction Market Theory | Real-Time Volume Distribution
            </div>
        </div>
    );
}
