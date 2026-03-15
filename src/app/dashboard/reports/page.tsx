import { Metadata } from "next";
import { ReportsDashboard } from "@/components/reports/ReportsDashboard";
import { TabBar } from "@/components/ui/TabBar";

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
            <div className="mb-4">
                <p className="text-base text-primary font-semibold border-l-4 border-primary bg-primary/5 dark:bg-primary/10 rounded-r-lg px-4 py-2 w-fit">Download reports and trade data.</p>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                <TabBar tabs={analyticsTabs} />
            </div>

            <ReportsDashboard />
        </div>
    );
}
