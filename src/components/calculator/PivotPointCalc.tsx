"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CalcInput } from "./CalcInput";

type PivotMethod = "classic" | "fibonacci" | "woodie" | "camarilla" | "demark";

function calcPivots(high: number, low: number, close: number, method: PivotMethod) {
    const pp = (high + low + close) / 3;
    const range = high - low;

    switch (method) {
        case "classic":
            return {
                r3: high + 2 * (pp - low),
                r2: pp + range,
                r1: 2 * pp - low,
                pp,
                s1: 2 * pp - high,
                s2: pp - range,
                s3: low - 2 * (high - pp),
            };
        case "fibonacci":
            return {
                r3: pp + range * 1.000,
                r2: pp + range * 0.618,
                r1: pp + range * 0.382,
                pp,
                s1: pp - range * 0.382,
                s2: pp - range * 0.618,
                s3: pp - range * 1.000,
            };
        case "woodie": {
            const wpP = (high + low + 2 * close) / 4;
            return {
                r3: high + 2 * (wpP - low),
                r2: wpP + range,
                r1: 2 * wpP - low,
                pp: wpP,
                s1: 2 * wpP - high,
                s2: wpP - range,
                s3: low - 2 * (high - wpP),
            };
        }
        case "camarilla":
            return {
                r3: close + range * 1.1 / 4,
                r2: close + range * 1.1 / 6,
                r1: close + range * 1.1 / 12,
                pp,
                s1: close - range * 1.1 / 12,
                s2: close - range * 1.1 / 6,
                s3: close - range * 1.1 / 4,
            };
        case "demark": {
            let x: number;
            if (close < low) x = high + 2 * low + close;
            else if (close > high) x = 2 * high + low + close;
            else x = high + low + 2 * close;
            const dPP = x / 4;
            return {
                r3: dPP + (x / 2 - low),
                r2: dPP + (high - low) * 0.618,
                r1: x / 2 - low,
                pp: dPP,
                s1: x / 2 - high,
                s2: dPP - (high - low) * 0.618,
                s3: dPP - (x / 2 - high),
            };
        }
    }
}

const METHODS: { id: PivotMethod; name: string }[] = [
    { id: "classic", name: "Classic" },
    { id: "fibonacci", name: "Fibonacci" },
    { id: "woodie", name: "Woodie" },
    { id: "camarilla", name: "Camarilla" },
    { id: "demark", name: "DeMark" },
];

export function PivotPointCalc() {
    const [inputs, setInputs] = useState({
        high: 1.0950,
        low: 1.0850,
        close: 1.0920,
        method: "classic" as PivotMethod,
    });

    const pivots = useMemo(() => {
        return calcPivots(inputs.high, inputs.low, inputs.close, inputs.method);
    }, [inputs]);

    const decimals = inputs.high > 100 ? 2 : inputs.high > 10 ? 3 : 5;

    const levels = [
        { label: "R3", value: pivots.r3, color: "text-red-500 dark:text-red-400" },
        { label: "R2", value: pivots.r2, color: "text-red-400 dark:text-red-300" },
        { label: "R1", value: pivots.r1, color: "text-orange-500 dark:text-orange-400" },
        { label: "PP", value: pivots.pp, color: "text-primary font-black" },
        { label: "S1", value: pivots.s1, color: "text-green-500 dark:text-green-400" },
        { label: "S2", value: pivots.s2, color: "text-green-600 dark:text-green-300" },
        { label: "S3", value: pivots.s3, color: "text-green-700 dark:text-green-200" },
    ];

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                {/* Method Toggle */}
                <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl gap-1">
                    {METHODS.map((m) => (
                        <button
                            key={m.id}
                            onClick={() => setInputs({ ...inputs, method: m.id })}
                            className={cn(
                                "relative flex-1 py-2.5 rounded-lg font-bold text-xs transition-colors z-10",
                                inputs.method === m.id
                                    ? "text-white"
                                    : "text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                            )}
                        >
                            {inputs.method === m.id && (
                                <motion.div
                                    layoutId="activePivotMethod"
                                    className="absolute inset-0 bg-gradient-to-r from-primary to-teal-500 rounded-lg shadow-sm -z-10"
                                    transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                />
                            )}
                            {m.name}
                        </button>
                    ))}
                </div>

                <div className="grid sm:grid-cols-3 gap-6">
                    <CalcInput
                        label="Previous High"
                        value={inputs.high}
                        onChange={(v) => setInputs({ ...inputs, high: parseFloat(v) || 0 })}
                        step="0.0001"
                    />
                    <CalcInput
                        label="Previous Low"
                        value={inputs.low}
                        onChange={(v) => setInputs({ ...inputs, low: parseFloat(v) || 0 })}
                        step="0.0001"
                    />
                    <CalcInput
                        label="Previous Close"
                        value={inputs.close}
                        onChange={(v) => setInputs({ ...inputs, close: parseFloat(v) || 0 })}
                        step="0.0001"
                    />
                </div>
            </div>

            {/* Pivot Levels */}
            <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-white/10">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        {METHODS.find(m => m.id === inputs.method)?.name} Pivot Levels
                    </p>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-white/5">
                    {levels.map((level) => (
                        <div
                            key={level.label}
                            className={cn(
                                "flex items-center justify-between px-4 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-white/5",
                                level.label === "PP" && "bg-primary/5 dark:bg-primary/10"
                            )}
                        >
                            <div className="flex items-center gap-3">
                                <div className={cn(
                                    "w-10 h-6 rounded text-center text-xs font-black flex items-center justify-center",
                                    level.label.startsWith("R") ? "bg-red-500/10 text-red-500" :
                                    level.label === "PP" ? "bg-primary/10 text-primary" :
                                    "bg-green-500/10 text-green-500"
                                )}>
                                    {level.label}
                                </div>
                                <span className="text-sm text-gray-500 dark:text-gray-400">
                                    {level.label === "PP" ? "Pivot Point" :
                                     level.label.startsWith("R") ? `Resistance ${level.label[1]}` :
                                     `Support ${level.label[1]}`}
                                </span>
                            </div>
                            <span className={cn("font-mono font-bold text-base", level.color)}>
                                {level.value.toFixed(decimals)}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
