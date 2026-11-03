"use client";

import React, { useState } from "react";

const DCA_STEP_ROWS = [
    { label: "Starting Lot", val: "0.05" },
    { label: "Multiplier", val: "1.50" },
    { label: "DCA Step (Pips)", val: "30" },
    { label: "Zone Range (Pips)", val: "142" },
    { label: "Target TP (0=Off)", val: "30" },
    { label: "Target SL (0=Off)", val: "100" },
    { label: "Max Single Lot", val: "0.50" },
    { label: "Max Basket Lot", val: "2.00" },
] as const;

export function TabSemiView() {
    const [beLotMode, setBeLotMode] = useState(false);
    const [mobileDca, setMobileDca] = useState(false);
    const [smartShield, setSmartShield] = useState(false);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-in fade-in duration-200 flex-1">
            {/* Left Box: SMART DCA & BE LOT */}
            <div className="border border-slate-800 bg-[#090e17] p-2.5 rounded-[2px] flex flex-col">
                <div>
                    <div className="mb-2 text-center text-[10.5px] font-black uppercase text-white">
                        SMART DCA &amp; BE LOT
                    </div>
                    <div
                        onClick={() => setBeLotMode(!beLotMode)}
                        className="mb-2.5 cursor-pointer select-none border border-slate-600 bg-[#1a2536] hover:bg-[#223046] py-1 text-center text-[9.5px] font-black uppercase text-white rounded-[2px] transition-colors"
                    >
                        {beLotMode
                            ? "MODE: BE LOT (RECOVERY)"
                            : "MODE: MARTINGALE MULTIPLIER"}
                    </div>
                </div>

                <div className="space-y-1.5">
                    {DCA_STEP_ROWS.map((row) => (
                        <div
                            key={row.label}
                            className="flex items-center justify-between gap-1 text-[9.5px]"
                        >
                            <span className="font-black text-white">
                                {row.label}
                            </span>
                            <div className="flex items-center gap-0.5">
                                <span className="cursor-pointer select-none border border-slate-700 bg-[#161e2b] hover:bg-slate-700 px-1.5 py-0.5 text-center font-black text-white rounded-[2px]">
                                    -
                                </span>
                                <span className="min-w-[54px] border border-slate-700 bg-[#080d15] py-0.5 text-center font-mono font-black text-[#00e5a3] rounded-[2px]">
                                    {row.val}
                                </span>
                                <span className="cursor-pointer select-none border border-slate-700 bg-[#161e2b] hover:bg-slate-700 px-1.5 py-0.5 text-center font-black text-white rounded-[2px]">
                                    +
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Box: DCA MONITOR & CONTROL */}
            <div className="border border-slate-800 bg-[#090e17] p-2.5 rounded-[2px] flex flex-col justify-between">
                <div className="space-y-1.5">
                    <div className="mb-2 text-center text-[10.5px] font-black uppercase text-white">
                        DCA MONITOR &amp; CONTROL
                    </div>

                    <div className="grid grid-cols-[92px_1fr] items-center gap-1 text-[9.5px]">
                        <span className="font-black text-white">Mobile DCA:</span>
                        <div
                            onClick={() => setMobileDca(!mobileDca)}
                            className={`cursor-pointer select-none py-0.5 text-center font-black uppercase rounded-[2px] transition-colors ${
                                mobileDca
                                    ? "bg-[#1b7a34] text-white"
                                    : "bg-[#6c7686] text-white"
                            }`}
                        >
                            {mobileDca ? "MOBILE DCA: ON" : "MOBILE DCA: OFF"}
                        </div>
                    </div>

                    {[
                        { label: "Grid Status:", val: "LOCKED (DUPLICATE)", color: "text-[#ff4a5a]" },
                        { label: "Active Orders:", val: "0 (0.00 Lots)", color: "text-white" },
                        { label: "Current PnL:", val: "$0.00", color: "text-white" },
                        { label: "Combined TP:", val: "NONE", color: "text-white" },
                        { label: "Zone Status:", val: "NO ZONE (UNLIMITED)", color: "text-white" },
                        { label: "Next Lot Est:", val: "0.05 Lots (Base)", color: "text-white" },
                    ].map((row) => (
                        <div
                            key={row.label}
                            className="grid grid-cols-[92px_1fr] items-center gap-1 text-[9.5px]"
                        >
                            <span className="font-black text-white">{row.label}</span>
                            <span className={`font-black ${row.color}`}>{row.val}</span>
                        </div>
                    ))}
                </div>

                {/* Zone, Smart Shield & DCA Execution Controls */}
                <div className="mt-2 space-y-1">
                    <div className="grid grid-cols-2 gap-1 text-[9px] font-black uppercase">
                        <div className="cursor-pointer select-none bg-[#1b7a34] hover:bg-[#15632a] py-1 text-center text-white rounded-[2px]">
                            TRADE BY ZONE
                        </div>
                        <div className="cursor-pointer select-none bg-[#1b7a34] hover:bg-[#15632a] py-1 text-center text-white rounded-[2px]">
                            DEL ZONE ON BREAK
                        </div>
                    </div>

                    <div
                        onClick={() => setSmartShield(!smartShield)}
                        className={`cursor-pointer select-none py-1 text-center text-[9.5px] font-black uppercase rounded-[2px] transition-colors ${
                            smartShield
                                ? "bg-[#008a2e] text-white"
                                : "bg-[#3d4756] text-slate-300"
                        }`}
                    >
                        {smartShield ? "SMART SHIELD: ON" : "SMART SHIELD: OFF"}
                    </div>

                    <div className="grid grid-cols-2 gap-1 text-[10px] font-black uppercase">
                        <div className="cursor-pointer select-none bg-[#1b7a34] hover:bg-[#15632a] py-1 text-center text-white rounded-[2px]">
                            BUY ↑
                        </div>
                        <div className="cursor-pointer select-none bg-[#b72830] hover:bg-[#9c2027] py-1 text-center text-white rounded-[2px]">
                            SELL ↓
                        </div>
                    </div>

                    <div className="cursor-pointer select-none bg-[#d96b1f] hover:bg-[#bf5c17] py-1.5 text-center text-[10px] font-black uppercase text-white rounded-[2px]">
                        CLOSE ALL DCA
                    </div>
                </div>
            </div>
        </div>
    );
}

