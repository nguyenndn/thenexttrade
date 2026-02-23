import { SessionDashboard } from "@/components/sessions/SessionDashboard";
import { Metadata } from "next";
import { Suspense } from "react";
import { Loader2 } from "lucide-react";

export const metadata: Metadata = {
    title: "Session Analysis | GSN CRM",
    description: "Analyze your trading performance by market session and time of day",
};

export default function SessionAnalysisPage() {
    return (
        <div className="space-y-4">
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
