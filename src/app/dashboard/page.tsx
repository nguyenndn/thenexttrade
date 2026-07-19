import { Suspense } from "react";
import DashboardSkeleton from "@/components/dashboard/loading/DashboardSkeleton";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { getUserTradingDataState } from "@/lib/trading-data-state";

import DashboardClient from "./DashboardClient";
import { TradingAlertBanner } from "@/components/dashboard/TradingAlertBanner";
import {
    resolveAccountAndDates,
    getEmptyDashboardData,
    getFullDashboardData,
} from "./dashboard-data.server";
import { getUserDashboards } from "@/actions/dashboard";

export const dynamic = "force-dynamic";

export default async function DashboardPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;

    return (
        <Suspense fallback={<DashboardSkeleton />}>
            <DashboardLoader searchParams={resolvedParams} />
        </Suspense>
    );
}

async function DashboardLoader({
    searchParams,
}: {
    searchParams: { [key: string]: string | string[] | undefined };
}) {
    const user = await getAuthUser();

    if (!user) {
        redirect("/auth/login");
    }

    // 1. Resolve account & date params (handles redirect if needed)
    const params = await resolveAccountAndDates(user.id, searchParams);

    // 2. Short-circuit for users with 0 trades globally
    const tradingDataState = await getUserTradingDataState(user.id);
    const globalTradeCount = tradingDataState.tradeCount;

    if (globalTradeCount === 0) {
        const [data, initialDashboards] = await Promise.all([
            getEmptyDashboardData(
                user.id,
                params.accountId,
                params.fromParam,
                params.toParam
            ),
            getUserDashboards(),
        ]);
        return (
            <>
                <TradingAlertBanner />
                <DashboardClient
                    {...data}
                    initialDashboards={initialDashboards}
                />
            </>
        );
    }

    // 3. Full dashboard data fetch
    const [data, initialDashboards] = await Promise.all([
        getFullDashboardData(user.id, params, globalTradeCount),
        getUserDashboards(),
    ]);

    return (
        <>
            <TradingAlertBanner />
            <DashboardClient {...data} initialDashboards={initialDashboards} />
        </>
    );
}
