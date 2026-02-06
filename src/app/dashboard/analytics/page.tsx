import { Metadata } from "next";
import { AnalyticsDashboard } from "@/components/analytics/AnalyticsDashboard";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Analytics | Trading Dashboard",
    description: "Analyze your trading performance",
};

export default function AnalyticsPage() {
    return (
        <div className="space-y-6">
            <AnalyticsDashboard />
        </div>
    );
}
