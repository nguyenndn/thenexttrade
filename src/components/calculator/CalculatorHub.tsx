"use client";

import { Calculator, Target, DollarSign, Percent, TrendingUp } from "lucide-react";
import { PositionSizeCalc } from "./PositionSizeCalc";
import { RiskRewardCalc } from "./RiskRewardCalc";
import { PipValueCalc } from "./PipValueCalc";
import { MarginCalc } from "./MarginCalc";
import { ProfitLossCalc } from "./ProfitLossCalc";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/Tabs";

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
    return (
        <Tabs defaultValue="position-size" className="space-y-8">
            {/* Tabs */}
            <div className="w-full relative overflow-hidden rounded-xl">
                {/* 
                  We override TabsList default 'w-fit' with 'w-full' to ensure it takes full layout width.
                  And we force grid on mobile and tablet to preserve the previous look but with animations. 
                */}
                <TabsList className="grid grid-cols-2 md:grid-cols-5 gap-2 w-full !bg-gray-100 flex-wrap !dark:bg-white/5 p-1.5 h-auto">
                    {CALCULATORS.map((calc) => {
                        const Icon = calc.icon;
                        return (
                            <TabsTrigger
                                key={calc.id}
                                value={calc.id}
                                className="flex items-center justify-center gap-2 px-2 py-2.5 w-full dark:text-gray-300 [&[data-state=active]]:text-primary"
                            >
                                <Icon size={18} />
                                <span className="truncate">{calc.name}</span>
                            </TabsTrigger>
                        );
                    })}
                </TabsList>
            </div>

            {/* active tab description mobile only -> We can drop this or use CSS to show/hide, but since Tabs labels are visible, let's keep it simple. */}

            {/* Content Area */}
            <div>
                <TabsContent value="position-size"><PositionSizeCalc /></TabsContent>
                <TabsContent value="risk-reward"><RiskRewardCalc /></TabsContent>
                <TabsContent value="pip-value"><PipValueCalc /></TabsContent>
                <TabsContent value="margin"><MarginCalc /></TabsContent>
                <TabsContent value="profit-loss"><ProfitLossCalc /></TabsContent>
            </div>
        </Tabs>
    );
}
