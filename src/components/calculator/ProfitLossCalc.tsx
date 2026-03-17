"use client";

import { useState } from "react";
import { ArrowUp, ArrowDown } from "lucide-react";
import { motion } from "framer-motion";
import { calculateProfitLoss } from "@/lib/calculators";
import { CurrencyPairSelect } from "./CurrencyPairSelect";
import { AccountCurrencySelect, getCurrencySymbol } from "./AccountCurrencySelect";
import { CalcInput } from "./CalcInput";
import { CalcResultCard } from "./CalcResult";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/Button";


export function ProfitLossCalc() {
    const [inputs, setInputs] = useState({
        entryPrice: 1.0850,
        exitPrice: 1.0900,
        lotSize: 1,
        direction: "LONG" as "LONG" | "SHORT",
        pair: "EURUSD",
        accountCurrency: "USD"
    });

    const result = calculateProfitLoss(inputs);
    const isProfit = result.profitLoss >= 0;

    return (
        <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
                <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl gap-1">
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={() => setInputs({ ...inputs, direction: "LONG" })}
                        className={cn(
                            "relative flex-1 flex items-center justify-center gap-2 py-3 rounded-lg font-bold transition-colors h-auto z-10",
                            inputs.direction === "LONG"
                                ? "text-white hover:text-white"
                                : "text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                        )}
                    >
                        {inputs.direction === "LONG" && (
                            <motion.div
                                layoutId="activePLDirection"
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
                                : "text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5"
                        )}
                    >
                        {inputs.direction === "SHORT" && (
                            <motion.div
                                layoutId="activePLDirection"
                                className="absolute inset-0 bg-red-500 rounded-lg shadow-lg shadow-red-500/25 -z-10"
                                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                            />
                        )}
                        <ArrowDown size={18} /> SHORT
                    </Button>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                    <CalcInput
                        label="Entry Price"
                        value={inputs.entryPrice}
                        onChange={(v) => setInputs({ ...inputs, entryPrice: parseFloat(v) || 0 })}
                        step="0.0001"
                    />
                    <CalcInput
                        label="Exit Price"
                        value={inputs.exitPrice}
                        onChange={(v) => setInputs({ ...inputs, exitPrice: parseFloat(v) || 0 })}
                        step="0.0001"
                    />
                    <CalcInput
                        label="Lot Size"
                        value={inputs.lotSize}
                        onChange={(v) => setInputs({ ...inputs, lotSize: parseFloat(v) || 0 })}
                    />
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Currency Pair</label>
                        <CurrencyPairSelect value={inputs.pair} onChange={(v) => setInputs({ ...inputs, pair: v })} />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Account Currency</label>
                    <AccountCurrencySelect value={inputs.accountCurrency || "USD"} onChange={(v) => setInputs({ ...inputs, accountCurrency: v })} />
                </div>
            </div>


            <div className="lg:col-span-5">
                <div className={cn(
                    "border p-6 rounded-2xl h-full flex flex-col justify-center text-center shadow-lg transition-colors duration-300",
                    isProfit
                        ? "bg-green-500/10 border-green-500/20 dark:bg-green-900/10"
                        : "bg-red-500/10 border-red-500/20 dark:bg-red-900/10"
                )}>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Projected P/L</p>
                    <p className={cn(
                        "text-5xl font-black mb-2",
                        isProfit ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                        ${result.profitLoss.toFixed(2)}
                    </p>
                    <p className="text-lg font-medium text-gray-500 dark:text-gray-400">
                        {result.pips} pips
                    </p>

                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-white/10 grid grid-cols-2 gap-3">
                        <CalcResultCard
                            label="Pip Value"
                            value={`$${(Math.abs(result.profitLoss) / Math.max(Math.abs(result.pips), 1)).toFixed(2)}`}
                        />
                        <CalcResultCard
                            label="Price Change"
                            value={`${((Math.abs(inputs.exitPrice - inputs.entryPrice) / inputs.entryPrice) * 100).toFixed(3)}%`}
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}
