"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { TradeRrPreviewBar } from "./TradeRrPreviewBar";
import { EXEC_BUTTONS, INITIAL_PRICE_ROWS } from "./trade-manager-data";

export function TabTradeView() {
    const [lotSize, setLotSize] = useState(0.07);
    const [sellPnl, setSellPnl] = useState(3929.37);
    const [openLots, setOpenLots] = useState(0.28);
    const [openPos, setOpenPos] = useState(4);

    const stepLot = (delta: number) => {
        setLotSize((prev) => Math.max(0.01, Number((prev + delta).toFixed(2))));
    };

    return (
        <div className="animate-in fade-in duration-200 w-full flex-1 flex flex-col justify-between">
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-[1.02fr_1.06fr_1.18fr]">
                {/* Left column: SL, ENTRY, TP1-TP3 */}
                <div className="flex flex-col justify-between gap-1.5 h-full">
                    {INITIAL_PRICE_ROWS.map((row) => (
                        <div
                            key={row.label}
                            className={`relative flex min-h-[30px] items-center justify-between border ${row.box} px-3 pl-4 rounded-[5px] overflow-hidden`}
                        >
                            <span className={`absolute left-0 top-0.5 bottom-0.5 w-1.5 rounded-r-[3px] ${row.bar}`} />
                            <span className={`font-black ${row.text} text-[10.5px]`}>{row.label}</span>
                            <span className="font-black text-white font-mono text-[11px] tabular-nums">{row.value}</span>
                        </div>
                    ))}
                </div>

                {/* Middle column: Lot Size, Zone, Max Risk, BE Offset, SL Loss */}
                <div className="space-y-1.5 bg-[#121722] p-2.5 border border-[#232c3b] rounded-[5px] flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-1 min-h-6">
                        <span className="whitespace-nowrap font-black text-[#fbbf24] text-[10.5px]">Lot Size:</span>
                        <div className="flex items-center gap-1.5">
                            <Button
                                type="button"
                                variant="ghost"
                                aria-label="Decrease lot size"
                                onClick={() => stepLot(-0.01)}
                                className="h-6 w-5 p-0 rounded-[2px] border border-[#333e52] bg-[#1c2331] text-[#f59e0b] font-bold hover:bg-[#263042] text-[11px]"
                            >
                                -
                            </Button>
                            <span className="text-white font-mono font-black px-1 text-[11px] text-center min-w-[34px] tabular-nums">
                                {lotSize.toFixed(2)}
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                aria-label="Increase lot size"
                                onClick={() => stepLot(0.01)}
                                className="h-6 w-5 p-0 rounded-[2px] border border-[#333e52] bg-[#1c2331] text-[#f59e0b] font-bold hover:bg-[#263042] text-[11px]"
                            >
                                +
                            </Button>
                        </div>
                    </div>

                    {[
                        { label: "Zone (pips):", value: "70" },
                        { label: "Max Risk:", value: "50.0%" },
                        { label: "BE Offset:", value: "0" },
                    ].map((item) => (
                        <div key={item.label} className="flex min-h-6 items-center justify-between gap-2">
                            <span className="font-black text-[#fbbf24] text-[10.5px]">{item.label}</span>
                            <span className="border border-[#333e52] bg-[#171e2b] text-white font-mono font-black px-3 py-0.5 rounded-[2px] text-[10.5px] text-center min-w-[68px] tabular-nums">
                                {item.value}
                            </span>
                        </div>
                    ))}

                    <div className="flex min-h-6 items-center justify-between gap-2">
                        <span className="font-black text-[#fbbf24] text-[10.5px]">SL Loss:</span>
                        <span className="font-black text-[#ff2a3a] text-[11px] text-center min-w-[68px] font-mono tabular-nums">
                            0.00%
                        </span>
                    </div>
                </div>

                {/* Right column: 1-Click Execution Deck */}
                <div className="grid grid-cols-2 gap-1.5">
                    {EXEC_BUTTONS.map((btn) => (
                        <Button
                            key={btn.label}
                            type="button"
                            variant="ghost"
                            className={`${btn.cls} ${btn.span || "py-1.5 text-[9.5px]"} h-auto min-h-[28px] px-1 text-center font-black uppercase whitespace-nowrap rounded-[3px]`}
                        >
                            {btn.label}
                        </Button>
                    ))}
                </div>
            </div>

            <TradeRrPreviewBar slUsd="$0.00" tp1Usd="$0.00" tp2Usd="$0.00" tp3Usd="$0.00" />

            {/* Partial Close & Fast Exit Row */}
            <div className="mt-2 flex items-center gap-1.5">
                <div className="flex items-center gap-1.5 text-white font-black text-[10px] uppercase whitespace-nowrap shrink-0">
                    <span>TP %:</span>
                    <span className="border border-[#333e52] bg-[#151c28] text-white font-mono font-black px-2.5 py-1 rounded-[2px] text-[10.5px] text-center">
                        20
                    </span>
                </div>
                <div className="h-5 w-px bg-slate-600 mx-0.5" />
                <div className="grid grid-cols-4 gap-1.5 w-full">
                    <Button type="button" variant="ghost" className="h-auto bg-[#05821a] hover:bg-[#046c15] py-1.5 px-1 text-[9.5px] font-black text-white rounded-[3px]">TP BUY</Button>
                    <Button type="button" variant="ghost" onClick={() => setSellPnl((v) => Number((v * 0.8).toFixed(2)))} className="h-auto bg-[#eb1414] hover:bg-[#c91010] py-1.5 px-1 text-[9.5px] font-black text-white rounded-[3px]">TP SELL</Button>
                    <Button type="button" variant="ghost" className="h-auto bg-[#f08c00] hover:bg-[#d47b00] py-1.5 px-1 text-[9.5px] font-black text-white rounded-[3px]">SL -&gt; BE</Button>
                    <Button type="button" variant="ghost" onClick={() => { setSellPnl(0); setOpenLots(0); setOpenPos(0); }} className="h-auto bg-[#e84152] hover:bg-[#cf3444] py-1.5 px-1 text-[9.5px] font-black text-white rounded-[3px]">CLOSE ALL</Button>
                </div>
            </div>

            {/* Bottom Telemetry Bar */}
            <div className="mt-2.5 grid grid-cols-4 divide-x divide-slate-700/80 border border-[#1e293b] bg-[#111824] py-1.5 text-center text-[10.5px] font-mono tabular-nums rounded-[2px]">
                <div className="font-black text-[#2ecc71]">BUY: +$0.00</div>
                <div className="font-black text-[#2ecc71]">{`SELL: +$${sellPnl.toFixed(2)}`}</div>
                <div className="font-black text-white">{`${openLots.toFixed(2)} LOTS`}</div>
                <div className="font-black text-white">{`${openPos} POS`}</div>
            </div>
        </div>
    );
}
