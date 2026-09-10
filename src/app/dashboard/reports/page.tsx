import { Metadata } from "next";
import { ReportsDashboard } from "@/components/reports/ReportsDashboard";
import { TabBar } from "@/components/ui/TabBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { ANALYTICS_TABS } from "@/config/navigation";

export const metadata: Metadata = {
    title: "Performance Reports & Trade History Export | TheNextTrade",
    description: "Export execution logs, comprehensive audit reports, and trade history in PDF and CSV formats.",
};

export default function ReportsPage() {
    return (
        <div className="space-y-4">
            <PageHeader
                title="Execution Reports"
                description="Generate institutional audit reports, period summaries, and trade history exports."
            />
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                <TabBar tabs={ANALYTICS_TABS} />
            </div>

            <ReportsDashboard />
        </div>
    );
}
