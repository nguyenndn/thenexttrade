"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";

const SYNC_PRESETS = [
    { label: "Today", deals: 6, isHistory: false },
    { label: "Last 3 Days", deals: 18, isHistory: false },
    { label: "Last Week", deals: 41, isHistory: false },
    { label: "Last Month", deals: 152, isHistory: false },
    { label: "Last 3 Months", deals: 418, isHistory: false },
    { label: "Last 6 Months", deals: 812, isHistory: false },
    { label: "Entire History", deals: 1420, isHistory: true },
] as const;

export function TabSyncView() {
    const [connected, setConnected] = useState(false);
    const [lastSyncText, setLastSyncText] = useState("Never (0 Deals)");

    const triggerSync = (deals: number) => {
        setConnected(true);
        setLastSyncText(`Just now (${deals} Deals)`);
    };

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 animate-in fade-in duration-200 flex-1">
            {/* Left Box: SYNC SETTINGS */}
            <div className="border border-[#1f2937] bg-[#0b1019] p-3 rounded-[2px] flex flex-col justify-between">
                <div className="space-y-5">
                    <div className="text-center text-[10.5px] font-black uppercase text-white">
                        SYNC SETTINGS
                    </div>

                    <div className="grid grid-cols-[64px_1fr] items-center gap-2 text-[10px]">
                        <span className="font-black text-white">API Key</span>
                        <div className="border border-[#2d3748] bg-[#161c26] px-2.5 py-1.5 font-mono text-[10px] font-bold text-white rounded-[2px]">
                            TNT-CCKT-Q7DY-9M91
                        </div>
                    </div>

                    <div className="grid grid-cols-[64px_1fr] items-center gap-2 text-[10px]">
                        <span className="font-black text-white">Status</span>
                        <div className="flex items-center justify-between">
                            <span className="font-black text-[#fbbf24]">
                                {connected ? "CONNECTED" : "READY"}
                            </span>
                            <Button
                                type="button"
                                variant="ghost"
                                onClick={() => setConnected(true)}
                                className="h-auto bg-[#268437] hover:bg-[#1e6b2c] px-3 py-1 text-[9.5px] font-black uppercase text-white rounded-[2px]"
                            >
                                CONNECT
                            </Button>
                        </div>
                    </div>

                    <div className="grid grid-cols-[64px_1fr] items-center gap-2 text-[10px]">
                        <span className="font-black text-white">Balance</span>
                        <span className="font-mono font-black text-[#2ecc71] text-[10.5px] tabular-nums">
                            $142,480.93
                        </span>
                    </div>

                    <div className="grid grid-cols-[64px_1fr] items-center gap-2 text-[10px]">
                        <span className="font-black text-white">Last Sync</span>
                        <span className="font-black text-white tabular-nums">
                            {lastSyncText}
                        </span>
                    </div>
                </div>
                <div />
            </div>

            {/* Right Box: SYNC OPTIONS */}
            <div className="border border-[#1f2937] bg-[#0b1019] p-3 rounded-[2px] flex flex-col justify-between">
                <div className="space-y-1.5">
                    <div className="mb-2 text-center text-[10.5px] font-black uppercase text-white">
                        SYNC OPTIONS
                    </div>

                    <div className="space-y-1">
                        {SYNC_PRESETS.map((item) => (
                            <Button
                                key={item.label}
                                type="button"
                                variant="ghost"
                                onClick={() => triggerSync(item.deals)}
                                className={`w-full h-auto py-1 text-center text-[10px] font-black rounded-[2px] ${
                                    item.isHistory
                                        ? "border border-[#5c282c] bg-[#2a1518] text-[#ff9ea8] hover:bg-[#381c20]"
                                        : "border border-[#262f3d] bg-[#181f2a] text-white hover:bg-[#212a38]"
                                }`}
                            >
                                {item.label}
                            </Button>
                        ))}
                    </div>
                </div>

                <div className="mt-2 space-y-1.5">
                    <div className="text-center text-[9.5px] font-semibold text-slate-300">
                        Custom Range
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold tabular-nums">
                        <div className="flex-1 border border-[#2d3748] bg-[#161c26] py-1 text-center text-white rounded-[2px]">
                            2026.11.08
                        </div>
                        <span className="text-slate-400 text-[9.5px]">To</span>
                        <div className="flex-1 border border-[#2d3748] bg-[#161c26] py-1 text-center text-white rounded-[2px]">
                            2026.11.15
                        </div>
                    </div>

                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => triggerSync(37)}
                        className="w-full h-auto bg-[#268437] hover:bg-[#1e6b2c] py-1.5 text-[10.5px] font-black text-white rounded-[2px]"
                    >
                        Sync Selected Range
                    </Button>
                </div>
            </div>
        </div>
    );
}
