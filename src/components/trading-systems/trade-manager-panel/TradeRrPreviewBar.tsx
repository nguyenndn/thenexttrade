"use client";

import React from "react";

interface TradeRrPreviewBarProps {
    slUsd: string;
    tp1Usd: string;
    tp2Usd: string;
    tp3Usd: string;
}

export function TradeRrPreviewBar({
    slUsd,
    tp1Usd,
    tp2Usd,
    tp3Usd,
}: TradeRrPreviewBarProps) {
    return (
        <div className="mt-2.5 pt-1 px-1">
            <div className="relative mb-1 flex items-center justify-between text-[10px] font-black tabular-nums">
                <span className="text-[#ff2a3a]">{`SL: ${slUsd}`}</span>
                <div className="flex items-center gap-8 sm:gap-12">
                    <span className="text-[#2ecc71]">{`TP1: ${tp1Usd}`}</span>
                    <span className="text-[#2ecc71]">{`TP2: ${tp2Usd}`}</span>
                    <span className="text-[#2ecc71]">{`TP3: ${tp3Usd}`}</span>
                </div>
            </div>

            <div className="relative mx-2 h-4 my-0.5 flex items-center">
                <div className="absolute left-0 w-[25%] h-1 bg-[#4c1d24] rounded-l-full" />
                <div className="absolute left-[25%] right-0 h-1 bg-[#1e5631] rounded-r-full" />

                <div className="absolute left-0 h-3 w-[2px] bg-[#ff4d6d]" />
                <div className="absolute left-[25%] h-3 w-[2px] bg-[#00e699]" />
                <div className="absolute left-[50%] h-3 w-[2px] bg-[#2ecc71]" />
                <div className="absolute left-[75%] h-3 w-[2px] bg-[#2ecc71]" />

                <div className="absolute right-0 translate-x-1/2 flex h-4 w-4 items-center justify-center rounded-full bg-[#15803d] ring-2 ring-[#15803d]/50">
                    <span className="h-1.5 w-1.5 rotate-45 bg-white" />
                </div>
            </div>

            <div className="relative mt-0.5 flex items-center text-[9.5px] font-black uppercase px-1.5">
                <span className="w-[25%] text-left text-[#ff4d6d]">SL</span>
                <span className="w-[25%] text-left text-[#00e699]">ENTRY</span>
                <span className="w-[25%] text-left text-white">TP1</span>
                <span className="w-[25%] flex items-center justify-between text-white">
                    <span>TP2</span>
                    <span>TP3</span>
                </span>
            </div>
        </div>
    );
}
