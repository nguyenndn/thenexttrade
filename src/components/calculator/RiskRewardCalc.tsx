"use client";

import { useState, useEffect } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { calculateRiskReward } from "@/lib/calculators";
import { CurrencyPairSelect } from "./CurrencyPairSelect";
import { cn } from "@/lib/utils";

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
                <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
                    <button
                        onClick={() => setInputs({ ...inputs, direction: "LONG" })}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all",
                            inputs.direction === "LONG"
                                ? "bg-green-500 text-white shadow-lg shadow-green-500/25"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        )}
                    >
                        <ArrowUp size={18} /> LONG
                    </button>
                    <button
                        onClick={() => setInputs({ ...inputs, direction: "SHORT" })}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all",
                            inputs.direction === "SHORT"
                                ? "bg-red-500 text-white shadow-lg shadow-red-500/25"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                        )}
                    >
                        <ArrowDown size={18} /> SHORT
                    </button>
                </div>

                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Entry Price</label>
                        <input
                            type="number"
                            step="0.0001"
                            value={inputs.entryPrice}
                            onChange={(e) => setInputs({ ...inputs, entryPrice: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:border-primary outline-none font-bold text-lg"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Currency Pair</label>
                        <CurrencyPairSelect value={inputs.pair} onChange={(v) => setInputs({ ...inputs, pair: v })} />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-red-500 uppercase">Stop Loss</label>
                            <input
                                type="number"
                                step="0.0001"
                                value={inputs.stopLoss}
                                onChange={(e) => setInputs({ ...inputs, stopLoss: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-3 bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 rounded-xl focus:border-red-500 outline-none font-bold text-lg text-red-600 dark:text-red-400"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-green-500 uppercase">Take Profit</label>
                            <input
                                type="number"
                                step="0.0001"
                                value={inputs.takeProfit}
                                onChange={(e) => setInputs({ ...inputs, takeProfit: parseFloat(e.target.value) || 0 })}
                                className="w-full px-4 py-3 bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 rounded-xl focus:border-green-500 outline-none font-bold text-lg text-green-600 dark:text-green-400"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="lg:col-span-5">
                <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/5 p-6 rounded-xl h-full flex flex-col justify-center text-center shadow-lg relative overflow-hidden">

                    {result && (
                        <div className="relative z-10">
                            <p className="text-sm font-bold text-gray-500 uppercase tracking-wider mb-2">Risk : Reward Ratio</p>
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
                                <span className="text-gray-300">vs</span>
                                <span className="px-3 py-1 bg-green-100 dark:bg-green-500/10 text-green-600 dark:text-green-400 text-sm font-bold rounded-lg border border-green-200 dark:border-green-500/20">
                                    {result.rewardPips} pips
                                </span>
                            </div>

                            <div className="pt-6 border-t border-gray-100 dark:border-white/5">
                                <p className="text-sm text-gray-400 mb-1">Win Rate to Breakeven</p>
                                <p className="text-xl font-bold text-gray-900 dark:text-white">{result.winRateToBreakeven}%</p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
