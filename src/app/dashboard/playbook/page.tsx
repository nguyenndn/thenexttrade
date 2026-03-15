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
    const symbol = typeof resolvedParams.symbol === "string" ? resolvedParams.symbol : typeof resolvedParams.search === "string" ? resolvedParams.search : undefined;
    const filter = typeof resolvedParams.filter === "string" ? (resolvedParams.filter === "WIN" || resolvedParams.filter === "LOSS" ? resolvedParams.filter : undefined) : undefined;

    const { entries, meta } = await getJournalEntries(page, limit, {
        accountId,
        symbol,
        status: filter,
        hasImages: true, // Only fetch entries with images for Playbook
    });

    return (
        <div className="space-y-4">
            <PlaybookDashboard initialEntries={entries as any} meta={meta} />
        </div>
    );
}
