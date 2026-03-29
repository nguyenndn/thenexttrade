import { MistakeDashboard } from "@/components/mistakes/MistakeDashboard";
import { TabBar } from "@/components/ui/TabBar";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = {
    title: "Mistake Analysis | TheNextTrade",
    description: "Track and analyze your trading mistakes to improve performance.",
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
                description="Identify leaks and correct your behavior."
            />
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                <TabBar tabs={analyticsTabs} equalWidth />
            </div>

            <MistakeDashboard />
        </div>
    );
}
