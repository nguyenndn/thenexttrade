"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import {
    SnrEngineKey,
    SnrEngineUnitState,
    formatSignedDollar,
} from "./snr-system-data";

interface SnrEngineGridProps {
    engines: Record<SnrEngineKey, SnrEngineUnitState>;
    onToggleEngine: (key: SnrEngineKey) => void;
}

const ENGINE_META: readonly { key: SnrEngineKey; label: string }[] = [
    { key: "msnr", label: "MSNR ENGINE" },
    { key: "ote", label: "CHOCH OTE" },
    { key: "dynSnr", label: "DYNAMIC S&R" },
];

export function SnrEngineGrid({
    engines,
    onToggleEngine,
}: SnrEngineGridProps) {
    return (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            {ENGINE_META.map(({ key, label }) => {
                const unit = engines[key];
                return (
                    <div
                        key={key}
                        className="border border-[#1c2b40] bg-[#090d16] p-1.5 text-center space-y-1.5"
                    >
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => onToggleEngine(key)}
                            aria-pressed={unit.enabled}
                            className={`w-full h-auto rounded-none px-1.5 py-1 text-[9.5px] font-black uppercase tracking-tight ${
                                unit.enabled
                                    ? "border border-[#14b8a6] bg-[#0c3b47] text-white hover:bg-[#104c5b] hover:text-white"
                                    : "border border-[#243247] bg-[#101723] text-[#94a3b8] hover:bg-[#162030] hover:text-white"
                            }`}
                        >
                            {`${label} : ${unit.enabled ? "ON" : "OFF"}`}
                        </Button>
                        <div
                            data-testid={`engine-summary-${key}`}
                            className={`text-[9.5px] font-bold tabular-nums whitespace-nowrap ${
                                unit.moduleFloat > 0
                                    ? "text-[#00e676]"
                                    : unit.moduleFloat < 0
                                      ? "text-[#ff4d4f]"
                                      : "text-[#cbd5e1]"
                            }`}
                        >
                            {`P:${unit.pendBuy}/${unit.pendSell} | O:${unit.openBuy}/${unit.openSell} | ${formatSignedDollar(unit.moduleFloat)}`}
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
