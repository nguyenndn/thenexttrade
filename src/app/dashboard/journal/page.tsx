import JournalList from "@/components/journal/JournalList";
import { Metadata } from "next";
import { getJournalEntries } from "@/actions/journal";
import { getStrategies } from "@/actions/strategies";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Trading Journal | GSN CRM",
    description: "Your trading history",
};

export default async function JournalPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;

    // Parse Pagination
    const page = typeof resolvedParams.page === "string" ? parseInt(resolvedParams.page) : 1;
    const limit = typeof resolvedParams.limit === "string" ? parseInt(resolvedParams.limit) : 20;

    // Parse Filters
    const accountId = typeof resolvedParams.accountId === "string" ? resolvedParams.accountId : undefined;
    const symbol = typeof resolvedParams.symbol === "string" ? resolvedParams.symbol : undefined;
    const status = typeof resolvedParams.type === "string" && resolvedParams.type !== "ALL" ? resolvedParams.type : undefined; // Mapped 'type' param to status/type filter?
    // Wait, JournalList uses 'type' (BUY/SELL) but 'status' (WIN/LOSS). 
    // getJournalEntries has 'status' (WIN/LOSS) but I need to check if it filters by TYPE (BUY/SELL).
    // The action `getJournalEntries` in `journal.ts` has `status` filter but NO `type` filter logic in `where`.
    // I need to add `type` filter to `getJournalEntries` in `journal.ts`.

    // Let's assume I fix the action in the next step.
    const type = typeof resolvedParams.type === "string" && resolvedParams.type !== "ALL" ? resolvedParams.type : undefined;

    const dateFrom = typeof resolvedParams.from === "string" ? resolvedParams.from : undefined;
    const dateTo = typeof resolvedParams.to === "string" ? resolvedParams.to : undefined;

    const sortBy = typeof resolvedParams.sort === "string" ? resolvedParams.sort : undefined;
    const sortOrder = typeof resolvedParams.dir === "string" && (resolvedParams.dir === "asc" || resolvedParams.dir === "desc") ? resolvedParams.dir : undefined;

    const { entries, meta } = await getJournalEntries(page, limit, {
        accountId,
        symbol,
        type,
        dateFrom,
        dateTo,
        sortBy,
        sortOrder,
    });

    const { strategies } = await getStrategies();

    return (
        <div className="space-y-6">
            <JournalList initialEntries={entries} meta={meta} strategies={strategies} />
        </div>
    );
}
