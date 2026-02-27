import { Metadata } from "next";
import { ReportsDashboard } from "@/components/reports/ReportsDashboard";

export const metadata: Metadata = {
    title: "Export Reports | Trading Dashboard",
    description: "Generate and download trading reports and CSV exports",
};

export default function ReportsPage() {
    return (
        <div className="space-y-4">
            <div className="flex flex-col gap-2 border-b border-gray-100 dark:border-white/5 pb-8 mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-1.5 h-8 bg-primary rounded-full"></div>
                    <h1 className="text-2xl font-black text-gray-900 dark:text-white tracking-tighter">
                        Export Reports
                    </h1>
                </div>
                <p className="text-lg text-gray-500 dark:text-gray-400 font-medium pl-4.5">
                    Download performance reports and trade data for offline analysis.
                </p>
            </div>

            <ReportsDashboard />
        </div>
    );
}
