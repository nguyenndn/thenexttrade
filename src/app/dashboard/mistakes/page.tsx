import { MistakeDashboard } from "@/components/mistakes/MistakeDashboard";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = {
    title: "Mistake Analysis | GSN CRM",
    description: "Track and analyze your trading mistakes to improve performance.",
};

export default function MistakeAnalysisPage() {
    return (
        <div className="space-y-6">
            <PageHeader 
                title="Mistake Tracking" 
                description="Identify performance leaks and correct your behavior."
            />

            <MistakeDashboard />
        </div>
    );
}
