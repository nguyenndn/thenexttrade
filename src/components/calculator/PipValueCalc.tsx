"use client";

import { useState } from "react";
import { PIP_VALUES } from "@/lib/calculators";
import { CurrencyPairSelect } from "./CurrencyPairSelect";

export function PipValueCalc() {
    const [pair, setPair] = useState("EURUSD");
    const [lotSize, setLotSize] = useState(1);

    // PIP_VALUES is per Micro Lot (1000). Standard Lot = 100 * Micro = *100? No.
    // Standard Lot (100k) = 100 * Micro Lot (1k).
    // Pip Value per Micro Lot = 0.10.
    // Pip Value per Standard Lot = 0.10 * 100 = 10.
    // Wait, Micro Lot 0.01. Standard 1.0. Ratio is 100.

    const pipValuePerMicro = PIP_VALUES[pair.toUpperCase()] || 0.10;
    const pipValuePerStandard = pipValuePerMicro * 100;
    // Wait, if pipValuePerMicro is $0.10. 100 * $0.10 = $10. Correct.

    const totalValue = pipValuePerStandard * lotSize;

    return (
        <div className="grid lg:grid-cols-2 gap-8 items-center">
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Currency Pair</label>
                    <CurrencyPairSelect value={pair} onChange={setPair} />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">Lot Size</label>
                    <input
                        type="number"
                        value={lotSize}
                        onChange={(e) => setLotSize(parseFloat(e.target.value) || 0)}
                        className="w-full px-4 py-3 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:border-primary outline-none font-bold text-lg"
                    />
                </div>
            </div>

            <div>
                <div className="bg-gradient-to-br from-blue-600 to-cyan-500 text-white p-8 rounded-xl text-center shadow-xl shadow-cyan-500/20 relative overflow-hidden">
                    <div className="relative z-10">
                        <p className="text-blue-100 font-bold uppercase tracking-wider mb-2">Pip Value (USD)</p>
                        <p className="text-6xl font-black tracking-tight">${totalValue.toFixed(2)}</p>
                        <p className="mt-4 text-blue-100/80 text-sm">
                            For <span className="font-bold text-white">{lotSize}</span> lot(s) of {pair} move of 1 pip = ${totalValue.toFixed(2)}
                        </p>
                    </div>

                    {/* Decorative Circles */}
                    <div className="absolute -top-12 -right-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                    <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
                </div>
            </div>
        </div>
    );
}
