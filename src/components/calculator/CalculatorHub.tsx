"use client";

import { useState } from "react";
import { Calculator, Target, DollarSign, Percent, TrendingUp } from "lucide-react";
import { PositionSizeCalc } from "./PositionSizeCalc";
import { RiskRewardCalc } from "./RiskRewardCalc";
import { PipValueCalc } from "./PipValueCalc";
import { MarginCalc } from "./MarginCalc";
import { ProfitLossCalc } from "./ProfitLossCalc";

const CALCULATORS = [
    {
        id: "position-size",
        name: "Position Size",
        icon: Calculator,
        description: "Calculate lot size based on risk %",
    },
    {
        id: "risk-reward",
        name: "Risk/Reward",
        icon: Target,
        description: "Calculate R:R ratio",
    },
    {
        id: "pip-value",
        name: "Pip Value",
        icon: DollarSign,
        description: "Pip value by currency pair",
    },
    {
        id: "margin",
        name: "Margin",
        icon: Percent,
        description: "Required margin for position",
    },
    {
        id: "profit-loss",
        name: "Profit/Loss",
        icon: TrendingUp,
        description: "Calculate potential P/L",
    },
];

export function CalculatorHub() {
    const [activeCalc, setActiveCalc] = useState("position-size");

    return (
        <div className="space-y-8">
            {/* Tabs */}
            {/* Tabs */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 bg-gray-100 dark:bg-white/5 p-1.5 rounded-2xl w-full">
                {CALCULATORS.map((calc) => {
                    const Icon = calc.icon;
                    return (
                        <button
                            key={calc.id}
                            onClick={() => setActiveCalc(calc.id)}
                            className={`
                flex items-center justify-center gap-2 px-2 py-2.5 rounded-xl font-bold text-sm transition-all
                ${activeCalc === calc.id
                                    ? "bg-white dark:bg-[#1E2028] text-[#00C888] shadow-[0_2px_10px_-2px_rgba(0,0,0,0.1)] dark:shadow-none scale-100"
                                    : "text-gray-500 hover:text-gray-900 dark:hover:text-white hover:bg-black/5 dark:hover:bg-white/5 scale-95 hover:scale-100"
                                }
              `}
                        >
                            <Icon size={18} className={activeCalc === calc.id ? "text-[#00C888]" : "opacity-70"} />
                            <span className="truncate">{calc.name}</span>
                        </button>
                    );
                })}
            </div>

            {/* active tab description mobile only */}
            <div className="sm:hidden text-center -mt-4">
                <p className="text-sm font-medium text-gray-500">
                    {CALCULATORS.find(c => c.id === activeCalc)?.name}
                </p>
            </div>

            {/* Content Area */}
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {activeCalc === "position-size" && <PositionSizeCalc />}
                {activeCalc === "risk-reward" && <RiskRewardCalc />}
                {activeCalc === "pip-value" && <PipValueCalc />}
                {activeCalc === "margin" && <MarginCalc />}
                {activeCalc === "profit-loss" && <ProfitLossCalc />}
            </div>
        </div>
    );
}
