"use client";

import React from "react";
import { formatSignedUsd } from "./snr-system-data";

interface SnrTelemetryBarProps {
    equity: number;
    totalFloat: number;
    dailyPnl: number;
    onSimulateTelemetry: () => void;
}

export function SnrTelemetryBar({
    equity,
    totalFloat,
    dailyPnl,
    onSimulateTelemetry,
}: SnrTelemetryBarProps) {
    return (
        <div
            onClick={onSimulateTelemetry}
            title="Click to toggle sample active SNR positions"
            className="cursor-pointer select-none grid grid-cols-3 items-center border border-[#1e293b] bg-[#0d121c] px-3 py-1.5 text-[10px] sm:text-[10.5px] font-black tabular-nums hover:border-[#334155] transition-colors"
        >
            <span className="text-left sm:text-center text-white">
                {`EQUITY: $${equity.toFixed(2)}`}
            </span>
            <span
                className={`text-center ${
                    totalFloat >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                }`}
            >
                {`FLOAT: ${formatSignedUsd(totalFloat)}`}
            </span>
            <span
                className={`text-right sm:text-center ${
                    dailyPnl >= 0 ? "text-[#22c55e]" : "text-[#ef4444]"
                }`}
            >
                {`DAILY: ${formatSignedUsd(dailyPnl)}`}
            </span>
        </div>
    );
}
