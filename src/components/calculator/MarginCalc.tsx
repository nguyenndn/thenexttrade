"use client";

import { useState } from "react";
import { calculateMargin, PIP_VALUES } from "@/lib/calculators";
import { CurrencyPairSelect } from "./CurrencyPairSelect";

export function MarginCalc() {
    const [inputs, setInputs] = useState({
        lotSize: 1,
        pair: "EURUSD",
        leverage: 100,
        currentPrice: 1.0850,
        accountCurrency: "USD"
    });

    const leverageOptions = [500, 400, 200, 100, 50, 30, 20];

    const requiredMargin = calculateMargin(inputs).requiredMargin;

    return (
        <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Currency Pair</label>
                        <CurrencyPairSelect value={inputs.pair} onChange={(v) => setInputs({ ...inputs, pair: v })} />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Lot Size</label>
                        <input
                            type="number"
                            value={inputs.lotSize}
                            onChange={(e) => setInputs({ ...inputs, lotSize: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:border-[#00C888] outline-none font-bold text-lg"
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Leverage (1:X)</label>
                        <select
                            value={inputs.leverage}
                            onChange={(e) => setInputs({ ...inputs, leverage: parseInt(e.target.value) })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:border-[#00C888] outline-none font-bold text-lg"
                        >
                            {leverageOptions.map(lev => (
                                <option key={lev} value={lev}>1:{lev}</option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-bold text-gray-500 uppercase">Current Price</label>
                        <input
                            type="number"
                            value={inputs.currentPrice}
                            onChange={(e) => setInputs({ ...inputs, currentPrice: parseFloat(e.target.value) || 0 })}
                            className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:border-[#00C888] outline-none font-bold text-lg"
                        />
                    </div>
                </div>
            </div>

            <div className="lg:col-span-5">
                <div className="bg-[#151925] border border-white/5 p-6 rounded-[2rem] h-full flex flex-col justify-center text-center shadow-lg">
                    <p className="text-gray-400 text-sm font-bold uppercase tracking-wider mb-2">Required Margin</p>
                    <p className="text-5xl font-black text-white mb-2">${requiredMargin.toFixed(2)}</p>

                    <div className="mt-8 bg-white/5 rounded-xl p-4">
                        <p className="text-xs text-gray-400 mb-2">Influence of Leverage</p>
                        <div className="flex justify-between text-sm">
                            <span>1:500</span>
                            <span className="text-white">${(requiredMargin / (500 / inputs.leverage)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                            <span>1:30</span>
                            <span className="text-white">${(requiredMargin / (30 / inputs.leverage)).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
