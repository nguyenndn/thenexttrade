"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { CalcInput } from "./CalcInput";
import { CalcResultCard, CalcResultGrid } from "./CalcResult";

export function DrawdownCalc() {
    const [inputs, setInputs] = useState({
        balance: 10000,
        consecutiveLosses: 5,
        riskPercent: 2,
    });

    const results = useMemo(() => {
        const { balance, consecutiveLosses, riskPercent } = inputs;
        let remaining = balance;
        const losses: number[] = [];

        for (let i = 0; i < Math.min(consecutiveLosses, 50); i++) {
            const loss = remaining * (riskPercent / 100);
            remaining -= loss;
            losses.push(remaining);
        }

        const totalLoss = balance - remaining;
        const drawdownPct = balance > 0 ? (totalLoss / balance) * 100 : 0;
        const recoveryPct = remaining > 0 ? (totalLoss / remaining) * 100 : 0;

        const r = riskPercent / 100;
        const tradesToRecover = r > 0 && remaining > 0
            ? Math.ceil(Math.log(balance / remaining) / Math.log(1 + r))
            : 0;

        return { remaining, totalLoss, drawdownPct, recoveryPct, tradesToRecover, losses };
    }, [inputs]);

    const getSeverity = (pct: number) => {
        if (pct < 10) return { color: "text-green-600 dark:text-green-400", bg: "bg-green-500/10 border-green-500/20", label: "Recoverable" };
        if (pct < 25) return { color: "text-yellow-600 dark:text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/20", label: "Moderate" };
        if (pct < 50) return { color: "text-orange-600 dark:text-orange-400", bg: "bg-orange-500/10 border-orange-500/20", label: "Severe" };
        return { color: "text-red-600 dark:text-red-400", bg: "bg-red-500/10 border-red-500/20", label: "Critical" };
    };

    const severity = getSeverity(results.drawdownPct);

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <CalcInput
                    label="Starting Balance"
                    value={inputs.balance}
                    onChange={(v) => setInputs({ ...inputs, balance: parseFloat(v) || 0 })}
                    suffix="$"
                />

                <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Consecutive Losses: <span className="text-primary">{inputs.consecutiveLosses}</span>
                        </label>
                        <input
                            type="range"
                            min="1"
                            max="20"
                            value={inputs.consecutiveLosses}
                            onChange={(e) => setInputs({ ...inputs, consecutiveLosses: parseInt(e.target.value) })}
                            className="w-full accent-primary"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>1</span><span>10</span><span>20</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                            Risk Per Trade: <span className="text-primary">{inputs.riskPercent}%</span>
                        </label>
                        <input
                            type="range"
                            min="0.5"
                            max="10"
                            step="0.5"
                            value={inputs.riskPercent}
                            onChange={(e) => setInputs({ ...inputs, riskPercent: parseFloat(e.target.value) })}
                            className="w-full accent-primary"
                        />
                        <div className="flex justify-between text-xs text-gray-500">
                            <span>0.5%</span><span>5%</span><span>10%</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="space-y-4">
                <div className={cn("border p-6 rounded-2xl text-center shadow-lg", severity.bg)}>
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">Total Drawdown</p>
                    <p className={cn("text-5xl font-black mb-1", severity.color)}>
                        {results.drawdownPct.toFixed(1)}%
                    </p>
                    <p className={cn("text-sm font-bold", severity.color)}>{severity.label}</p>
                </div>

                <CalcResultGrid>
                    <CalcResultCard label="Remaining" value={`$${results.remaining.toFixed(0)}`} />
                    <CalcResultCard label="Total Loss" value={`-$${results.totalLoss.toFixed(0)}`} valueColor="text-red-600 dark:text-red-400" />
                    <CalcResultCard label="Recovery Needed" value={`${results.recoveryPct.toFixed(1)}%`} valueColor={severity.color} />
                    <CalcResultCard label="Trades to Recover" value={`${results.tradesToRecover}`} valueColor="text-primary" />
                </CalcResultGrid>
            </div>
        </div>
    );
}
