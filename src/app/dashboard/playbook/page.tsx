import { Metadata } from "next";
import { PlaybookDashboard } from "@/components/playbook/PlaybookDashboard";
import { getJournalEntries } from "@/actions/journal";
import { getAuthUser } from "@/lib/auth-cache";
import { redirect } from "next/navigation";

export const metadata: Metadata = {
    title: "Trading Playbook | GSN CRM",
    description: "Visual gallery of your trading setups and patterns",
};

export default async function PlaybookPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const user = await getAuthUser();
    if (!user) redirect("/auth/signin");

    const resolvedParams = await searchParams;
    const page = typeof resolvedParams.page === "string" ? parseInt(resolvedParams.page) : 1;
    const limit = typeof resolvedParams.limit === "string" ? parseInt(resolvedParams.limit) : 12; // Grid view needs more items
    const accountId = typeof resolvedParams.accountId === "string" ? resolvedParams.accountId : undefined;
    const symbol = typeof resolvedParams.symbol === "string" ? resolvedParams.symbol : undefined;

    const { entries, meta } = await getJournalEntries(page, limit, {
        accountId,
        symbol,
        hasImages: true, // Only fetch entries with images for Playbook
    });

    return (
        <div className="space-y-6">
            <PlaybookDashboard initialEntries={entries} meta={meta} />
        </div>
    );
}
