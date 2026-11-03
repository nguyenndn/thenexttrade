"use client";

import React, { useState } from "react";

const SYNC_PRESETS = [
    { label: "Today", isHistory: false },
    { label: "Last 3 Days", isHistory: false },
    { label: "Last Week", isHistory: false },
    { label: "Last Month", isHistory: false },
    { label: "Last 3 Months", isHistory: false },
    { label: "Last 6 Months", isHistory: false },
    { label: "Entire History", isHistory: true },
] as const;

export function TabSyncView() {
    const [connected, setConnected] = useState(false);

    return (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-in fade-in duration-200 flex-1">
            {/* Left Box: SYNC SETTINGS */}
            <div className="border border-slate-800 bg-[#090e17] p-3 rounded-[2px] flex flex-col justify-between">
                <div className="space-y-4">
                    <div className="text-center text-[10.5px] font-black uppercase text-white">
                        SYNC SETTINGS
                    </div>

                    <div className="grid grid-cols-[64px_1fr] items-center gap-2 text-[10px]">
                        <span className="font-black text-white">API Key</span>
                        <div className="border border-slate-700 bg-[#141c28] px-2 py-1 font-mono text-[10px] font-bold text-white rounded-[2px]">
                            TNT-CCKT-Q7DY-9M91
                        </div>
                    </div>

                    <div className="grid grid-cols-[64px_1fr] items-center gap-2 text-[10px]">
                        <span className="font-black text-white">Status</span>
                        <div className="flex items-center justify-between">
                            <span className="font-black text-[#ffd21f]">
                                {connected ? "CONNECTED" : "READY"}
                            </span>
                            <div
                                onClick={() => setConnected(true)}
                                className="cursor-pointer select-none bg-[#238636] hover:bg-[#1c6e2b] px-2.5 py-1 text-[9.5px] font-black uppercase text-white rounded-[2px]"
                            >
                                CONNECT
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-[64px_1fr] items-center gap-2 text-[10px]">
                        <span className="font-black text-white">Balance</span>
                        <span className="font-mono font-black text-[#00e5a3] text-[10.5px]">
                            $108,462.67
                        </span>
                    </div>

                    <div className="grid grid-cols-[64px_1fr] items-center gap-2 text-[10px]">
                        <span className="font-black text-white">Last Sync</span>
                        <span className="font-black text-white">
                            {connected ? "Just now (14 Deals)" : "Never (0 Deals)"}
                        </span>
                    </div>
                </div>
                <div />
            </div>

            {/* Right Box: SYNC OPTIONS */}
            <div className="border border-slate-800 bg-[#090e17] p-3 rounded-[2px] flex flex-col justify-between">
                <div className="space-y-1.5">
                    <div className="mb-2 text-center text-[10.5px] font-black uppercase text-white">
                        SYNC OPTIONS
                    </div>

                    <div className="space-y-1">
                        {SYNC_PRESETS.map((item) => (
                            <div
                                key={item.label}
                                className={`cursor-pointer select-none border py-1 text-center text-[10px] font-black rounded-[2px] transition-colors ${
                                    item.isHistory
                                        ? "border-[#5c262c] bg-[#2a1419] text-[#ff9ea8] hover:bg-[#381a21]"
                                        : "border-slate-700/80 bg-[#161e2b] text-white hover:bg-[#1f2a3c]"
                                }`}
                            >
                                {item.label}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-2 space-y-1.5">
                    <div className="text-center text-[9.5px] font-semibold text-slate-300">
                        Custom Range
                    </div>
                    <div className="flex items-center gap-1.5 text-[10px] font-bold">
                        <div className="flex-1 border border-slate-700 bg-[#141c28] py-1 text-center text-white rounded-[2px]">
                            2026.10.26
                        </div>
                        <span className="text-slate-400 text-[9.5px]">To</span>
                        <div className="flex-1 border border-slate-700 bg-[#141c28] py-1 text-center text-white rounded-[2px]">
                            2026.11.02
                        </div>
                    </div>

                    <div className="cursor-pointer select-none bg-[#238636] hover:bg-[#1c6e2b] py-1.5 text-center text-[10.5px] font-black text-white rounded-[2px] transition-colors">
                        Sync Selected Range
                    </div>
                </div>
            </div>
        </div>
    );
}

