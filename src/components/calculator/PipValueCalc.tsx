"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { PIP_VALUES } from "@/lib/calculators";
import { CurrencyPairSelect } from "./CurrencyPairSelect";
import { AccountCurrencySelect, getCurrencySymbol } from "./AccountCurrencySelect";
import { CalcInput } from "./CalcInput";
import { CalcResultPrimary } from "./CalcResult";

export function PipValueCalc() {
    const [pair, setPair] = useState("EURUSD");
    const [lotSize, setLotSize] = useState(1);
    const [accountCurrency, setAccountCurrency] = useState("USD");

    const pipValuePerMicro = PIP_VALUES[pair.toUpperCase()] || 0.10;
    const pipValuePerStandard = pipValuePerMicro * 100;
    const totalValue = pipValuePerStandard * lotSize;

    const currSymbol = getCurrencySymbol(accountCurrency);

    const quickPips = [1, 5, 10, 50, 100];

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Currency Pair</label>
                    <CurrencyPairSelect value={pair} onChange={setPair} />
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                    <CalcInput
                        label="Lot Size"
                        value={lotSize}
                        onChange={(v) => setLotSize(parseFloat(v) || 0)}
                    />
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Lot Type</label>
                        <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl gap-1">
                            {[
                                { label: "Standard", val: 1 },
                                { label: "Mini", val: 0.1 },
                                { label: "Micro", val: 0.01 },
                            ].map((lt) => (
                                <button
                                    key={lt.label}
                                    type="button"
                                    onClick={() => setLotSize(lt.val)}
                                    className={`relative flex-1 py-2.5 rounded-lg text-xs font-bold transition-colors z-10 ${lotSize === lt.val
                                        ? "text-white"
                                        : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                    }`}
                                >
                                    {lotSize === lt.val && (
                                        <motion.div
                                            layoutId="activeLotType"
                                            className="absolute inset-0 bg-gradient-to-r from-primary to-teal-500 rounded-lg shadow-sm -z-10"
                                            transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                        />
                                    )}
                                    {lt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Account Currency</label>
                    <AccountCurrencySelect value={accountCurrency} onChange={setAccountCurrency} />
                </div>
            </div>

            <div className="space-y-4">
                <CalcResultPrimary
                    label={`Pip Value (${accountCurrency})`}
                    value={`${currSymbol}${totalValue.toFixed(2)}`}
                />
                <p className="text-center text-sm text-gray-500 dark:text-gray-400 -mt-1">
                    For <span className="font-bold text-gray-900 dark:text-white">{lotSize}</span> lot(s) of {pair}
                </p>

                {/* Quick Reference Table */}
                <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-gray-200 dark:border-white/10">
                        <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Quick Reference</p>
                    </div>
                    <div className="divide-y divide-gray-200 dark:divide-white/5">
                        {quickPips.map((pips) => (
                            <div key={pips} className="flex items-center justify-between px-4 py-2.5 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                <span className="text-sm text-gray-600 dark:text-gray-400">{pips} pip{pips > 1 ? "s" : ""}</span>
                                <span className="font-bold text-sm text-gray-900 dark:text-white">
                                    {currSymbol}{(totalValue * pips).toFixed(2)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
