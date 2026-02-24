import { MistakeDashboard } from "@/components/mistakes/MistakeDashboard";
import { PageHeader } from "@/components/ui/PageHeader";

export const metadata = {
    title: "Mistake Analysis | GSN CRM",
    description: "Track and analyze your trading mistakes to improve performance.",
};

export default function MistakeAnalysisPage() {
    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-2 mb-8">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-[#00C888] rounded-full"></div>
                        <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight">
                            Mistake Tracking
                        </h1>
                    </div>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-medium pl-4.5">
                    Identify performance leaks and correct your behavior.
                </p>
            </div>

            <MistakeDashboard />
        </div>
    );
}
