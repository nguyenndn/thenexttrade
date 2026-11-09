import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { getReports } from "@/actions/reports";
import { ReportView } from "@/components/reports/ReportView";
import { TabBar } from "@/components/ui/TabBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { ANALYTICS_TABS } from "@/config/navigation";
import { TargetProgressWidget } from "@/components/dashboard/targets/TargetProgressWidget";
import { resolveDefaultAccountId } from "@/actions/main-account";
import { prisma } from "@/lib/prisma";
import { normalizeCurrencyCode } from "@/lib/utils/cent-account";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Monthly Review | TheNextTrade",
    description: "Review your monthly trading performance and long-term progress",
};

export default async function MonthlyReviewPage({
    searchParams,
}: {
    searchParams?: Promise<{ accountId?: string }>;
}) {
    const user = await getAuthUser();
    if (!user) redirect("/auth/login");

    const resolved = searchParams ? await searchParams : undefined;
    const defaultAccId = await resolveDefaultAccountId(user.id);
    const accountId = resolved?.accountId || defaultAccId || "all";

    const [reportRes, targetAcc] = await Promise.all([
        getReports("MONTHLY", 1, 20),
        prisma.tradingAccount.findFirst({
            where: {
                userId: user.id,
                ...(accountId !== "all" ? { id: accountId } : {}),
            },
            select: { currency: true, server: true },
        }),
    ]);
    const { reports, total } = reportRes;
    const accountCurrency = normalizeCurrencyCode(
        targetAcc?.currency,
        targetAcc?.server
    );

    return (
        <div className="space-y-4">
            <PageHeader
                title="Monthly Review"
                description="Your automated monthly trading report — big picture performance trends."
            />
            <div className="mb-4">
                <TabBar tabs={ANALYTICS_TABS} />
            </div>

            <TargetProgressWidget accountId={accountId} highlightPeriod="MONTHLY" />

            <ReportView
                reports={reports as any}
                total={total}
                type="monthly"
                currency={accountCurrency}
            />
        </div>
    );
}
