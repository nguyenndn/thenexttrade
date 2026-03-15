import { Metadata } from "next";
import { ReportsDashboard } from "@/components/reports/ReportsDashboard";
import { TabBar } from "@/components/ui/TabBar";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata: Metadata = {
    title: "Export Reports | Trading Dashboard",
    description: "Generate and download trading reports and CSV exports",
};

const analyticsTabs = [
    { label: "Analytics", href: "/dashboard/analytics" },
    { label: "Reports", href: "/dashboard/reports" },
    { label: "Mistakes", href: "/dashboard/mistakes" },
];

export default function ReportsPage() {
    return (
        <div className="space-y-4">
            <PageHeader
                title="Reports"
                description="Download reports and trade data."
            />
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                <TabBar tabs={analyticsTabs} equalWidth />
            </div>

            <ReportsDashboard />
        </div>
    );
}
