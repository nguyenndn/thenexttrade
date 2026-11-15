"use client";

import React from "react";
import {
    SnrEntryConfigState,
    computeTpTargetSummary,
} from "./snr-system-data";

interface SnrConfigDeckProps {
    config: SnrEntryConfigState;
    onChangeField: (field: keyof SnrEntryConfigState, value: string) => void;
}

const CONFIG_FIELDS: readonly {
    key: keyof SnrEntryConfigState;
    label: string;
}[] = [
    { key: "baseLot", label: "Base Lot" },
    { key: "slDist", label: "SL Dist ($)" },
    { key: "rrRatio", label: "R:R Ratio" },
    { key: "minSpace", label: "Min Space ($)" },
    { key: "maxPending", label: "Max Pending" },
];

export function SnrConfigDeck({
    config,
    onChangeField,
}: SnrConfigDeckProps) {
    const { tpDollar, rrFormatted } = computeTpTargetSummary(
        config.slDist,
        config.rrRatio
    );

    return (
        <div className="border border-[#1c2b40] bg-[#090d16] px-2.5 py-2 space-y-1.5">
            <div className="flex flex-wrap items-center justify-between gap-1">
                <span className="text-[10px] font-black uppercase text-[#ffd21f]">
                    ENTRY &amp; SL/TP CONFIG
                </span>
                <span className="text-[10px] font-black text-[#00d4ff] tabular-nums">
                    {`TP Target : $${tpDollar} (R:R 1:${rrFormatted})`}
                </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {CONFIG_FIELDS.map((field, idx) => (
                    <div
                        key={field.key}
                        className={
                            idx === CONFIG_FIELDS.length - 1
                                ? "col-span-2 sm:col-span-1"
                                : ""
                        }
                    >
                        <label
                            htmlFor={`snr-cfg-${field.key}`}
                            className="block text-center text-[9.5px] font-bold text-[#9fb3c8] mb-1 whitespace-nowrap"
                        >
                            {field.label}
                        </label>
                        <input
                            id={`snr-cfg-${field.key}`}
                            aria-label={field.label}
                            type="text"
                            value={config[field.key]}
                            onChange={(e) =>
                                onChangeField(field.key, e.target.value)
                            }
                            className="w-full rounded-none border border-[#c87d0a] bg-[#06090f] py-1 px-1 text-center text-[11px] font-black text-white tabular-nums focus:border-[#ffd21f] focus:outline-none"
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
