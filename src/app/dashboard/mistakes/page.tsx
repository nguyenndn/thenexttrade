import { MistakeDashboard } from "@/components/mistakes/MistakeDashboard";
import { TabBar } from "@/components/ui/TabBar";

export const metadata = {
    title: "Mistake Analysis | GSN CRM",
    description: "Track and analyze your trading mistakes to improve performance.",
};

const analyticsTabs = [
    { label: "Analytics", href: "/dashboard/analytics" },
    { label: "Reports", href: "/dashboard/reports" },
    { label: "Mistakes", href: "/dashboard/mistakes" },
];

export default function MistakeAnalysisPage() {
    return (
        <div className="space-y-4">
            <div className="mb-4">
                <p className="text-base text-primary font-semibold border-l-4 border-primary bg-primary/5 dark:bg-primary/10 rounded-r-lg px-4 py-2 w-fit">Identify leaks and correct your behavior.</p>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                <TabBar tabs={analyticsTabs} />
            </div>

            <MistakeDashboard />
        </div>
    );
}
