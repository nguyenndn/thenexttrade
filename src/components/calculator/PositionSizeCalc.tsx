"use client";

import { useState, useEffect } from "react";
import { Info, Wallet, Percent as PercentIcon, TrendingUp } from "lucide-react";
import { CurrencyPairSelect } from "./CurrencyPairSelect";
import { AccountCurrencySelect } from "./AccountCurrencySelect";
import { calculatePositionSize } from "@/lib/calculators";
import { CalcInput } from "./CalcInput";
import { CalcResultPrimary, CalcResultCard, CalcResultGrid } from "./CalcResult";

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
                <div className="bg-blue-50 dark:bg-blue-500/10 p-4 rounded-xl flex items-start gap-3 border border-blue-100 dark:border-blue-500/20">
                    <Info className="text-blue-500 shrink-0 mt-0.5" size={18} />
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                        Calculate optimal lot size to risk exactly <span className="font-bold">{inputs.riskPercent}%</span> ($ {((inputs.accountBalance * inputs.riskPercent) / 100).toFixed(2)}) of your equity.
                    </p>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                    <CalcInput
                        label="Account Balance"
                        value={inputs.accountBalance}
                        onChange={(v) => setInputs({ ...inputs, accountBalance: parseFloat(v) || 0 })}
                        icon={Wallet}
                        suffix="$"
                    />
                    <CalcInput
                        label="Risk"
                        value={inputs.riskPercent}
                        onChange={(v) => setInputs({ ...inputs, riskPercent: parseFloat(v) || 0 })}
                        icon={PercentIcon}
                        step="0.1"
                        suffix="%"
                    />
                    <CalcInput
                        label="Stop Loss (Pips)"
                        value={inputs.stopLossPips}
                        onChange={(v) => setInputs({ ...inputs, stopLossPips: parseFloat(v) || 0 })}
                        icon={TrendingUp}
                    />
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Currency Pair</label>
                        <CurrencyPairSelect
                            value={inputs.pair}
                            onChange={(pair) => setInputs({ ...inputs, pair })}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Account Currency</label>
                    <AccountCurrencySelect value={inputs.accountCurrency} onChange={(v) => setInputs({ ...inputs, accountCurrency: v })} />
                </div>
            </div>

            {/* Result Section */}
            <div className="lg:col-span-5 space-y-4">
                <CalcResultPrimary
                    label="Recommended Size"
                    value={result ? result.lotSize.toFixed(2) : "0.00"}
                    unit="Lots"
                    className="h-auto"
                />

                <CalcResultGrid>
                    <CalcResultCard
                        label="Risk Amount"
                        value={`$${result?.riskAmount.toFixed(2) || "0.00"}`}
                        valueColor="text-red-600 dark:text-red-400"
                    />
                    <CalcResultCard
                        label="Units"
                        value={result?.units.toLocaleString() || "0"}
                    />
                </CalcResultGrid>

                <div className="bg-white dark:bg-white/5 rounded-xl p-3 border border-gray-200 dark:border-white/10 hover:border-primary/30 transition-colors">
                    <div className="flex justify-between text-sm">
                        <span className="text-gray-500 dark:text-gray-400">Pip Value (Standard)</span>
                        <span className="font-bold text-gray-900 dark:text-white">${result ? result.pipValue.toFixed(2) : "0.00"}</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
