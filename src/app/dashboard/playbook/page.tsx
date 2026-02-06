import { Metadata } from "next";
import { PlaybookDashboard } from "@/components/playbook/PlaybookDashboard";

export const metadata: Metadata = {
    title: "Trading Playbook | GSN CRM",
    description: "Visual gallery of your trading setups and patterns",
};

export default function PlaybookPage() {
    return (
        <div className="space-y-6">
            <PlaybookDashboard />
        </div>
    );
}
