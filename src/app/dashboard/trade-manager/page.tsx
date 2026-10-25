import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { TradeManagerClient } from "@/components/dashboard/trade-manager/TradeManagerClient";

export const metadata: Metadata = {
    title: "Cloud MT5 Trade Manager | TheNextTrade",
    description:
        "Direct MT5 Cloud Trade Manager with 1-tap Breakeven, Secure Profit, Derisk, and 24/5 Price Alerts without PC or VPS.",
};

export default async function TradeManagerPage() {
    const user = await getAuthUser();
    if (!user) {
        redirect("/auth/login");
    }

    return <TradeManagerClient />;
}
