import { SessionDashboard } from "@/components/sessions/SessionDashboard";
import { Metadata } from "next";
import { Suspense } from "react";
import { cookies } from "next/headers";
import { TabBar } from "@/components/ui/TabBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { DashboardFilter } from "@/components/dashboard/DashboardFilter";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { getUserTradingDataState } from "@/lib/trading-data-state";
import { resolveDefaultAccountId } from "@/actions/main-account";

import { ANALYTICS_TABS } from "@/config/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Session Analysis | TheNextTrade",
    description:
        "Analyze your trading performance by market session and time of day",
};

export default async function SessionAnalysisPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    const user = await getAuthUser();

    if (!user) {
        redirect("/auth/login");
    }

    let accountId =
        typeof resolvedParams?.accountId === "string"
            ? resolvedParams.accountId
            : undefined;

    if (!accountId) {
        const cookieStore = await cookies();
        const lastAccountId = cookieStore.get("last_account_id")?.value;
        accountId = await resolveDefaultAccountId(user.id, lastAccountId);
    }

    const tradingDataState = await getUserTradingDataState(user.id);

    return (
        <div className="space-y-4">
            <PageHeader
                title="Sessions"
                description="Analyze your performance by market session."
            />
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                <TabBar tabs={ANALYTICS_TABS} />
                {tradingDataState.hasTradeData && (
                    <DashboardFilter
                        currentAccountId={accountId}
                        equalWidth
                    />
                )}
            </div>

            <Suspense
                fallback={
                    <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[1, 2, 3].map((i) => (
                                <div
                                    key={i}
                                    className="bg-white dark:bg-[#1E2028] rounded-xl p-6 border border-dashboard h-44 animate-pulse"
                                />
                            ))}
                        </div>
                        <div className="bg-white dark:bg-[#1E2028] rounded-xl p-6 border border-dashboard h-72 animate-pulse" />
                    </div>
                }
            >
                <SessionDashboard currentAccountId={accountId} />
            </Suspense>
        </div>
    );
}
