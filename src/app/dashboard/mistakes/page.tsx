import { MistakeDashboard } from "@/components/mistakes/MistakeDashboard";
import { TabBar } from "@/components/ui/TabBar";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = {
    title: "Mistake Telemetry & Leak Detection | TheNextTrade",
    description:
        "Isolate recurring execution errors, calculate cost-per-mistake, and eliminate discipline leaks.",
};

const analyticsTabs = [
    { label: "Analytics", href: "/dashboard/analytics" },
    { label: "Reports", href: "/dashboard/reports" },
    { label: "Mistakes", href: "/dashboard/mistakes" },
    { label: "Intelligence", href: "/dashboard/intelligence" },
];

export default function MistakeAnalysisPage() {
    return (
        <div className="space-y-4">
            <PageHeader
                title="Mistake Analysis"
                description="Isolate behavioral errors, quantify leak impact, and enforce execution discipline."
            />
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                <TabBar tabs={analyticsTabs} />
            </div>

            <MistakeDashboard />
        </div>
    );
}
