"use client";

import React from "react";
import type { TradeDirection } from "./types";

interface PanelStatusBoxProps {
    cycleRunning: boolean;
    newsStatus: "OK" | "PAUSED" | "OFF";
    dailyStatus: "OK" | "TARGET" | "STOP";
    licenseStatus: string;
    accountId: string;
    direction: TradeDirection;
}

export function PanelStatusBox({
    cycleRunning,
    newsStatus,
    dailyStatus,
    licenseStatus,
    accountId,
    direction,
}: PanelStatusBoxProps) {
    return (
        <div className="mb-2 rounded-lg border border-gold/40 bg-[#151925] px-2.5 py-1.5 shadow-inner">
            <div className="space-y-1 text-[10px] font-mono tabular-nums">
                {/* Row 1: News & Daily */}
                <div className="grid grid-cols-2 gap-x-6">
                    <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">News:</span>
                        <span
                            className={`font-bold ${
                                newsStatus === "OK"
                                    ? "text-emerald-400"
                                    : "text-amber-400"
                            }`}
                        >
                            {newsStatus}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">Daily:</span>
                        <span
                            className={`font-bold ${
                                dailyStatus === "OK"
                                    ? "text-emerald-400"
                                    : "text-amber-400"
                            }`}
                        >
                            {dailyStatus}
                        </span>
                    </div>
                </div>

                {/* Row 2: Cycle (& optional Trend Mode telemetry) */}
                <div className="grid grid-cols-2 gap-x-6">
                    <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">Cycle:</span>
                        <span
                            className={`font-bold ${
                                cycleRunning ? "text-emerald-400" : "text-amber-400"
                            }`}
                        >
                            {cycleRunning ? "RUNNING" : "STOPPED"}
                        </span>
                    </div>
                    {direction === "AUTO TREND" ? (
                        <div className="flex items-center gap-1 text-[9px]">
                            <span className="text-gray-400">Trend:</span>
                            <span className="font-bold text-emerald-400">
                                UP 74%
                            </span>
                        </div>
                    ) : (
                        <div className="text-gray-500 text-[9px] select-none">
                            ---
                        </div>
                    )}
                </div>

                {/* Row 3: License & ID */}
                <div className="grid grid-cols-2 gap-x-6 pt-0.5">
                    <div className="flex items-center gap-1.5 truncate">
                        <span className="text-gray-400">License:</span>
                        <span className="font-bold text-emerald-400 truncate">
                            {licenseStatus}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <span className="text-gray-400">ID:</span>
                        <span className="font-bold text-white tracking-wider">
                            {accountId}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
}
