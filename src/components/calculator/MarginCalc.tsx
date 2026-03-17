"use client";

import { useState } from "react";
import { calculateMargin } from "@/lib/calculators";
import { CurrencyPairSelect } from "./CurrencyPairSelect";
import { ChevronDown, Check } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";
import { AccountCurrencySelect } from "./AccountCurrencySelect";
import { CalcInput } from "./CalcInput";
import { CalcResultPrimary } from "./CalcResult";

export function MarginCalc() {
    const [inputs, setInputs] = useState({
        lotSize: 1,
        pair: "EURUSD",
        leverage: 100,
        currentPrice: 1.0850,
        accountCurrency: "USD"
    });

    const leverageOptions = [1000, 500, 400, 200, 100, 50, 30, 20, 10, 5];

    const requiredMargin = calculateMargin(inputs).requiredMargin;

    return (
        <div className="grid lg:grid-cols-12 gap-8">
            <div className="lg:col-span-7 space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Currency Pair</label>
                        <CurrencyPairSelect value={inputs.pair} onChange={(v) => setInputs({ ...inputs, pair: v })} />
                    </div>

                    <CalcInput
                        label="Lot Size"
                        value={inputs.lotSize}
                        onChange={(v) => setInputs({ ...inputs, lotSize: parseFloat(v) || 0 })}
                    />

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Leverage (1:X)</label>
                        <DropdownMenu className="block w-full">
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="ghost"
                                    className="w-full px-4 py-3 h-auto rounded-xl bg-white dark:bg-white/5 border border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/10 focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all font-medium text-gray-900 dark:text-white flex items-center justify-between"
                                >
                                    <span className="font-bold text-lg">1:{inputs.leverage}</span>
                                    <ChevronDown size={16} className="text-gray-500 shrink-0" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="start" className="max-h-[280px] overflow-y-auto">
                                {leverageOptions.map(lev => (
                                    <DropdownMenuItem
                                        key={lev}
                                        onClick={() => setInputs({ ...inputs, leverage: lev })}
                                        className={cn(
                                            "flex items-center justify-between gap-2 px-3 py-2",
                                            inputs.leverage === lev && "bg-primary/10 text-primary font-semibold"
                                        )}
                                    >
                                        <span>1:{lev}</span>
                                        {inputs.leverage === lev && <Check size={14} className="text-primary shrink-0" />}
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    <CalcInput
                        label="Current Price"
                        value={inputs.currentPrice}
                        onChange={(v) => setInputs({ ...inputs, currentPrice: parseFloat(v) || 0 })}
                        step="0.0001"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Account Currency</label>
                    <AccountCurrencySelect value={inputs.accountCurrency} onChange={(v) => setInputs({ ...inputs, accountCurrency: v })} />
                </div>
            </div>

            <div className="lg:col-span-5 flex flex-col gap-4">
                <CalcResultPrimary
                    label="Required Margin"
                    value={`$${requiredMargin.toFixed(2)}`}
                    className="flex-1 flex flex-col justify-center"
                />

                <div className="space-y-3">
                    <div className="bg-white dark:bg-white/5 rounded-xl p-3 flex justify-between items-center border border-gray-200 dark:border-white/10 hover:border-primary/30 transition-colors">
                        <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Position Value</span>
                        <span className="text-sm font-bold text-gray-900 dark:text-white">${(inputs.lotSize * 100000 * inputs.currentPrice).toLocaleString('en-US', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="bg-white dark:bg-white/5 rounded-xl p-3 border border-gray-200 dark:border-white/10 hover:border-primary/30 transition-colors">
                        <div className="flex justify-between mb-1.5">
                            <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">Margin %</span>
                            <span className="text-xs font-bold text-primary">{((1 / inputs.leverage) * 100).toFixed(2)}%</span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-white/10 rounded-full h-2">
                            <div
                                className="bg-gradient-to-r from-primary to-teal-500 h-2 rounded-full transition-all"
                                style={{ width: `${Math.min(100, (1 / inputs.leverage) * 100)}%` }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
