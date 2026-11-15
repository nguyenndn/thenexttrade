"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { SnrStoryState, SnrTimeframe } from "./snr-system-data";

interface SnrHeaderBarProps {
    paused: boolean;
    minimized: boolean;
    timeframe: SnrTimeframe;
    story: SnrStoryState;
    buyReady: boolean;
    sellReady: boolean;
    onTogglePause: () => void;
    onToggleMinimize: () => void;
    onCycleTfStory: () => void;
    onToggleBuyReady: () => void;
    onToggleSellReady: () => void;
}

export function SnrHeaderBar({
    paused,
    minimized,
    timeframe,
    story,
    buyReady,
    sellReady,
    onTogglePause,
    onToggleMinimize,
    onCycleTfStory,
    onToggleBuyReady,
    onToggleSellReady,
}: SnrHeaderBarProps) {
    return (
        <div className="border border-[#d97706] bg-[#0d121c] px-2.5 py-2 space-y-1.5">
            <div className="flex items-center justify-between gap-2">
                <span className="truncate text-[11px] sm:text-[12.5px] font-black tracking-wide text-[#fbbf24] uppercase">
                    GOLDSCALPERNINJA — SNR SYSTEM
                </span>
                <div className="flex shrink-0 items-center gap-1.5">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onTogglePause}
                        aria-pressed={paused}
                        className={`h-auto rounded-[2px] px-3 py-0.5 text-[10px] font-black uppercase tracking-wide ${
                            paused
                                ? "border border-[#f59e0b] bg-[#3a2507] text-[#fbbf24] hover:bg-[#4a3009]"
                                : "border border-[#0ea5e9] bg-[#0c3644] text-[#38bdf8] hover:bg-[#11485a]"
                        }`}
                    >
                        {paused ? "RESUME" : "PAUSE"}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onToggleMinimize}
                        aria-label={
                            minimized
                                ? "Expand SNR System panel"
                                : "Minimize SNR System panel"
                        }
                        className="h-auto rounded-[2px] border border-[#d97706] bg-[#141b26] px-2 py-0.5 text-[10px] font-black text-white hover:bg-[#1e293b]"
                    >
                        {minimized ? "[+]" : "[-]"}
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-1.5">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onCycleTfStory}
                    title="Click to cycle Timeframe & H1 Storyline"
                    className="h-auto rounded-[2px] border-none bg-transparent p-0 text-[9.5px] sm:text-[10px] font-bold text-[#94a3b8] hover:bg-transparent hover:text-white"
                >
                    {`TF: ${timeframe}  |  H1 STORY: ${story}`}
                </Button>

                <div className="flex items-center gap-1">
                    <span
                        className={`border px-2.5 py-0.5 text-[9.5px] font-black uppercase ${
                            paused
                                ? "border-[#f59e0b] bg-[#362207] text-[#fbbf24]"
                                : "border-[#22c55e] bg-[#0f2e1c] text-[#4ade80]"
                        }`}
                    >
                        {paused ? "PAUSED" : "ACTIVE"}
                    </span>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onToggleBuyReady}
                        aria-pressed={buyReady}
                        className={`h-auto rounded-[2px] px-2 py-0.5 text-[9.5px] font-black uppercase ${
                            buyReady
                                ? "border border-[#22c55e] bg-[#0f2e1c] text-[#4ade80] hover:bg-[#143d26]"
                                : "border border-[#ef4444] bg-[#361118] text-[#fca5a5] hover:bg-[#47161f]"
                        }`}
                    >
                        {buyReady ? "BUY: READY" : "BUY: LOCKED"}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onToggleSellReady}
                        aria-pressed={sellReady}
                        className={`h-auto rounded-[2px] px-2 py-0.5 text-[9.5px] font-black uppercase ${
                            sellReady
                                ? "border border-[#22c55e] bg-[#0f2e1c] text-[#4ade80] hover:bg-[#143d26]"
                                : "border border-[#ef4444] bg-[#361118] text-[#fca5a5] hover:bg-[#47161f]"
                        }`}
                    >
                        {sellReady ? "SELL: READY" : "SELL: LOCKED"}
                    </Button>
                </div>
            </div>
        </div>
    );
}
