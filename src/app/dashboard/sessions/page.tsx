import { SessionDashboard } from "@/components/sessions/SessionDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Session Analysis | GSN CRM",
    description: "Analyze your trading performance by market session and time of day",
};

export default function SessionAnalysisPage() {
    return (
        <div className="space-y-6">
            <SessionDashboard />
        </div>
    );
}
