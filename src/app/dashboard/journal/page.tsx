import JournalList from "@/components/journal/JournalList";
import { Metadata } from "next";
import { cookies } from "next/headers";
import { getJournalEntries, getUserTags } from "@/actions/journal";
import { getStrategies } from "@/actions/strategies";
import { redirect } from "next/navigation";
import { format, startOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { getUserTradingDataState } from "@/lib/trading-data-state";
import { SAMPLE_DATE_RANGE } from "@/lib/sample-data/mock-sample-data";
import { normalizeCurrencyCode } from "@/lib/utils/cent-account";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
    title: "Trading Journal & Execution Telemetry | TheNextTrade",
    description:
        "Detailed trade logs, execution telemetry, and performance verification.",
};

export default async function JournalPage({
    searchParams,
}: {
    searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
    const resolvedParams = await searchParams;
    const user = await getAuthUser();

    if (!user) {
        redirect("/auth/login");
    }

    // Start independent account-state work before parsing the filters so it can
    // run in parallel with the account timezone lookup below.
    const tradingDataStatePromise = getUserTradingDataState(user.id);

    // Parse Pagination
    const page =
        typeof resolvedParams.page === "string"
            ? parseInt(resolvedParams.page) || 1
            : 1;
    const limit =
        typeof resolvedParams.limit === "string"
            ? parseInt(resolvedParams.limit) || 20
            : 20;

    // Parse Filters & Validate Account Ownership
    const userAccounts = await prisma.tradingAccount.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "asc" },
        select: { id: true, timezone: true, currency: true, server: true },
    });

    const rawAccountId =
        typeof resolvedParams.accountId === "string"
            ? resolvedParams.accountId
            : undefined;
    const normalizedAccountId =
        rawAccountId && rawAccountId !== "all" ? rawAccountId : undefined;

    const cookieStore = await cookies();
    const isSampleMode =
        cookieStore.get("the_next_trade_sample_mode")?.value === "true";
    const rawSavedAccountId = cookieStore.get("last_account_id")?.value;
    const isAllAccounts =
        rawAccountId === "all" ||
        (!rawAccountId && rawSavedAccountId === "all");

    let accountId: string | undefined;
    if (isAllAccounts) {
        accountId = undefined;
    } else if (normalizedAccountId) {
        accountId = userAccounts.some((acc) => acc.id === normalizedAccountId)
            ? normalizedAccountId
            : undefined;
    } else {
        const validSavedAccountId =
            rawSavedAccountId &&
            userAccounts.some((acc) => acc.id === rawSavedAccountId)
                ? rawSavedAccountId
                : undefined;
        const { resolveDefaultAccountId } = await import(
            "@/actions/main-account"
        );
        const resolvedDefault = await resolveDefaultAccountId(
            user.id,
            validSavedAccountId
        );
        accountId =
            resolvedDefault &&
            userAccounts.some((acc) => acc.id === resolvedDefault)
                ? resolvedDefault
                : undefined;
    }

    const symbol =
        typeof resolvedParams.symbol === "string"
            ? resolvedParams.symbol
            : undefined;
    const type =
        typeof resolvedParams.type === "string" && resolvedParams.type !== "ALL"
            ? resolvedParams.type
            : undefined;
    const direction =
        typeof resolvedParams.direction === "string" &&
        resolvedParams.direction !== "ALL"
            ? resolvedParams.direction
            : undefined;
    const result =
        typeof resolvedParams.result === "string" &&
        resolvedParams.result !== "ALL"
            ? resolvedParams.result
            : undefined;
    const source =
        typeof resolvedParams.source === "string" &&
        resolvedParams.source !== "ALL"
            ? resolvedParams.source
            : undefined;
    const comment =
        typeof resolvedParams.comment === "string"
            ? resolvedParams.comment
            : undefined;
    const magicNumber =
        typeof resolvedParams.magicNumber === "string"
            ? resolvedParams.magicNumber
            : undefined;
    const tag =
        typeof resolvedParams.tag === "string" && resolvedParams.tag !== "ALL"
            ? resolvedParams.tag
            : undefined;
    const strategy =
        typeof resolvedParams.strategy === "string"
            ? resolvedParams.strategy
            : undefined;
    const status =
        typeof resolvedParams.status === "string" &&
        resolvedParams.status !== "ALL"
            ? resolvedParams.status
            : undefined;
    const reviewStatus =
        typeof resolvedParams.review === "string" &&
        (resolvedParams.review === "REVIEWED" ||
            resolvedParams.review === "UNREVIEWED")
            ? resolvedParams.review
            : undefined;

    let dateFrom =
        typeof resolvedParams.from === "string"
            ? resolvedParams.from
            : undefined;
    let dateTo =
        typeof resolvedParams.to === "string" ? resolvedParams.to : undefined;

    // Always default to Start of Month -> Today matching /dashboard, or SAMPLE_DATE_RANGE in sample mode
    if (!dateFrom || !dateTo) {
        if (isSampleMode) {
            dateFrom = dateFrom || SAMPLE_DATE_RANGE.from;
            dateTo = dateTo || SAMPLE_DATE_RANGE.to;
        } else {
            const now = new Date();
            const startMonthStr = format(startOfMonth(now), "yyyy-MM-dd");
            const todayStr = format(now, "yyyy-MM-dd");
            dateFrom = dateFrom || startMonthStr;
            dateTo = dateTo || todayStr;
        }
    }

    const sortBy =
        typeof resolvedParams.sort === "string"
            ? resolvedParams.sort
            : undefined;
    const sortOrder =
        typeof resolvedParams.dir === "string" &&
        (resolvedParams.dir === "asc" || resolvedParams.dir === "desc")
            ? resolvedParams.dir
            : undefined;

    const tradingDataState = await tradingDataStatePromise;
    const accountInfo = accountId
        ? userAccounts.find((acc) => acc.id === accountId)
        : undefined;
    const accountTimezone = accountId
        ? accountInfo?.timezone || undefined
        : undefined;
    const accountCurrency = accountId
        ? normalizeCurrencyCode(accountInfo?.currency, accountInfo?.server)
        : "USD";

    const [{ entries, meta, stats }, { strategies }, userTags] =
        await Promise.all([
            getJournalEntries(page, limit, {
                accountId: accountId || "all",
                symbol,
                type,
                direction,
                result,
                source,
                comment,
                magicNumber,
                status,
                tag,
                strategy,
                dateFrom,
                dateTo,
                sortBy,
                sortOrder,
                reviewStatus,
                timezone: accountTimezone,
            }),
            getStrategies(),
            getUserTags(),
        ]);

    return (
        <div className="space-y-2 md:space-y-4">
            <JournalList
                initialEntries={entries}
                meta={meta}
                initialStats={stats}
                strategies={strategies}
                userTags={userTags}
                hasTradeData={tradingDataState.hasTradeData}
                currentAccountId={accountId || "all"}
                currency={accountCurrency}
            />
        </div>
    );
}
