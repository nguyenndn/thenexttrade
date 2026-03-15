import { SessionDashboard } from "@/components/sessions/SessionDashboard";
import { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";
import { TabBar } from "@/components/ui/TabBar";
import { DashboardFilter } from "@/components/dashboard/DashboardFilter";

export const metadata: Metadata = {
    title: "Session Analysis | GSN CRM",
    description: "Analyze your trading performance by market session and time of day",
};

const journalTabs = [
    { label: "Trades", href: "/dashboard/journal" },
    { label: "Sessions", href: "/dashboard/sessions" },
];

export default function SessionAnalysisPage() {
    return (
        <div className="space-y-4">
            <div className="mb-4">
                <p className="text-base text-primary font-semibold border-l-4 border-primary bg-primary/5 dark:bg-primary/10 rounded-r-lg px-4 py-2 w-fit">Analyze your performance by market session.</p>
            </div>
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 mb-4">
                <TabBar tabs={journalTabs} />
                <DashboardFilter />
            </div>

            <Suspense fallback={
                <div className="min-h-[400px] flex items-center justify-center">
                    <Loader2 className="w-8 h-8 animate-spin text-primary" />
                </div>
            }>
                <SessionDashboard />
            </Suspense>
        </div>
    );
}
