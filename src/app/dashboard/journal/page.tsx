import JournalList from "@/components/journal/JournalList";
import { Metadata } from "next";
import { getJournalEntries, getUserTags } from "@/actions/journal";
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
    const type = typeof resolvedParams.type === "string" && resolvedParams.type !== "ALL" ? resolvedParams.type : undefined;
    const tag = typeof resolvedParams.tag === "string" && resolvedParams.tag !== "ALL" ? resolvedParams.tag : undefined;

    const dateFrom = typeof resolvedParams.from === "string" ? resolvedParams.from : undefined;
    const dateTo = typeof resolvedParams.to === "string" ? resolvedParams.to : undefined;

    const sortBy = typeof resolvedParams.sort === "string" ? resolvedParams.sort : undefined;
    const sortOrder = typeof resolvedParams.dir === "string" && (resolvedParams.dir === "asc" || resolvedParams.dir === "desc") ? resolvedParams.dir : undefined;

    const [{ entries, meta }, { strategies }, userTags] = await Promise.all([
        getJournalEntries(page, limit, {
            accountId,
            symbol,
            type,
            tag,
            dateFrom,
            dateTo,
            sortBy,
            sortOrder,
        }),
        getStrategies(),
        getUserTags()
    ]);

    return (
        <div className="space-y-6">
            <JournalList initialEntries={entries} meta={meta} strategies={strategies} userTags={userTags} />
        </div>
    );
}
