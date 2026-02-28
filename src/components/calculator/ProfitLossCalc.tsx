"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { calculateProfitLoss } from "@/lib/calculators";
import { CurrencyPairSelect } from "./CurrencyPairSelect";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";

export function ProfitLossCalc() {
    const [inputs, setInputs] = useState({
        entryPrice: 1.0850,
        exitPrice: 1.0900,
        lotSize: 1,
        direction: "LONG" as "LONG" | "SHORT",
        pair: "EURUSD"
    });

    const result = calculateProfitLoss(inputs);
    const isProfit = result.profitLoss >= 0;

    return (
        <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
                <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setInputs({ ...inputs, direction: "LONG" })}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all h-auto",
                            inputs.direction === "LONG"
                                ? "bg-green-500 text-white shadow-lg shadow-green-500/25 hover:bg-green-600 hover:text-white"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                        )}
                    >
                        <ArrowUp size={18} /> LONG
                    </Button>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setInputs({ ...inputs, direction: "SHORT" })}
                        className={cn(
                            "flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-all h-auto",
                            inputs.direction === "SHORT"
                                ? "bg-red-500 text-white shadow-lg shadow-red-500/25 hover:bg-red-600 hover:text-white"
                                : "text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                        )}
                    >
                        <ArrowDown size={18} /> SHORT
                    </Button>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Entry Price</label>
                        <input
                            type="number"
                            value={inputs.entryPrice}
                            onChange={(e) => setInputs({ ...inputs, entryPrice: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:border-primary outline-none font-bold text-lg"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Exit Price</label>
                        <input
                            type="number"
                            value={inputs.exitPrice}
                            onChange={(e) => setInputs({ ...inputs, exitPrice: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:border-primary outline-none font-bold text-lg"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Lot Size</label>
                        <input
                            type="number"
                            value={inputs.lotSize}
                            onChange={(e) => setInputs({ ...inputs, lotSize: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:border-primary outline-none font-bold text-lg"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Currency Pair</label>
                        <CurrencyPairSelect value={inputs.pair} onChange={(v) => setInputs({ ...inputs, pair: v })} />
                    </div>
                </div>
            </div>

            <div className="lg:col-span-5">
                <div className={cn(
                    "border p-6 rounded-xl h-full flex flex-col justify-center text-center shadow-lg transition-colors duration-300",
                    isProfit
                        ? "bg-green-500/10 border-green-500/20 dark:bg-green-900/10"
                        : "bg-red-500/10 border-red-500/20 dark:bg-red-900/10"
                )}>
                    <p className="text-gray-500 text-sm font-bold uppercase tracking-wider mb-2">Projected P/L</p>
                    <p className={cn(
                        "text-5xl font-black mb-2",
                        isProfit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                        ${result.profitLoss.toFixed(2)}
                    </p>
                    <p className="text-lg font-medium text-gray-500">
                        {result.pips} pips
                    </p>
                </div>
            </div>
        </div>
    );
}
