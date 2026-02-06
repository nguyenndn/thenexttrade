"use client";

import { useState, useEffect } from "react";
import { Calculator, Info, Wallet, DollarSign, Percent as PercentIcon, TrendingUp } from "lucide-react";
import { CurrencyPairSelect } from "./CurrencyPairSelect";
import { calculatePositionSize } from "@/lib/calculators";
import { cn } from "@/lib/utils";

export function PositionSizeCalc() {
    const [inputs, setInputs] = useState({
        accountBalance: 10000,
        riskPercent: 1,
        stopLossPips: 20,
        pair: "EURUSD",
        accountCurrency: "USD",
    });

    const [result, setResult] = useState<{
        lotSize: number;
        miniLots: number;
        microLots: number;
        units: number;
        riskAmount: number;
        pipValue: number;
    } | null>(null);

    useEffect(() => {
        if (inputs.accountBalance > 0 && inputs.stopLossPips > 0) {
            const calc = calculatePositionSize(inputs);
            setResult(calc);
        }
    }, [inputs]);

    return (
        <div className="grid lg:grid-cols-12 gap-8">
            {/* Input Section */}
            <div className="lg:col-span-7 space-y-6">
                <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl flex items-start gap-3">
                    <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        Calculate optimal lot size to risk exactly <span className="font-bold">{inputs.riskPercent}%</span> ($ {((inputs.accountBalance * inputs.riskPercent) / 100).toFixed(2)}) of your equity.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Account Balance</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={inputs.accountBalance}
                                onChange={(e) => setInputs({ ...inputs, accountBalance: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:border-[#00C888] outline-none font-bold text-lg"
                            />
                            <Wallet className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Risk (%)</label>
                        <div className="relative">
                            <input
                                type="number"
                                step="0.1"
                                value={inputs.riskPercent}
                                onChange={(e) => setInputs({ ...inputs, riskPercent: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:border-[#00C888] outline-none font-bold text-lg"
                            />
                            <PercentIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Stop Loss (Pips)</label>
                        <div className="relative">
                            <input
                                type="number"
                                value={inputs.stopLossPips}
                                onChange={(e) => setInputs({ ...inputs, stopLossPips: parseFloat(e.target.value) || 0 })}
                                className="w-full pl-10 pr-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:border-[#00C888] outline-none font-bold text-lg"
                            />
                            <TrendingUp className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Currency Pair</label>
                        <CurrencyPairSelect
                            value={inputs.pair}
                            onChange={(pair) => setInputs({ ...inputs, pair })}
                        />
                    </div>
                </div>
            </div>

            {/* Result Section */}
            <div className="lg:col-span-5">
                <div className="bg-[#1E2028] dark:bg-[#0B0E14] text-white p-6 rounded-[2rem] relative overflow-hidden shadow-2xl h-full flex flex-col justify-center">
                    {/* Background Gradients */}
                    <div className="absolute top-0 right-0 w-48 h-48 bg-[#00C888]/20 rounded-full blur-[60px] -mr-12 -mt-12 pointer-events-none" />
                    <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/20 rounded-full blur-[40px] -ml-8 -mb-8 pointer-events-none" />

                    <div className="relative z-10 space-y-6">
                        <div>
                            <p className="text-gray-400 text-xs font-bold uppercase tracking-wider mb-2">Recommended Size</p>
                            <div className="flex items-baseline gap-2">
                                <span className="text-5xl font-black text-white tracking-tighter">
                                    {result ? result.lotSize.toFixed(2) : "0.00"}
                                </span>
                                <span className="text-lg font-medium text-[#00C888]">Lots</span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                <p className="text-gray-400 text-xs mb-1">Risk Amount</p>
                                <p className="text-xl font-bold text-red-400">${result?.riskAmount.toFixed(2)}</p>
                            </div>
                            <div className="bg-white/5 p-3 rounded-xl border border-white/5">
                                <p className="text-gray-400 text-xs mb-1">Units</p>
                                <p className="text-xl font-bold text-white">{result?.units.toLocaleString()}</p>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10">
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-400">Pip Value (Standard)</span>
                                <span className="font-bold text-white">${result ? result.pipValue.toFixed(2) : "0.00"}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
