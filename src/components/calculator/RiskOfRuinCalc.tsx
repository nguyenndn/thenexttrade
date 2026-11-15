"use client";

import { useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { CalcResultCard, CalcResultGrid } from "./CalcResult";

export function RiskOfRuinCalc() {
    const [inputs, setInputs] = useState({
        winRate: 55,
        riskPerTrade: 2,
        rewardRisk: 1.5,
        ruinThreshold: 50,
    });

    const results = useMemo(() => {
        const w = Math.min(1, Math.max(0, inputs.winRate / 100));
        const lossRate = 1 - w;
        const r = inputs.riskPerTrade / 100;
        const rr = inputs.rewardRisk;

        if (r <= 0 || inputs.ruinThreshold <= 0) {
            return {
                ror: 0,
                expectancy: 0,
                edge: 0,
                survival: 100,
            };
        }

        const edge = w * rr - lossRate;
        const expectancy = edge * r;
        const capitalUnits = inputs.ruinThreshold / 100 / r;

        let ror: number;
        if (w >= 1) {
            ror = 0;
        } else if (expectancy <= 0 || rr <= 0) {
            ror = 100;
        } else {
            // Exact binary search root finding x in (0, 1) for:
            // f(x) = w * x^(1 + rr) - x + (1 - w) = 0
            let lo = 0;
            let hi = 1 - 1e-12;
            for (let i = 0; i < 80; i++) {
                const mid = (lo + hi) / 2;
                const fx = w * Math.pow(mid, 1 + rr) - mid + lossRate;
                if (fx > 0) {
                    lo = mid;
                } else {
                    hi = mid;
                }
            }
            const xRoot = (lo + hi) / 2;
            ror = Math.pow(xRoot, capitalUnits) * 100;
        }

        const finalRor = Number.isFinite(ror)
            ? Math.min(Math.max(0, ror), 100)
            : 0;

        return {
            ror: finalRor,
            expectancy: Number.isFinite(expectancy) ? expectancy * 100 : 0,
            edge: Number.isFinite(edge) ? edge : 0,
            survival: 100 - finalRor,
        };
    }, [inputs]);

    const getRiskColor = (ror: number) => {
        if (ror < 1)
            return {
                color: "text-green-600 dark:text-green-400",
                bg: "bg-green-500/10 border-green-500/20",
                label: "Excellent",
            };
        if (ror < 5)
            return {
                color: "text-yellow-600 dark:text-yellow-400",
                bg: "bg-yellow-500/10 border-yellow-500/20",
                label: "Acceptable",
            };
        if (ror < 25)
            return {
                color: "text-orange-600 dark:text-orange-400",
                bg: "bg-orange-500/10 border-orange-500/20",
                label: "Dangerous",
            };
        return {
            color: "text-red-600 dark:text-red-400",
            bg: "bg-red-500/10 border-red-500/20",
            label: "Critical",
        };
    };

    const risk = getRiskColor(results.ror);

    return (
        <div className="grid lg:grid-cols-2 gap-8">
            <div className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Win Rate:{" "}
                        <span className="text-primary">{inputs.winRate}%</span>
                    </label>
                    <input
                        type="range"
                        min="20"
                        max="80"
                        step="1"
                        value={inputs.winRate}
                        onChange={(e) =>
                            setInputs({
                                ...inputs,
                                winRate: parseInt(e.target.value),
                            })
                        }
                        className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>20%</span>
                        <span>50%</span>
                        <span>80%</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Risk Per Trade:{" "}
                        <span className="text-primary">
                            {inputs.riskPerTrade}%
                        </span>
                    </label>
                    <input
                        type="range"
                        min="0.5"
                        max="20"
                        step="0.5"
                        value={inputs.riskPerTrade}
                        onChange={(e) =>
                            setInputs({
                                ...inputs,
                                riskPerTrade: parseFloat(e.target.value),
                            })
                        }
                        className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>0.5%</span>
                        <span>10%</span>
                        <span>20%</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Reward/Risk Ratio:{" "}
                        <span className="text-primary">
                            1:{inputs.rewardRisk}
                        </span>
                    </label>
                    <input
                        type="range"
                        min="0.5"
                        max="5"
                        step="0.1"
                        value={inputs.rewardRisk}
                        onChange={(e) =>
                            setInputs({
                                ...inputs,
                                rewardRisk: parseFloat(e.target.value),
                            })
                        }
                        className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>1:0.5</span>
                        <span>1:2.5</span>
                        <span>1:5</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                        Ruin Threshold:{" "}
                        <span className="text-primary">
                            {inputs.ruinThreshold}%
                        </span>
                    </label>
                    <input
                        type="range"
                        min="10"
                        max="100"
                        step="5"
                        value={inputs.ruinThreshold}
                        onChange={(e) =>
                            setInputs({
                                ...inputs,
                                ruinThreshold: parseInt(e.target.value),
                            })
                        }
                        className="w-full accent-primary"
                    />
                    <div className="flex justify-between text-xs text-gray-500">
                        <span>10%</span>
                        <span>50%</span>
                        <span>100%</span>
                    </div>
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
                        Probability of Ruin
                    </p>
                    <p className={cn("text-5xl font-black font-mono tabular-nums mb-2", risk.color)}>
                        {results.ror === 0
                            ? "0.00"
                            : results.ror < 0.01
                              ? "< 0.01"
                              : results.ror.toFixed(2)}
                        %
                    </p>
                    <p className={cn("text-sm font-bold", risk.color)}>
                        {risk.label}
                    </p>
                </div>

                <CalcResultGrid cols={3}>
                    <CalcResultCard
                        label="Survival"
                        value={`${results.survival.toFixed(1)}%`}
                        valueColor="text-green-600 dark:text-green-400"
                    />
                    <CalcResultCard
                        label="Expectancy"
                        value={`${results.expectancy >= 0 ? "+" : ""}${results.expectancy.toFixed(2)}%`}
                        valueColor={
                            results.expectancy >= 0
                                ? "text-green-600 dark:text-green-400"
                                : "text-red-600 dark:text-red-400"
                        }
                    />
                    <CalcResultCard
                        label="Edge"
                        value={`${(results.edge * 100).toFixed(1)}%`}
                        valueColor={
                            results.edge >= 0
                                ? "text-primary"
                                : "text-red-600 dark:text-red-400"
                        }
                    />
                </CalcResultGrid>
            </div>
        </div>
    );
}
