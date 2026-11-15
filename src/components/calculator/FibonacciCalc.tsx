"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { AlertCircle, ArrowUp, ArrowDown } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { CalcInput } from "./CalcInput";

type FibType = "retracement" | "extension";

const RETRACEMENT_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const EXTENSION_LEVELS = [0, 0.618, 1, 1.272, 1.618, 2, 2.618];

export function FibonacciCalc() {
    const [inputs, setInputs] = useState({
        swingHigh: 1.12,
        swingLow: 1.08,
        fibType: "retracement" as FibType,
        trend: "uptrend" as "uptrend" | "downtrend",
    });

    const isValidRange = inputs.swingHigh > inputs.swingLow;

    const levels = useMemo(() => {
        const diff = inputs.swingHigh - inputs.swingLow;
        const activeLevels =
            inputs.fibType === "retracement"
                ? RETRACEMENT_LEVELS
                : EXTENSION_LEVELS;

        return activeLevels.map((level) => {
            if (!isValidRange) {
                return {
                    level: `${(level * 100).toFixed(1)}%`,
                    price: null as number | null,
                    isKey: [0.382, 0.5, 0.618, 1.618].includes(level),
                };
            }
            let price: number;
            if (inputs.fibType === "retracement") {
                price =
                    inputs.trend === "uptrend"
                        ? inputs.swingHigh - diff * level
                        : inputs.swingLow + diff * level;
            } else {
                price =
                    inputs.trend === "uptrend"
                        ? inputs.swingLow + diff * level
                        : inputs.swingHigh - diff * level;
            }
            return {
                level: `${(level * 100).toFixed(1)}%`,
                price,
                isKey: [0.382, 0.5, 0.618, 1.618].includes(level),
            };
        });
    }, [inputs, isValidRange]);

    const getLevelColor = (levelStr: string) => {
        if (levelStr === "0.0%" || levelStr === "100.0%")
            return "text-gray-600 dark:text-gray-300";
        if (levelStr === "38.2%" || levelStr === "61.8%") return "text-primary";
        if (levelStr === "50.0%") return "text-cyan-600 dark:text-cyan-400";
        if (levelStr === "161.8%" || levelStr === "261.8%")
            return "text-amber-600 dark:text-amber-400";
        return "text-gray-700 dark:text-gray-300";
    };

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                {/* Type Toggle */}
                <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-lg gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        role="tab"
                        aria-selected={inputs.fibType === "retracement"}
                        onClick={() =>
                            setInputs({ ...inputs, fibType: "retracement" })
                        }
                        className={`relative flex-1 py-3 rounded-lg font-bold text-sm transition-colors z-10 h-auto border-0 ${
                            inputs.fibType === "retracement"
                                ? "text-white hover:text-white"
                                : "text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                        }`}
                    >
                        {inputs.fibType === "retracement" && (
                            <motion.div
                                layoutId="activeFibType"
                                className="absolute inset-0 bg-gradient-to-r from-gold to-amber-600 rounded-lg shadow-sm shadow-amber-500/20 -z-10"
                                transition={{
                                    type: "spring",
                                    bounce: 0.2,
                                    duration: 0.5,
                                }}
                            />
                        )}
                        Retracement
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        role="tab"
                        aria-selected={inputs.fibType === "extension"}
                        onClick={() =>
                            setInputs({ ...inputs, fibType: "extension" })
                        }
                        className={`relative flex-1 py-3 rounded-lg font-bold text-sm transition-colors z-10 h-auto border-0 ${
                            inputs.fibType === "extension"
                                ? "text-white hover:text-white"
                                : "text-gray-600 dark:text-gray-300 hover:text-gray-700 dark:hover:text-white"
                        }`}
                    >
                        {inputs.fibType === "extension" && (
                            <motion.div
                                layoutId="activeFibType"
                                className="absolute inset-0 bg-gradient-to-r from-gold to-amber-600 rounded-lg shadow-sm shadow-amber-500/20 -z-10"
                                transition={{
                                    type: "spring",
                                    bounce: 0.2,
                                    duration: 0.5,
                                }}
                            />
                        )}
                        Extension
                    </Button>
                </div>

                {/* Trend Toggle */}
                <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-lg gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        role="tab"
                        aria-selected={inputs.trend === "uptrend"}
                        onClick={() =>
                            setInputs({ ...inputs, trend: "uptrend" })
                        }
                        className={`relative flex-1 py-3 rounded-lg font-bold text-sm transition-colors z-10 h-auto border-0 ${
                            inputs.trend === "uptrend"
                                ? "text-white hover:text-white"
                                : "text-gray-600 dark:text-gray-300"
                        }`}
                    >
                        {inputs.trend === "uptrend" && (
                            <motion.div
                                layoutId="activeFibTrend"
                                className="absolute inset-0 bg-green-500 rounded-lg shadow-lg shadow-green-500/25 -z-10"
                                transition={{
                                    type: "spring",
                                    bounce: 0.2,
                                    duration: 0.5,
                                }}
                            />
                        )}
                        <ArrowUp size={15} />
                        <span>Uptrend</span>
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        role="tab"
                        aria-selected={inputs.trend === "downtrend"}
                        onClick={() =>
                            setInputs({ ...inputs, trend: "downtrend" })
                        }
                        className={`relative flex-1 py-3 rounded-lg font-bold text-sm transition-colors z-10 h-auto border-0 ${
                            inputs.trend === "downtrend"
                                ? "text-white hover:text-white"
                                : "text-gray-600 dark:text-gray-300"
                        }`}
                    >
                        {inputs.trend === "downtrend" && (
                            <motion.div
                                layoutId="activeFibTrend"
                                className="absolute inset-0 bg-red-500 rounded-lg shadow-lg shadow-red-500/25 -z-10"
                                transition={{
                                    type: "spring",
                                    bounce: 0.2,
                                    duration: 0.5,
                                }}
                            />
                        )}
                        <ArrowDown size={15} />
                        <span>Downtrend</span>
                    </Button>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                    <CalcInput
                        label="Swing High"
                        value={inputs.swingHigh}
                        onChange={(v) =>
                            setInputs({
                                ...inputs,
                                swingHigh: parseFloat(v) || 0,
                            })
                        }
                        step="0.0001"
                    />
                    <CalcInput
                        label="Swing Low"
                        value={inputs.swingLow}
                        onChange={(v) =>
                            setInputs({
                                ...inputs,
                                swingLow: parseFloat(v) || 0,
                            })
                        }
                        step="0.0001"
                    />
                </div>

                {!isValidRange && (
                    <div className="flex items-start gap-2.5 rounded-xl border border-red-500/25 bg-red-500/10 p-3.5 text-xs font-medium text-red-600 dark:text-red-400">
                        <AlertCircle size={16} className="shrink-0 mt-0.5" />
                        <span>
                            Swing High must be strictly greater than Swing Low
                            to project Fibonacci levels.
                        </span>
                    </div>
                )}
            </div>

            {/* Fibonacci Levels Visual */}
            <div className="bg-white dark:bg-white/5 rounded-xl border border-dashboard overflow-hidden">
                <div className="px-4 py-3 border-b border-dashboard">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Fibonacci{" "}
                        {inputs.fibType === "retracement"
                            ? "Retracement"
                            : "Extension"}{" "}
                        Levels
                    </p>
                </div>
                <div className="divide-y divide-dashboard">
                    {levels.map((level, idx) => (
                        <div
                            key={idx}
                            className={`flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${
                                level.isKey
                                    ? "bg-primary/5 dark:bg-primary/10"
                                    : ""
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div
                                    className={`w-3 h-3 rounded-full ${
                                        level.isKey
                                            ? "bg-primary"
                                            : "bg-gray-300 dark:bg-gray-600"
                                    }`}
                                />
                                <span
                                    className={`text-sm font-bold ${getLevelColor(level.level)}`}
                                >
                                    {level.level}
                                </span>
                            </div>
                            <span className="font-mono tabular-nums font-bold text-gray-700 dark:text-white text-base">
                                {level.price === null
                                    ? "—"
                                    : level.price.toFixed(
                                          inputs.swingHigh > 100
                                              ? 2
                                              : inputs.swingHigh > 10
                                                ? 3
                                                : 5
                                      )}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
