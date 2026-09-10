import { Metadata } from "next";
import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { getReports } from "@/actions/reports";
import { ReportView } from "@/components/reports/ReportView";
import { TabBar } from "@/components/ui/TabBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { ANALYTICS_TABS } from "@/config/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Weekly Review | Trading Dashboard",
    description: "Review your weekly trading performance and patterns",
};

export default async function WeeklyReviewPage() {
    const user = await getAuthUser();
    if (!user) redirect("/auth/login");

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

            <ReportView reports={reports as any} total={total} type="weekly" />
        </div>
    );
}
