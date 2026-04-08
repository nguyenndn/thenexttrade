import JournalList from "@/components/journal/JournalList";
import { Metadata } from "next";
import { getJournalEntries, getUserTags } from "@/actions/journal";
import { getStrategies } from "@/actions/strategies";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Trading Journal | TheNextTrade",
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

    let dateFrom = typeof resolvedParams.from === "string" ? resolvedParams.from : undefined;
    let dateTo = typeof resolvedParams.to === "string" ? resolvedParams.to : undefined;

    // Auto-inject Today's date if missing
    if (!dateFrom || !dateTo) {
        const todayStr = format(new Date(), 'yyyy-MM-dd');
        dateFrom = dateFrom || todayStr;
        dateTo = dateTo || todayStr;

        const newParams = new URLSearchParams();
        Object.entries(resolvedParams).forEach(([key, val]) => {
            if (val !== undefined && key !== 'from' && key !== 'to') {
                newParams.append(key, String(val));
            }
        });
        newParams.append('from', dateFrom);
        newParams.append('to', dateTo);

        redirect(`/dashboard/journal?${newParams.toString()}`);
    }

    const sortBy = typeof resolvedParams.sort === "string" ? resolvedParams.sort : undefined;
    const sortOrder = typeof resolvedParams.dir === "string" && (resolvedParams.dir === "asc" || resolvedParams.dir === "desc") ? resolvedParams.dir : undefined;

    // Fetch account timezone for broker-aligned day boundaries
    let accountTimezone: string | undefined;
    const user = await getAuthUser();
    if (user && accountId) {
        const acc = await prisma.tradingAccount.findFirst({
            where: { id: accountId, userId: user.id },
            select: { timezone: true }
        });
        accountTimezone = acc?.timezone || undefined;
    }

    const [{ entries, meta, stats }, { strategies }, userTags] = await Promise.all([
        getJournalEntries(page, limit, {
            accountId,
            symbol,
            type,
            tag,
            dateFrom,
            dateTo,
            sortBy,
            sortOrder,
            timezone: accountTimezone,
        }),
        getStrategies(),
        getUserTags()
    ]);

    return (
        <div className="space-y-4">
            <JournalList initialEntries={entries} meta={meta} initialStats={stats} strategies={strategies} userTags={userTags} />
        </div>
    );
}
