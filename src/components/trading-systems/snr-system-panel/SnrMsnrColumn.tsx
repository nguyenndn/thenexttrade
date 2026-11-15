"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { MsnrModuleState, computeTargetTpDist } from "./snr-system-data";

interface SnrMsnrColumnProps {
    state: MsnrModuleState;
    onToggleEnabled: () => void;
    onToggleMode: () => void;
    onChangeField: (
        field: "baseLot" | "slDist" | "rrRatio" | "minSpace" | "maxPending",
        value: string
    ) => void;
}

const MSNR_FIELDS: readonly {
    key: "baseLot" | "slDist" | "rrRatio" | "minSpace" | "maxPending";
    label: string;
}[] = [
    { key: "baseLot", label: "Base Lot" },
    { key: "slDist", label: "SL Dist ($)" },
    { key: "rrRatio", label: "R:R Ratio" },
    { key: "minSpace", label: "Min Space ($)" },
    { key: "maxPending", label: "Max Pending" },
];

export function SnrMsnrColumn({
    state,
    onToggleEnabled,
    onToggleMode,
    onChangeField,
}: SnrMsnrColumnProps) {
    const targetTp = computeTargetTpDist(state.slDist, state.rrRatio);

    return (
        <div className="flex flex-col justify-between border border-[#1e293b] bg-[#0c111b] p-2 gap-2">
            <div className="flex-1 flex flex-col gap-1.5">
                <Button
                    type="button"
                    variant="ghost"
                    onClick={onToggleEnabled}
                    aria-pressed={state.enabled}
                    className={`w-full h-auto rounded-[2px] px-1.5 py-1.5 text-[10px] font-black uppercase tracking-tight ${
                        state.enabled
                            ? "border border-[#14b8a6] bg-[#0c3b47] text-white hover:bg-[#104c5b]"
                            : "border border-[#2d3748] bg-[#131924] text-[#94a3b8] hover:bg-[#1a2230] hover:text-white"
                    }`}
                >
                    {state.enabled
                        ? "[✓] MSNR ENGINE : ON"
                        : "MSNR ENGINE : OFF"}
                </Button>

                <Button
                    type="button"
                    variant="ghost"
                    onClick={onToggleMode}
                    className="w-full h-auto rounded-[2px] border border-[#14b8a6] bg-[#0b333e] px-1.5 py-1 text-[9.5px] font-black text-[#2dd4bf] hover:bg-[#104554] hover:text-[#5eead4]"
                >
                    {`Mode: ${state.mode}`}
                </Button>

                <div className="flex-1 flex flex-col justify-between gap-1.5 py-0.5">
                    {MSNR_FIELDS.map((field) => (
                        <div
                            key={field.key}
                            className="flex items-center justify-between gap-1.5"
                        >
                            <label
                                htmlFor={`msnr-${field.key}`}
                                className="text-[9.5px] font-semibold text-[#cbd5e1] whitespace-nowrap"
                            >
                                {field.label}
                            </label>
                            <input
                                id={`msnr-${field.key}`}
                                aria-label={`MSNR ${field.label}`}
                                type="text"
                                value={state[field.key]}
                                onChange={(e) =>
                                    onChangeField(field.key, e.target.value)
                                }
                                className="w-[88px] sm:w-[82px] xl:w-[88px] rounded-[1px] border border-[#d97706] bg-[#070b12] py-1 px-1 text-center text-[10.5px] font-black text-white tabular-nums focus:border-[#fbbf24] focus:outline-none"
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-0.5 space-y-0.5 text-[9.5px] tabular-nums">
                <div className="font-black text-[#22c55e]">
                    {`Target TP Dist: $${targetTp}`}
                </div>
                <div className="font-semibold text-[#cbd5e1] whitespace-nowrap">
                    {`Pend B/S: ${state.pendBuy}/${state.pendSell} | Open B/S: ${state.openBuy}/${state.openSell}`}
                </div>
            </div>
        </div>
    );
}
