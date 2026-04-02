"use client";

import { useState, useEffect } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import { calculateRiskReward } from "@/lib/calculators";
import { CurrencyPairSelect } from "./CurrencyPairSelect";
import { CalcInput } from "./CalcInput";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function RiskRewardCalc() {
    const [inputs, setInputs] = useState({
        entryPrice: 1.0850,
        stopLoss: 1.0800,
        takeProfit: 1.0950,
        direction: "LONG" as "LONG" | "SHORT",
        pair: "EURUSD"
    });

    const [result, setResult] = useState<{
        riskPips: number;
        rewardPips: number;
        rrRatio: number;
        rrString: string;
        winRateToBreakeven: number;
    } | null>(null);

    useEffect(() => {
        if (inputs.entryPrice && inputs.stopLoss && inputs.takeProfit) {
            const calc = calculateRiskReward(inputs);
            setResult(calc);
        }
    }, [inputs]);

    return (
        <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
                {/* Direction Switch */}
                <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setInputs({ ...inputs, direction: "LONG" })}
                        className={cn(
                            "relative flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-colors h-auto z-10",
                            inputs.direction === "LONG"
                                ? "text-white hover:text-white"
                                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                        )}
                    >
                        {inputs.direction === "LONG" && (
                            <motion.div
                                layoutId="activeRRDirection"
                                className="absolute inset-0 bg-green-500 rounded-lg shadow-lg shadow-green-500/25 -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                            />
                        )}
                        <ArrowUp size={18} /> LONG
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setInputs({ ...inputs, direction: "SHORT" })}
                        className={cn(
                            "relative flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-colors h-auto z-10",
                            inputs.direction === "SHORT"
                                ? "text-white hover:text-white"
                                : "text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                        )}
                    >
                        {inputs.direction === "SHORT" && (
                            <motion.div
                                layoutId="activeRRDirection"
                                className="absolute inset-0 bg-red-500 rounded-lg shadow-lg shadow-red-500/25 -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                            />
                        )}
                        <ArrowDown size={18} /> SHORT
                    </Button>
                </div>

                <div className="space-y-4">
                    <CalcInput
                        label="Entry Price"
                        value={inputs.entryPrice}
                        onChange={(v) => setInputs({ ...inputs, entryPrice: parseFloat(v) || 0 })}
                        step="0.0001"
                    />

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Currency Pair</label>
                        <CurrencyPairSelect value={inputs.pair} onChange={(v) => setInputs({ ...inputs, pair: v })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-red-500 uppercase tracking-wider">Stop Loss</label>
                            <input
                                type="number"
                                step="0.0001"
                                value={inputs.stopLoss}
                                onChange={(e) => setInputs({ ...inputs, stopLoss: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none font-bold text-lg text-red-600 dark:text-red-400 transition-all"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-green-500 uppercase tracking-wider">Take Profit</label>
                            <input
                                type="number"
                                step="0.0001"
                                value={inputs.takeProfit}
                                onChange={(e) => setInputs({ ...inputs, takeProfit: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl focus:border-green-500 focus:ring-2 focus:ring-green-500/20 outline-none font-bold text-lg text-green-600 dark:text-green-400 transition-all"
                            />
                        </div>
                    </div>

                    {/* Quick R:R Presets */}
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Quick R:R Preset</label>
                        <div className="flex gap-2">
                            {[1, 1.5, 2, 3, 4].map((ratio) => {
                                const pipDiff = Math.abs(inputs.entryPrice - inputs.stopLoss);
                                return (
                                    <button
                                        key={ratio}
                                        type="button"
                                        onClick={() => {
                                            const tp = inputs.direction === "LONG"
                                                ? inputs.entryPrice + pipDiff * ratio
                                                : inputs.entryPrice - pipDiff * ratio;
                                            setInputs({ ...inputs, takeProfit: parseFloat(tp.toFixed(5)) });
                                        }}
                                        className="flex-1 py-2 rounded-lg text-xs font-bold bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 text-gray-600 dark:text-gray-400 hover:border-primary/50 hover:text-primary transition-all"
                                    >
                                        1:{ratio}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-5">
                <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/5 p-6 rounded-2xl h-full flex flex-col justify-center text-center shadow-lg relative overflow-hidden">

                    {result && (
                        <div className="relative z-10">
                            <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Risk : Reward Ratio</p>
                            <p className={cn(
                                "text-5xl font-black mb-4",
                                result.rrRatio >= 2 ? "text-primary" : result.rrRatio >= 1 ? "text-yellow-500" : "text-red-500"
                            )}>
                                {result.rrString}
                            </p>

                            <div className="flex items-center justify-center gap-2 mb-8">
                                <span className="px-3 py-1 bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 text-sm font-bold rounded-lg border border-red-200 dark:border-red-500/20">
                                    {result.riskPips} pips
                                </span>
                                <span className="text-gray-400 dark:text-gray-300">vs</span>
                                <span className="px-3 py-1 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-bold rounded-lg border border-green-200 dark:border-green-500/20">
                                    {result.rewardPips} pips
                                </span>
                            </div>

                            {/* Visual R:R Bar */}
                            <div className="mb-6">
                                <div className="flex gap-1 h-6 rounded-lg overflow-hidden">
                                    <div
                                        className="bg-red-500 rounded-l-lg flex items-center justify-center text-[10px] font-bold text-white"
                                        style={{ width: `${Math.min(50, (result.riskPips / (result.riskPips + result.rewardPips)) * 100)}%` }}
                                    >
                                        SL
                                    </div>
                                    <div
                                        className="bg-green-500 rounded-r-lg flex items-center justify-center text-[10px] font-bold text-white flex-1"
                                    >
                                        TP
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                                <p className="text-sm text-gray-600 dark:text-gray-300 mb-1">Win Rate to Breakeven</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{result.winRateToBreakeven}%</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
