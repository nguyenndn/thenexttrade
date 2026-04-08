import { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { parseLocalStartOfDay, parseLocalEndOfDay } from "@/lib/utils";
import { getIntelligenceData } from "@/lib/smart-analytics";
import { IntelligenceDashboard } from "@/components/analytics/IntelligenceDashboard";
import { DashboardFilter } from "@/components/dashboard/DashboardFilter";
import { TabBar } from "@/components/ui/TabBar";
import { PageHeader } from "@/components/ui/PageHeader";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Trading Intelligence | Dashboard",
    description: "AI-powered insights from your trading data",
};

const analyticsTabs = [
    { label: "Analytics", href: "/dashboard/analytics" },
    { label: "Reports", href: "/dashboard/reports" },
    { label: "Mistakes", href: "/dashboard/mistakes" },
    { label: "Intelligence", href: "/dashboard/intelligence" },
];

export default async function IntelligencePage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    const user = await getAuthUser();

    if (!user) {
        redirect("/auth/login");
    }

    // Account filter
    let accountId = resolvedParams?.accountId as string | undefined;

    if (!accountId) {
        const cookieStore = await cookies();
        const lastAccountId = cookieStore.get("last_account_id")?.value;

        if (lastAccountId) {
            const cookieAccountExists = await prisma.tradingAccount.findFirst({
                where: { id: lastAccountId, userId: user.id },
                select: { id: true },
            });
            if (cookieAccountExists) {
                accountId = lastAccountId;
            }
        }

        if (!accountId) {
            const firstAccount = await prisma.tradingAccount.findFirst({
                where: { userId: user.id },
                orderBy: { createdAt: "desc" },
                select: { id: true },
            });
            if (firstAccount) {
                accountId = firstAccount.id;
            }
        }
    }

    // Date range
    const startDateParam = resolvedParams?.from as string;
    const endDateParam = resolvedParams?.to as string;

    let accountTimezone: string | undefined;
    if (accountId) {
        const acc = await prisma.tradingAccount.findFirst({
            where: { id: accountId, userId: user.id },
            select: { timezone: true },
        });
        accountTimezone = acc?.timezone || undefined;
    }

    const startDate = parseLocalStartOfDay(startDateParam, accountTimezone);
    const endDate = parseLocalEndOfDay(endDateParam, accountTimezone);

    return (
        <div className="space-y-4">
            <PageHeader
                title="Trading Intelligence"
                description="Pattern detection and insights from your trading data."
            >
                <DashboardFilter currentAccountId={accountId ?? undefined} hideDateFilter />
            </PageHeader>
            <div className="mb-4">
                <TabBar tabs={analyticsTabs} equalWidth />
            </div>
            <Suspense
                key={JSON.stringify(resolvedParams)}
                fallback={<IntelligenceLoadingSkeleton />}
            >
                <IntelligenceDataLoader
                    userId={user.id}
                    accountId={accountId}
                    startDate={startDate}
                    endDate={endDate}
                    timezone={accountTimezone}
                />
            </Suspense>
        </div>
    );
}

async function IntelligenceDataLoader({
    userId,
    accountId,
    startDate,
    endDate,
    timezone,
}: {
    userId: string;
    accountId?: string;
    startDate?: Date;
    endDate?: Date;
    timezone?: string;
}) {
    const data = await getIntelligenceData(userId, accountId, startDate, endDate, timezone);

    return <IntelligenceDashboard data={data} />;
}

function IntelligenceLoadingSkeleton() {
    return (
        <div className="space-y-4 animate-in fade-in">
            <div className="flex items-center gap-3">
                <div className="h-6 w-40 bg-gray-200 dark:bg-white/5 rounded-lg animate-pulse" />
                <div className="h-6 w-20 bg-gray-200 dark:bg-white/5 rounded-full animate-pulse" />
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                <div className="lg:col-span-4 xl:col-span-3">
                    <div className="bg-white dark:bg-[#1E2028] rounded-xl p-8 border border-gray-200 dark:border-white/10 h-72 animate-pulse" />
                </div>
                <div className="lg:col-span-8 xl:col-span-9 space-y-3">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="bg-white dark:bg-[#1E2028] rounded-xl p-5 border border-gray-200 dark:border-white/10 h-28 animate-pulse"
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}
