"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { CalcInput } from "./CalcInput";

type FibType = "retracement" | "extension";

const RETRACEMENT_LEVELS = [0, 0.236, 0.382, 0.5, 0.618, 0.786, 1];
const EXTENSION_LEVELS = [0, 0.618, 1, 1.272, 1.618, 2, 2.618];

export function FibonacciCalc() {
    const [inputs, setInputs] = useState({
        swingHigh: 1.1200,
        swingLow: 1.0800,
        fibType: "retracement" as FibType,
        trend: "uptrend" as "uptrend" | "downtrend",
    });

    const levels = useMemo(() => {
        const diff = inputs.swingHigh - inputs.swingLow;
        const activeLevels = inputs.fibType === "retracement" ? RETRACEMENT_LEVELS : EXTENSION_LEVELS;

        return activeLevels.map((level) => {
            let price: number;
            if (inputs.fibType === "retracement") {
                price = inputs.trend === "uptrend"
                    ? inputs.swingHigh - diff * level
                    : inputs.swingLow + diff * level;
            } else {
                price = inputs.trend === "uptrend"
                    ? inputs.swingLow + diff * level
                    : inputs.swingHigh - diff * level;
            }
            return {
                level: `${(level * 100).toFixed(1)}%`,
                price: price,
                isKey: [0.382, 0.5, 0.618, 1.618].includes(level),
            };
        });
    }, [inputs]);

    const getLevelColor = (levelStr: string) => {
        if (levelStr === "0.0%" || levelStr === "100.0%") return "text-gray-600 dark:text-gray-300";
        if (levelStr === "38.2%" || levelStr === "61.8%") return "text-primary";
        if (levelStr === "50.0%") return "text-cyan-600 dark:text-cyan-400";
        if (levelStr === "161.8%" || levelStr === "261.8%") return "text-amber-600 dark:text-amber-400";
        return "text-gray-700 dark:text-gray-300";
    };

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                {/* Type Toggle */}
                <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl gap-1">
                    <button
                        onClick={() => setInputs({ ...inputs, fibType: "retracement" })}
                        className={`relative flex-1 py-3 rounded-lg font-bold text-sm transition-colors z-10 ${
                            inputs.fibType === "retracement" ? "text-white" : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        }`}
                    >
                        {inputs.fibType === "retracement" && (
                            <motion.div
                                layoutId="activeFibType"
                                className="absolute inset-0 bg-gradient-to-r from-primary to-teal-500 rounded-lg shadow-sm -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                            />
                        )}
                        Retracement
                    </button>
                    <button
                        onClick={() => setInputs({ ...inputs, fibType: "extension" })}
                        className={`relative flex-1 py-3 rounded-lg font-bold text-sm transition-colors z-10 ${
                            inputs.fibType === "extension" ? "text-white" : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                        }`}
                    >
                        {inputs.fibType === "extension" && (
                            <motion.div
                                layoutId="activeFibType"
                                className="absolute inset-0 bg-gradient-to-r from-primary to-teal-500 rounded-lg shadow-sm -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                            />
                        )}
                        Extension
                    </button>
                </div>

                {/* Trend Toggle */}
                <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl gap-1">
                    <button
                        onClick={() => setInputs({ ...inputs, trend: "uptrend" })}
                        className={`relative flex-1 py-3 rounded-lg font-bold text-sm transition-colors z-10 ${
                            inputs.trend === "uptrend" ? "text-white" : "text-gray-600 dark:text-gray-300"
                        }`}
                    >
                        {inputs.trend === "uptrend" && (
                            <motion.div
                                layoutId="activeFibTrend"
                                className="absolute inset-0 bg-green-500 rounded-lg shadow-lg shadow-green-500/25 -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                            />
                        )}
                        ↑ Uptrend
                    </button>
                    <button
                        onClick={() => setInputs({ ...inputs, trend: "downtrend" })}
                        className={`relative flex-1 py-3 rounded-lg font-bold text-sm transition-colors z-10 ${
                            inputs.trend === "downtrend" ? "text-white" : "text-gray-600 dark:text-gray-300"
                        }`}
                    >
                        {inputs.trend === "downtrend" && (
                            <motion.div
                                layoutId="activeFibTrend"
                                className="absolute inset-0 bg-red-500 rounded-lg shadow-lg shadow-red-500/25 -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                            />
                        )}
                        ↓ Downtrend
                    </button>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                    <CalcInput
                        label="Swing High"
                        value={inputs.swingHigh}
                        onChange={(v) => setInputs({ ...inputs, swingHigh: parseFloat(v) || 0 })}
                        step="0.0001"
                    />
                    <CalcInput
                        label="Swing Low"
                        value={inputs.swingLow}
                        onChange={(v) => setInputs({ ...inputs, swingLow: parseFloat(v) || 0 })}
                        step="0.0001"
                    />
                </div>
            </div>

            {/* Fibonacci Levels Visual */}
            <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-200 dark:border-white/10">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Fibonacci {inputs.fibType === "retracement" ? "Retracement" : "Extension"} Levels
                    </p>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-white/5">
                    {levels.map((level, idx) => (
                        <div
                            key={idx}
                            className={`flex items-center justify-between px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-white/5 ${
                                level.isKey ? "bg-primary/5 dark:bg-primary/10" : ""
                            }`}
                        >
                            <div className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${
                                    level.isKey ? "bg-primary" : "bg-gray-300 dark:bg-gray-600"
                                }`} />
                                <span className={`text-sm font-bold ${getLevelColor(level.level)}`}>
                                    {level.level}
                                </span>
                            </div>
                            <span className="font-mono font-bold text-gray-900 dark:text-white text-base">
                                {level.price.toFixed(
                                    inputs.swingHigh > 100 ? 2 : inputs.swingHigh > 10 ? 3 : 5
                                )}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
