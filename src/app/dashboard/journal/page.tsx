
import JournalList from "@/components/journal/JournalList";
import { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Trading Journal | GSN CRM",
    description: "Your trading history",
};

export default function JournalPage() {
    return (
        <div className="space-y-6">
            <JournalList />
        </div>
    );
}
