"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CalcInput } from "./CalcInput";
import { CalcResultPrimary, CalcResultCard, CalcResultGrid } from "./CalcResult";

type PeriodType = "daily" | "weekly" | "monthly" | "yearly";

const PERIOD_OPTIONS: { id: PeriodType; label: string }[] = [
    { id: "daily", label: "Daily" },
    { id: "weekly", label: "Weekly" },
    { id: "monthly", label: "Monthly" },
    { id: "yearly", label: "Yearly" },
];

export function CompoundingCalc() {
    const [inputs, setInputs] = useState({
        startBalance: 10000,
        gainPercent: 5,
        periods: 12,
        periodType: "monthly" as PeriodType,
        addition: 0,
        withdrawal: 0,
    });

    const results = useMemo(() => {
        const data: number[] = [inputs.startBalance];
        let balance = inputs.startBalance;
        const periodCount = Math.min(inputs.periods, 120);

        for (let i = 0; i < periodCount; i++) {
            balance = balance * (1 + inputs.gainPercent / 100);
            balance += inputs.addition;
            balance -= inputs.withdrawal;
            balance = Math.max(balance, 0);
            data.push(balance);
        }

        const totalContributions = inputs.addition * periodCount;
        const totalWithdrawals = inputs.withdrawal * periodCount;
        const totalProfit = balance - inputs.startBalance - totalContributions + totalWithdrawals;
        const totalReturn = inputs.startBalance > 0 ? ((balance - inputs.startBalance) / inputs.startBalance) * 100 : 0;

        return { finalBalance: balance, totalProfit, totalReturn, data, totalContributions };
    }, [inputs]);

    const maxVal = Math.max(...results.data, 1);

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-6">
                    <CalcInput
                        label="Starting Balance"
                        value={inputs.startBalance}
                        onChange={(v) => setInputs({ ...inputs, startBalance: parseFloat(v) || 0 })}
                        suffix="$"
                    />
                    <CalcInput
                        label="Gain per Period"
                        value={inputs.gainPercent}
                        onChange={(v) => setInputs({ ...inputs, gainPercent: parseFloat(v) || 0 })}
                        step="0.1"
                        suffix="%"
                    />
                </div>

                {/* Period Type */}
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Period Type</label>
                    <div className="flex bg-gray-100 dark:bg-white/5 p-1 rounded-xl gap-1">
                        {PERIOD_OPTIONS.map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => setInputs({ ...inputs, periodType: opt.id })}
                                className={cn(
                                    "relative flex-1 py-2.5 rounded-lg font-bold text-xs transition-colors z-10",
                                    inputs.periodType === opt.id
                                        ? "text-white"
                                        : "text-gray-500 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                                )}
                            >
                                {inputs.periodType === opt.id && (
                                    <motion.div
                                        layoutId="activeCompoundPeriod"
                                        className="absolute inset-0 bg-gradient-to-r from-primary to-teal-500 rounded-lg shadow-sm -z-10"
                                        transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
                                    />
                                )}
                                {opt.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="grid sm:grid-cols-3 gap-6">
                    <CalcInput
                        label="Periods"
                        value={inputs.periods}
                        onChange={(v) => setInputs({ ...inputs, periods: parseInt(v) || 1 })}
                    />
                    <CalcInput
                        label="Addition"
                        value={inputs.addition}
                        onChange={(v) => setInputs({ ...inputs, addition: parseFloat(v) || 0 })}
                        suffix="$"
                    />
                    <CalcInput
                        label="Withdrawal"
                        value={inputs.withdrawal}
                        onChange={(v) => setInputs({ ...inputs, withdrawal: parseFloat(v) || 0 })}
                        suffix="$"
                    />
                </div>
            </div>

            <div className="space-y-4">
                {/* Mini chart */}
                <div className="bg-white dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 p-4">
                    <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-3">Growth Projection</p>
                    <div className="flex items-end gap-0.5 h-32">
                        {results.data.map((val, idx) => (
                            <div
                                key={idx}
                                className="flex-1 bg-gradient-to-t from-primary to-cyan-500 rounded-t opacity-80 hover:opacity-100 transition-opacity min-w-[2px]"
                                style={{ height: `${(val / maxVal) * 100}%` }}
                                title={`Period ${idx}: $${val.toFixed(0)}`}
                            />
                        ))}
                    </div>
                </div>

                <CalcResultPrimary
                    label="Final Balance"
                    value={`$${results.finalBalance.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                />

                <CalcResultGrid cols={3}>
                    <CalcResultCard
                        label="Total Profit"
                        value={`$${results.totalProfit.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                        valueColor="text-green-600 dark:text-green-400"
                    />
                    <CalcResultCard
                        label="Total Return"
                        value={`${results.totalReturn.toFixed(1)}%`}
                    />
                    <CalcResultCard
                        label="Contributions"
                        value={`$${results.totalContributions.toLocaleString('en-US', { maximumFractionDigits: 0 })}`}
                    />
                </CalcResultGrid>
            </div>
        </div>
    );
}
