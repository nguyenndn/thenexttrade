"use client";

import React from "react";
import { Button } from "@/components/ui/Button";

interface SnrActionBarProps {
    onDeleteBuy: () => void;
    onDeleteSell: () => void;
    onCloseAll: () => void;
    onRescanChart: () => void;
    onApplyConfig: () => void;
}

export function SnrActionBar({
    onDeleteBuy,
    onDeleteSell,
    onCloseAll,
    onRescanChart,
    onApplyConfig,
}: SnrActionBarProps) {
    return (
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-1.5 pt-0.5">
            <Button
                type="button"
                variant="ghost"
                onClick={onDeleteBuy}
                className="h-auto rounded-none border border-[#b82830] bg-[#3a1216] px-1.5 py-2 text-[9.5px] font-black uppercase tracking-tight text-[#ff6b6b] hover:bg-[#4d171c] hover:text-white whitespace-nowrap"
            >
                DELETE BUY
            </Button>
            <Button
                type="button"
                variant="ghost"
                onClick={onDeleteSell}
                className="h-auto rounded-none border border-[#b82830] bg-[#3a1216] px-1.5 py-2 text-[9.5px] font-black uppercase tracking-tight text-[#ff6b6b] hover:bg-[#4d171c] hover:text-white whitespace-nowrap"
            >
                DELETE SELL
            </Button>
            <Button
                type="button"
                variant="ghost"
                onClick={onCloseAll}
                className="h-auto rounded-none border border-[#8c232a] bg-[#260e12] px-1.5 py-2 text-[9.5px] font-black uppercase tracking-tight text-[#ff6b6b] hover:bg-[#38141a] hover:text-white whitespace-nowrap"
            >
                CLOSE ALL
            </Button>
            <Button
                type="button"
                variant="ghost"
                onClick={onRescanChart}
                className="h-auto rounded-none border border-[#009ec2] bg-[#0b2e3d] px-1.5 py-2 text-[9.5px] font-black uppercase tracking-tight text-[#00d4ff] hover:bg-[#104054] hover:text-white whitespace-nowrap"
            >
                RESCAN CHART
            </Button>
            <Button
                type="button"
                variant="ghost"
                onClick={onApplyConfig}
                className="col-span-2 sm:col-span-1 h-auto rounded-none border border-[#22c55e] bg-[#144327] px-1.5 py-2 text-[9.5px] font-black uppercase tracking-tight text-white hover:bg-[#1b5934] hover:text-white whitespace-nowrap"
            >
                APPLY CONFIG
            </Button>
        </div>
    );
}
