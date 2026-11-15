"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import { DCA_CONFIGS, DcaParamConfig } from "./trade-manager-data";

export function TabSemiView() {
    const [beLotMode, setBeLotMode] = useState(false);
    const [mobileDca, setMobileDca] = useState(false);
    const [smartShield, setSmartShield] = useState(false);
    const [zoneActive, setZoneActive] = useState(false);
    const [vals, setVals] = useState<Record<string, number>>({
        startLot: 0.05, mult: 1.5, dcaStep: 30, zoneRange: 142,
        targetTp: 30, targetSl: 100, maxSingle: 0.5, maxBasket: 2.0,
    });

    const adjustVal = (cfg: DcaParamConfig, dir: 1 | -1) => {
        setVals((prev) => ({
            ...prev,
            [cfg.key]: Math.max(cfg.min, Number((prev[cfg.key] + dir * cfg.step).toFixed(cfg.decimals))),
        }));
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in duration-200 flex-1">
            {/* Left Box: SMART DCA & BE LOT */}
            <div className="border border-[#1f2937] bg-[#0b1019] p-2.5 rounded-[2px] flex flex-col justify-between">
                <div>
                    <div className="mb-2 text-center text-[10.5px] font-black uppercase text-white">
                        SMART DCA &amp; BE LOT
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setBeLotMode((v) => !v)}
                        className="mb-2.5 w-full h-auto border border-[#313e52] bg-[#1e2736] hover:bg-[#273347] py-1.5 text-[9.5px] font-black uppercase text-white rounded-[2px]"
                    >
                        {beLotMode ? "MODE: BE LOT (RECOVERY)" : "MODE: MARTINGALE MULTIPLIER"}
                    </Button>
                </div>

                <div className="space-y-1.5">
                    {DCA_CONFIGS.map((cfg) => (
                        <div key={cfg.key} className="flex items-center justify-between gap-1 text-[9.5px]">
                            <span className="font-black text-white">{cfg.label}</span>
                            <div className="flex items-center gap-0.5">
                                <Button
                                    type="button"
                                    variant="ghost"
                                    aria-label={`Decrease ${cfg.label}`}
                                    onClick={() => adjustVal(cfg, -1)}
                                    className="h-5 w-5 p-0 border border-[#2b3545] bg-[#18202d] hover:bg-[#232f42] text-white font-black rounded-[2px] text-[10px]"
                                >
                                    -
                                </Button>
                                <span className="min-w-[54px] border border-[#243042] bg-[#111824] py-0.5 text-center font-mono font-black text-[#2ecc71] rounded-[2px] tabular-nums">
                                    {vals[cfg.key].toFixed(cfg.decimals)}
                                </span>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    aria-label={`Increase ${cfg.label}`}
                                    onClick={() => adjustVal(cfg, 1)}
                                    className="h-5 w-5 p-0 border border-[#2b3545] bg-[#18202d] hover:bg-[#232f42] text-white font-black rounded-[2px] text-[10px]"
                                >
                                    +
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Box: DCA MONITOR & CONTROL */}
            <div className="border border-[#1f2937] bg-[#0b1019] p-2.5 rounded-[2px] flex flex-col justify-between">
                <div className="space-y-1.5">
                    <div className="mb-2 text-center text-[10.5px] font-black uppercase text-white">
                        DCA MONITOR &amp; CONTROL
                    </div>

                    <div className="grid grid-cols-[94px_1fr] items-center gap-1 text-[9.5px]">
                        <span className="font-black text-white">Mobile DCA:</span>
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setMobileDca((v) => !v)}
                            className={`h-auto py-1 text-[9.5px] font-black uppercase rounded-[2px] ${
                                mobileDca ? "bg-[#1f7a2e] text-white hover:bg-[#196325]" : "bg-[#6e7785] text-white hover:bg-[#5e6673]"
                            }`}
                        >
                            {mobileDca ? "MOBILE DCA: ON" : "MOBILE DCA: OFF"}
                        </Button>
                    </div>

                    {[
                        { label: "Grid Status:", val: "LOCKED (DUPLICATE)", color: "text-[#ef4444]" },
                        { label: "Active Orders:", val: "0 (0.00 Lots)", color: "text-white" },
                        { label: "Current PnL:", val: "$0.00", color: "text-white" },
                        { label: "Combined TP:", val: "NONE", color: "text-white" },
                        { label: "Zone Status:", val: zoneActive ? `ACTIVE (${vals.zoneRange} PIPS)` : "NO ZONE (UNLIMITED)", color: zoneActive ? "text-[#2ecc71]" : "text-white" },
                        { label: "Next Lot Est:", val: `${vals.startLot.toFixed(2)} Lots (Base)`, color: "text-white" },
                    ].map((row) => (
                        <div key={row.label} className="grid grid-cols-[94px_1fr] items-center gap-1 text-[9.5px]">
                            <span className="font-black text-white">{row.label}</span>
                            <span className={`font-black ${row.color}`}>{row.val}</span>
                        </div>
                    ))}
                </div>

                <div className="mt-2 space-y-1.5">
                    <div className="grid grid-cols-2 gap-1.5">
                        <Button type="button" variant="ghost" onClick={() => setZoneActive(true)} className="h-auto bg-[#1f7a2e] hover:bg-[#196325] py-1.5 px-1 text-[9px] font-black uppercase text-white rounded-[2px]">TRADE BY ZONE</Button>
                        <Button type="button" variant="ghost" onClick={() => setZoneActive(false)} className="h-auto bg-[#1f7a2e] hover:bg-[#196325] py-1.5 px-1 text-[9px] font-black uppercase text-white rounded-[2px]">DEL ZONE ON BREAK</Button>
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setSmartShield((v) => !v)}
                        className={`w-full h-auto py-1.5 text-[9.5px] font-black uppercase rounded-[2px] ${
                            smartShield ? "bg-[#05821a] text-white hover:bg-[#046c15]" : "bg-[#3c4452] text-slate-300 hover:bg-[#475061]"
                        }`}
                    >
                        {smartShield ? "SMART SHIELD: ON" : "SMART SHIELD: OFF"}
                    </Button>
                    <div className="grid grid-cols-2 gap-1.5">
                        <Button type="button" variant="ghost" className="h-auto bg-[#1f7a2e] hover:bg-[#196325] py-1.5 text-[10px] font-black uppercase text-white rounded-[2px]">BUY ↑</Button>
                        <Button type="button" variant="ghost" className="h-auto bg-[#b3262e] hover:bg-[#961f26] py-1.5 text-[10px] font-black uppercase text-white rounded-[2px]">SELL ↓</Button>
                    </div>
                    <Button type="button" variant="ghost" className="w-full h-auto bg-[#db6b18] hover:bg-[#bf5c14] py-1.5 text-[10px] font-black uppercase text-white rounded-[2px]">CLOSE ALL DCA</Button>
                </div>
            </div>
        </div>
    );
}
