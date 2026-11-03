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

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Weekly Review | TheNextTrade",
    description: "Review your weekly trading performance and patterns",
};

export default async function WeeklyReviewPage({
    searchParams,
}: {
    searchParams?: Promise<{ accountId?: string }>;
}) {
    const user = await getAuthUser();
    if (!user) redirect("/auth/login");

    const resolved = searchParams ? await searchParams : undefined;
    const defaultAccId = await resolveDefaultAccountId(user.id);
    const accountId = resolved?.accountId || defaultAccId || "all";

    const { reports, total } = await getReports("WEEKLY", 1, 20);

    return (
        <div className="space-y-4">
            <PageHeader
                title="Weekly Review"
                description="Your automated weekly trading report — track progress and improve consistency."
            />
            <div className="mb-4">
                <TabBar tabs={ANALYTICS_TABS} />
            </div>

            <TargetProgressWidget accountId={accountId} highlightPeriod="WEEKLY" />

            <ReportView reports={reports as any} total={total} type="weekly" />
        </div>
    );
}
