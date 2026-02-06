import { Metadata } from "next";
import { StrategyManager } from "@/components/strategies/StrategyManager";

export const metadata: Metadata = {
    title: "Strategies | Trading Dashboard",
    description: "Manage your trading strategies",
};

export default function StrategiesPage() {
    return (
        <div className="space-y-6">
            <StrategyManager />
        </div>
    );
}
