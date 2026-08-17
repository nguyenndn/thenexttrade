import { SessionDashboard } from "@/components/sessions/SessionDashboard";
import { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { TabBar } from "@/components/ui/TabBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { DashboardFilter } from "@/components/dashboard/DashboardFilter";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { getUserTradingDataState } from "@/lib/trading-data-state";

export const metadata: Metadata = {
    title: "Session Analysis | TheNextTrade",
    description:
        "Analyze your trading performance by market session and time of day",
};

const journalTabs = [
    { label: "Trades", href: "/dashboard/journal" },
    { label: "Sessions", href: "/dashboard/sessions" },
];

export default async function SessionAnalysisPage() {
    const user = await getAuthUser();

    if (!user) {
        redirect("/auth/login");
    }

    const tradingDataState = await getUserTradingDataState(user.id);

    return (
        <div className="space-y-4">
            <PageHeader
                title="Sessions"
                description="Analyze your performance by market session."
            />
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                <TabBar tabs={journalTabs} />
                {tradingDataState.hasTradeData && (
                    <DashboardFilter equalWidth />
                )}
            </div>

            <Suspense
                fallback={
                    <div className="min-h-[400px] flex items-center justify-center">
                        <Loader2 className="w-8 h-8 animate-spin text-primary" />
                    </div>
                }
            >
                <SessionDashboard />
            </Suspense>
        </div>
    );
}
