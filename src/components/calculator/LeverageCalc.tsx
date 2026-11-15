"use client";

import { useState, useMemo } from "react";
import { calculateMargin, DEFAULT_PAIR_PRICES } from "@/lib/calculators";
import { CurrencyPairSelect } from "./CurrencyPairSelect";
import { CalcInput } from "./CalcInput";
import { CalcResultCard, CalcResultGrid } from "./CalcResult";
import { cn } from "@/lib/utils";

export function LeverageCalc() {
    const [inputs, setInputs] = useState({
        accountBalance: 10000,
        lotSize: 1,
        pair: "EURUSD",
        currentPrice: 1.085,
    });

    const results = useMemo(() => {
        const { positionValue: notionalValue } = calculateMargin({
            lotSize: inputs.lotSize,
            pair: inputs.pair,
            leverage: 1,
            currentPrice: inputs.currentPrice,
            accountCurrency: "USD",
        });
        const effectiveLeverage =
            inputs.accountBalance > 0
                ? notionalValue / inputs.accountBalance
                : 0;
        const marginUsed =
            inputs.accountBalance > 0
                ? (notionalValue / inputs.accountBalance) * 100
                : 0;

        return { notionalValue, effectiveLeverage, marginUsed };
    }, [inputs]);

    const getRiskLevel = (lev: number) => {
        if (lev <= 5)
            return {
                label: "Low Risk",
                color: "text-green-600 dark:text-green-400",
                bg: "bg-green-500/10 border-green-500/20",
            };
        if (lev <= 10)
            return {
                label: "Moderate",
                color: "text-yellow-600 dark:text-yellow-400",
                bg: "bg-yellow-500/10 border-yellow-500/20",
            };
        if (lev <= 20)
            return {
                label: "High Risk",
                color: "text-orange-600 dark:text-orange-400",
                bg: "bg-orange-500/10 border-orange-500/20",
            };
        return {
            label: "Very High Risk",
            color: "text-red-600 dark:text-red-400",
            bg: "bg-red-500/10 border-red-500/20",
        };
    };

    const risk = getRiskLevel(results.effectiveLeverage);

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                    <CalcInput
                        label="Account Balance"
                        value={inputs.accountBalance}
                        onChange={(v) =>
                            setInputs({
                                ...inputs,
                                accountBalance: parseFloat(v) || 0,
                            })
                        }
                        suffix="$"
                    />
                    <CalcInput
                        label="Lot Size"
                        value={inputs.lotSize}
                        onChange={(v) =>
                            setInputs({
                                ...inputs,
                                lotSize: parseFloat(v) || 0,
                            })
                        }
                    />
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Currency Pair
                        </label>
                        <CurrencyPairSelect
                            value={inputs.pair}
                            onChange={(v) => {
                                const defaults =
                                    DEFAULT_PAIR_PRICES[v.toUpperCase()];
                                setInputs({
                                    ...inputs,
                                    pair: v,
                                    currentPrice: defaults
                                        ? defaults.price
                                        : inputs.currentPrice,
                                });
                            }}
                        />
                    </div>
                    <CalcInput
                        label="Current Price"
                        value={inputs.currentPrice}
                        onChange={(v) =>
                            setInputs({
                                ...inputs,
                                currentPrice: parseFloat(v) || 0,
                            })
                        }
                        step="0.0001"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div
                    className={cn(
                        "border p-6 rounded-xl text-center shadow-lg",
                        risk.bg
                    )}
                >
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                        Effective Leverage
                    </p>
                    <p className={cn("text-5xl font-black mb-2", risk.color)}>
                        1:{results.effectiveLeverage.toFixed(1)}
                    </p>
                    <p className={cn("text-sm font-bold", risk.color)}>
                        {risk.label}
                    </p>
                </div>

                <CalcResultGrid cols={3}>
                    <CalcResultCard
                        label="Multiplier"
                        value={`${results.effectiveLeverage.toFixed(1)}x`}
                        valueColor="text-primary"
                    />
                    <CalcResultCard
                        label="Notional"
                        value={`$${results.notionalValue.toLocaleString("en-US", { maximumFractionDigits: 0 })}`}
                    />
                    <CalcResultCard
                        label="1% Move"
                        value={`$${(results.notionalValue * 0.01).toFixed(0)}`}
                        valueColor="text-yellow-600 dark:text-yellow-400"
                    />
                </CalcResultGrid>
            </div>
        </div>
    );
}
