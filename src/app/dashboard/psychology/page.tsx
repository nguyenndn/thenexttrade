import { PsychologyDashboard } from "@/components/psychology/PsychologyDashboard";
import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { getUserTradingDataState } from "@/lib/trading-data-state";

export const metadata: Metadata = {
    title: "Trading Psychology & Tilt Telemetry | TheNextTrade",
    description:
        "Analyze emotional execution triggers, confidence correlation, and plan adherence to control drawdown.",
};

export default async function PsychologyPage() {
    const user = await getAuthUser();

    if (!user) {
        redirect("/auth/login");
    }

    const tradingDataState = await getUserTradingDataState(user.id);

    return (
        <div className="space-y-4">
            <PsychologyDashboard hasTradeData={tradingDataState.hasTradeData} />
        </div>
    );
}
