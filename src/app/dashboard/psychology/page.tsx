import { PsychologyDashboard } from "@/components/psychology/PsychologyDashboard";
import { Metadata } from "next";

export const metadata: Metadata = {
    title: "Psychology Tracking | GSN Trading",
    description: "Track your emotions and confidence to identify trading patterns.",
};

export default function PsychologyPage() {
    return (
        <div className="space-y-4">
            <PsychologyDashboard />
        </div>
    );
}
