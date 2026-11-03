"use client";

import React, { useState } from "react";

export function TabTradeView() {
    const [lotSize, setLotSize] = useState(0.07);

    const stepLot = (delta: number) => {
        setLotSize((prev) => Math.max(0.01, Number((prev + delta).toFixed(2))));
    };

    const priceRows = [
        { label: "SL:", value: "3947.74", bar: "bg-[#ff3b5c]", text: "text-[#ff3b5c]" },
        { label: "ENTRY:", value: "3958.74", bar: "bg-[#00c0ff]", text: "text-[#00c0ff]" },
        { label: "TP1:", value: "3963.74", qty: "3", bar: "bg-[#00e5a3]", text: "text-[#00e5a3]" },
        { label: "TP2:", value: "3968.74", qty: "3", bar: "bg-[#00e5a3]", text: "text-[#00e5a3]" },
        { label: "TP3:", value: "3978.74", qty: "3", bar: "bg-[#00e5a3]", text: "text-[#00e5a3]" },
    ];

    return (
        <div className="animate-in fade-in duration-200 w-full flex-1 flex flex-col justify-between">
            <div className="grid gap-2 grid-cols-1 sm:grid-cols-[1.08fr_1fr_1.14fr]">
                {/* Left column: SL, Entry, TP1-TP3 */}
                <div className="flex flex-col justify-between gap-1 h-full">
                    {priceRows.map((row) => (
                        <div
                            key={row.label}
                            className="relative grid grid-cols-[54px_1fr_24px] min-h-7 items-center border border-slate-700/80 bg-[#090e17] px-2 pl-2.5 rounded-[2px]"
                        >
                            <span className={`absolute left-0 top-0 h-full w-1 ${row.bar}`} />
                            <span className={`font-black ${row.text} text-left text-[10px]`}>
                                {row.label}
                            </span>
                            <span className="font-bold text-white text-center font-mono text-[10.5px]">
                                {row.value}
                            </span>
                            {row.qty ? (
                                <span className="border-l border-slate-700/80 pl-1.5 font-bold text-white text-center font-mono text-[10.5px]">
                                    {row.qty}
                                </span>
                            ) : (
                                <span />
                            )}
                        </div>
                    ))}
                </div>

                {/* Middle column: Lot Size, Zone, Max Risk, BE Offset, SL Loss */}
                <div className="space-y-1.5 bg-[#090e17] p-2 border border-slate-800 rounded-[2px] flex flex-col justify-between">
                    <div className="flex items-center justify-between gap-1 min-h-6">
                        <span className="whitespace-nowrap font-black text-[#ffd21f] text-[10px]">
                            Lot Size:
                        </span>
                        <div className="flex items-center gap-1">
                            <span
                                onClick={() => stepLot(-0.01)}
                                className="border border-slate-700 bg-[#161e2b] px-1.5 py-0.5 text-[#ffd21f] font-bold select-none hover:bg-slate-700 cursor-pointer rounded-[2px] text-[10px]"
                            >
                                -
                            </span>
                            <span className="border border-slate-700 bg-[#080d15] text-white font-mono font-bold px-2 py-0.5 rounded-[2px] text-[10px] text-center min-w-[42px]">
                                {lotSize.toFixed(2)}
                            </span>
                            <span
                                onClick={() => stepLot(0.01)}
                                className="border border-slate-700 bg-[#161e2b] px-1.5 py-0.5 text-[#ffd21f] font-bold select-none hover:bg-slate-700 cursor-pointer rounded-[2px] text-[10px]"
                            >
                                +
                            </span>
                        </div>
                    </div>
                    {[
                        { label: "Zone (pips):", value: "70", isBox: true, color: "text-white" },
                        { label: "Max Risk:", value: "50.0%", isBox: true, color: "text-white" },
                        { label: "BE Offset:", value: "0", isBox: true, color: "text-white" },
                        { label: "SL Loss:", value: "0.33%", isBox: false, color: "text-[#ff3b5c]" },
                    ].map((item) => (
                        <div key={item.label} className="flex min-h-6 items-center justify-between gap-2">
                            <span className="font-black text-[#ffd21f] text-[10px]">{item.label}</span>
                            {item.isBox ? (
                                <span className={`border border-slate-700 bg-[#080d15] ${item.color} font-mono font-bold px-3 py-0.5 rounded-[2px] text-[10px] text-center min-w-[66px]`}>
                                    {item.value}
                                </span>
                            ) : (
                                <span className={`font-black ${item.color} text-[11px] text-center min-w-[66px] font-mono`}>
                                    {item.value}
                                </span>
                            )}
                        </div>
                    ))}
                </div>

                {/* Right column: 1-Click Execution Deck */}
                <div className="grid grid-cols-2 gap-1">
                    {[
                        { label: "GET BUY", cls: "bg-[#1c2431] hover:bg-[#253041] border border-slate-700 text-white", span: "" },
                        { label: "GET SELL", cls: "bg-[#1c2431] hover:bg-[#253041] border border-slate-700 text-white", span: "" },
                        { label: "BUY NOW ↑", cls: "bg-[#1e88e5] hover:bg-[#1976d2] text-white shadow-sm", span: "col-span-2 py-1.5 text-[11px]" },
                        { label: "SELL NOW ↓", cls: "bg-[#eb3349] hover:bg-[#c92437] text-white shadow-sm", span: "col-span-2 py-1.5 text-[11px]" },
                        { label: "SET PENDING", cls: "bg-[#008a2e] hover:bg-[#007527] text-white", span: "" },
                        { label: "CLOSE PENDING", cls: "bg-[#008a2e] hover:bg-[#007527] text-white", span: "" },
                        { label: "SYNC LEVELS", cls: "bg-[#e68a00] hover:bg-[#cc7a00] text-white", span: "" },
                        { label: "CLEAR INPUTS", cls: "bg-[#e68a00] hover:bg-[#cc7a00] text-white", span: "" },
                    ].map((btn) => (
                        <div
                            key={btn.label}
                            className={`${btn.cls} ${btn.span || "py-1 text-[9.5px]"} flex min-h-6 items-center justify-center px-1 text-center font-black uppercase whitespace-nowrap transition-colors cursor-pointer select-none rounded-[2px]`}
                        >
                            {btn.label}
                        </div>
                    ))}
                </div>
            </div>

            {/* Live Dollar R:R & PnL Preview Bar */}
            <div className="mt-3 border-t border-slate-800/80 pt-1.5">
                <div className="relative mb-0.5 flex items-center text-[9.5px] font-black">
                    <span className="text-[#ff3b5c]">SL: -$364.91</span>
                    <div className="flex-1 flex justify-end gap-9 sm:gap-14 pr-1">
                        <span className="text-[#00e5a3]">TP1: $0.00</span>
                        <span className="text-[#00e5a3]">TP2: $0.00</span>
                        <span className="text-[#00e5a3]">TP3: $0.00</span>
                    </div>
                </div>
                <div className="relative mx-2.5 h-3.5 my-0.5 flex items-center">
                    <div className="absolute left-0 w-[24%] top-1.5 h-0.5 bg-[#ff3b5c]" />
                    <div className="absolute left-[24%] right-0 top-1.5 h-0.5 bg-[#00e5a3]" />
                    <div className="absolute left-0 top-0.5 h-2.5 w-0.5 bg-[#ff3b5c]" />
                    <div className="absolute left-[24%] top-0.5 h-2.5 w-0.5 bg-[#00e5a3]" />
                    <div className="absolute left-[50%] top-0.5 h-2.5 w-0.5 bg-[#00e5a3]" />
                    <div className="absolute left-[74%] top-0.5 h-2.5 w-0.5 bg-[#00e5a3]" />
                    <div className="absolute right-0 top-0.5 h-3 w-3 translate-x-1/2 rounded-full border-2 border-[#00e5a3] bg-white shadow-[0_0_6px_rgba(0,229,163,0.9)]" />
                </div>
                <div className="relative flex items-center text-[8.5px] font-black uppercase px-2">
                    <span className="text-[#ff3b5c]">SL</span>
                    <span className="text-[#00e5a3] pl-8 sm:pl-9">ENTRY</span>
                    <div className="flex-1 flex justify-end gap-11 sm:gap-16 pr-1">
                        <span className="text-white">TP1</span>
                        <span className="text-white">TP2</span>
                        <span className="text-white">TP3</span>
                    </div>
                </div>
            </div>

            {/* Partial Close & Fast Exit Row */}
            <div className="mt-2 flex items-center gap-1.5">
                <div className="flex items-center gap-1.5 text-white font-black text-[9.5px] uppercase whitespace-nowrap shrink-0">
                    <span>TP %:</span>
                    <span className="border border-slate-700 bg-[#080d15] text-white font-mono font-bold px-2.5 py-0.5 rounded-[2px] text-[10px] text-center">
                        20
                    </span>
                </div>
                <div className="h-4 w-px bg-slate-700 mx-0.5" />
                <div className="grid grid-cols-4 gap-1 w-full">
                    <div className="bg-[#008a2e] hover:bg-[#007527] cursor-pointer py-1 text-center text-[9.5px] font-black text-white select-none transition-colors rounded-[2px]">TP BUY</div>
                    <div className="bg-[#e51c23] hover:bg-[#c6181e] cursor-pointer py-1 text-center text-[9.5px] font-black text-white select-none transition-colors rounded-[2px]">TP SELL</div>
                    <div className="bg-[#e68a00] hover:bg-[#cc7a00] cursor-pointer py-1 text-center text-[9.5px] font-black text-white select-none transition-colors rounded-[2px]">SL -&gt; BE</div>
                    <div className="bg-[#eb3349] hover:bg-[#c92437] cursor-pointer py-1 text-center text-[9.5px] font-black text-white select-none transition-colors rounded-[2px]">CLOSE ALL</div>
                </div>
            </div>

            {/* Bottom Telemetry Bar */}
            <div className="mt-2 grid grid-cols-4 divide-x divide-slate-700/80 border border-slate-800 bg-[#090e17] py-1.5 text-center text-[10px] font-mono rounded-[2px]">
                <div className="font-black text-[#00e5a3]">BUY: +$775.39</div>
                <div className="font-black text-[#00e5a3]">SELL: +$0.00</div>
                <div className="font-black text-white">0.35 LOTS</div>
                <div className="font-black text-white">5 POS</div>
            </div>
        </div>
    );
}

