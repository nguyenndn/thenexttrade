"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { DcaModuleState, formatSignedUsd } from "./snr-system-data";

type EditableDcaField = "dcaStep" | "addLot" | "lotMult" | "maxDcaOrd" | "trail";

interface SnrDcaModuleColumnProps {
    idPrefix: string;
    engineTitle: string;
    state: DcaModuleState;
    onToggleEnabled: () => void;
    onToggleMode: () => void;
    onToggleLotMode: () => void;
    onChangeField: (field: EditableDcaField, value: string) => void;
}

const DCA_FIELDS: readonly { key: EditableDcaField; label: string }[] = [
    { key: "dcaStep", label: "DCA Step ($)" },
    { key: "addLot", label: "Add Lot (+)" },
    { key: "lotMult", label: "Lot Mult (x)" },
    { key: "maxDcaOrd", label: "Max DCA Ord" },
    { key: "trail", label: "Trail ($)" },
];

export function SnrDcaModuleColumn({
    idPrefix,
    engineTitle,
    state,
    onToggleEnabled,
    onToggleMode,
    onToggleLotMode,
    onChangeField,
}: SnrDcaModuleColumnProps) {
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
                        ? `[✓] ${engineTitle} : ON`
                        : `${engineTitle} : OFF`}
                </Button>

                <div className="grid grid-cols-2 gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onToggleMode}
                        className={`h-auto rounded-[2px] px-1 py-1 text-[9px] font-black whitespace-nowrap ${
                            state.mode === "SINGLE"
                                ? "border border-[#14b8a6] bg-[#0b333e] text-[#2dd4bf] hover:bg-[#104554]"
                                : "border border-[#d97706] bg-[#362207] text-[#fbbf24] hover:bg-[#472d09]"
                        }`}
                    >
                        {`Mode: ${state.mode}`}
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onToggleLotMode}
                        className={`h-auto rounded-[2px] px-1 py-1 text-[9px] font-black whitespace-nowrap ${
                            state.lotMode === "ADD (+)"
                                ? "border border-[#2d3748] bg-[#141b26] text-[#e2e8f0] hover:bg-[#1c2534]"
                                : "border border-[#14b8a6] bg-[#0b333e] text-[#2dd4bf] hover:bg-[#104554]"
                        }`}
                    >
                        {`Lot: ${state.lotMode}`}
                    </Button>
                </div>

                <div className="flex-1 flex flex-col justify-between gap-1.5 py-0.5">
                    {DCA_FIELDS.map((field) => (
                        <div
                            key={field.key}
                            className="flex items-center justify-between gap-1"
                        >
                            <label
                                htmlFor={`${idPrefix}-${field.key}`}
                                className="text-[9.5px] font-semibold text-[#cbd5e1] whitespace-nowrap"
                            >
                                {field.label}
                            </label>
                            <input
                                id={`${idPrefix}-${field.key}`}
                                aria-label={`${engineTitle} ${field.label}`}
                                type="text"
                                value={state[field.key]}
                                onChange={(e) =>
                                    onChangeField(field.key, e.target.value)
                                }
                                className={`w-[88px] sm:w-[82px] xl:w-[88px] rounded-[1px] border border-[#d97706] bg-[#070b12] py-1 px-1 text-center font-black text-white tabular-nums focus:border-[#fbbf24] focus:outline-none ${
                                    field.key === "trail"
                                        ? "text-[9.5px] tracking-tight"
                                        : "text-[10.5px]"
                                }`}
                            />
                        </div>
                    ))}
                </div>
            </div>

            <div className="pt-0.5 space-y-0.5 text-[9.5px] tabular-nums">
                <div
                    className={`font-black ${
                        state.moduleFloat >= 0
                            ? "text-[#22c55e]"
                            : "text-[#ef4444]"
                    }`}
                >
                    {`Module Float: ${formatSignedUsd(state.moduleFloat)}`}
                </div>
                <div className="font-semibold text-[#cbd5e1] whitespace-nowrap">
                    {`Pend B/S: ${state.pendBuy}/${state.pendSell} | Open B/S: ${state.openBuy}/${state.openSell}`}
                </div>
            </div>
        </div>
    );
}
