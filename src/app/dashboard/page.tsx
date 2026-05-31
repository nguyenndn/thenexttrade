import { Suspense } from "react";
import DashboardSkeleton from "@/components/dashboard/loading/DashboardSkeleton";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";

import DashboardClient from "./DashboardClient";
import { TradingAlertBanner } from "@/components/dashboard/TradingAlertBanner";
import { resolveAccountAndDates, getEmptyDashboardData, getFullDashboardData } from "./dashboard-data.server";

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

async function DashboardLoader({ searchParams }: { searchParams: { [key: string]: string | string[] | undefined } }) {
    const user = await getAuthUser();

    if (!user) {
        redirect("/auth/login");
    }

    // 1. Resolve account & date params (handles redirect if needed)
    const params = await resolveAccountAndDates(user.id, searchParams);

    // 2. Short-circuit for users with 0 trades
    const globalTradeCount = await prisma.journalEntry.count({
        where: { userId: user.id },
        take: 1,
    });

    if (globalTradeCount === 0) {
        const data = await getEmptyDashboardData(user.id, params.accountId, params.fromParam, params.toParam);
        return (
            <>
                <TradingAlertBanner />
                <DashboardClient {...data} />
            </>
        );
    }

    // 3. Full dashboard data fetch
    const data = await getFullDashboardData(user.id, params, globalTradeCount);

    return (
        <>
            <TradingAlertBanner />
            <DashboardClient {...data} />
        </>
    );
}
