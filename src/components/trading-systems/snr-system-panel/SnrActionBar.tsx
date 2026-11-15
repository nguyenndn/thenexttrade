"use client";

import React from "react";
import { Button } from "@/components/ui/Button";

interface SnrActionBarProps {
    onDeletePendingBuy: () => void;
    onDeletePendingSell: () => void;
    onCloseAllOpen: () => void;
    onRescanChart: () => void;
    onApplySettings: () => void;
}

export function SnrActionBar({
    onDeletePendingBuy,
    onDeletePendingSell,
    onCloseAllOpen,
    onRescanChart,
    onApplySettings,
}: SnrActionBarProps) {
    return (
        <div className="border border-[#1e293b] bg-[#0c111b] p-1.5 grid grid-cols-2 sm:grid-cols-[1.18fr_1.18fr_0.98fr_0.95fr_0.98fr] gap-1.5">
            <Button
                type="button"
                variant="ghost"
                onClick={onDeletePendingBuy}
                className="h-auto rounded-[2px] border border-[#ef4444] bg-[#3b1219] px-1.5 py-2 text-[9px] sm:text-[9.5px] font-black uppercase tracking-tight text-[#fca5a5] hover:bg-[#4d1821] hover:text-white whitespace-nowrap"
            >
                DELETE PENDING BUY
            </Button>
            <Button
                type="button"
                variant="ghost"
                onClick={onDeletePendingSell}
                className="h-auto rounded-[2px] border border-[#ef4444] bg-[#3b1219] px-1.5 py-2 text-[9px] sm:text-[9.5px] font-black uppercase tracking-tight text-[#fca5a5] hover:bg-[#4d1821] hover:text-white whitespace-nowrap"
            >
                DELETE PENDING SELL
            </Button>
            <Button
                type="button"
                variant="ghost"
                onClick={onCloseAllOpen}
                className="h-auto rounded-[2px] border border-[#b91c1c] bg-[#2a1217] px-1.5 py-2 text-[9px] sm:text-[9.5px] font-black uppercase tracking-tight text-[#f87171] hover:bg-[#3b181f] hover:text-white whitespace-nowrap"
            >
                CLOSE ALL OPEN
            </Button>
            <Button
                type="button"
                variant="ghost"
                onClick={onRescanChart}
                className="h-auto rounded-[2px] border border-[#06b6d4] bg-[#0c3644] px-1.5 py-2 text-[9px] sm:text-[9.5px] font-black uppercase tracking-tight text-[#67e8f9] hover:bg-[#114a5c] hover:text-white whitespace-nowrap"
            >
                RESCAN CHART
            </Button>
            <Button
                type="button"
                variant="ghost"
                onClick={onApplySettings}
                className="col-span-2 sm:col-span-1 h-auto rounded-[2px] border border-[#22c55e] bg-[#143821] px-1.5 py-2 text-[9px] sm:text-[9.5px] font-black uppercase tracking-tight text-white hover:bg-[#1b4b2c] whitespace-nowrap"
            >
                APPLY SETTINGS
            </Button>
        </div>
    );
}
