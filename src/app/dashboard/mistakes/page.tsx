import { MistakeDashboard } from "@/components/mistakes/MistakeDashboard";
import { TabBar } from "@/components/ui/TabBar";
import { PageHeader } from "@/components/ui/PageHeader";
import { ANALYTICS_TABS } from "@/config/navigation";

export const metadata = {
    title: "Mistake Telemetry & Leak Detection | TheNextTrade",
    description:
        "Isolate recurring execution errors, calculate cost-per-mistake, and eliminate discipline leaks.",
};

export default function MistakeAnalysisPage() {
    return (
        <div className="space-y-4">
            <PageHeader
                title="Mistake Analysis"
                description="Isolate behavioral errors, quantify leak impact, and enforce execution discipline."
            />
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                <TabBar tabs={ANALYTICS_TABS} />
            </div>

            <MistakeDashboard />
        </div>
    );
}
