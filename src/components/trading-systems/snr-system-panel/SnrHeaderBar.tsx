"use client";

import React from "react";
import { Button } from "@/components/ui/Button";

interface SnrHeaderBarProps {
    minimized: boolean;
    onToggleMinimize: () => void;
}

export function SnrHeaderBar({
    minimized,
    onToggleMinimize,
}: SnrHeaderBarProps) {
    return (
        <div className="flex items-center justify-between border border-[#9e6508] bg-[#0b0f17] px-3 py-2">
            <span className="truncate text-[11px] sm:text-[11.5px] font-black tracking-wide text-[#ffd21f] uppercase">
                GOLD SCALPER NINJA - SNR SYSTEM
            </span>
            <Button
                type="button"
                variant="ghost"
                onClick={onToggleMinimize}
                aria-label={
                    minimized
                        ? "Expand SNR System panel"
                        : "Minimize SNR System panel"
                }
                className="h-auto shrink-0 rounded-none border border-[#9e6508] bg-[#141a24] px-2.5 py-0.5 text-[9.5px] font-black text-white hover:bg-[#1c2432] hover:text-white"
            >
                {minimized ? "[ SHOW ]" : "[ HIDE ]"}
            </Button>
        </div>
    );
}
