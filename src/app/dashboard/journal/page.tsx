import JournalList from "@/components/journal/JournalList";
import { Metadata } from "next";
import { getJournalEntries, getUserTags } from "@/actions/journal";
import { getStrategies } from "@/actions/strategies";
import { getTradePlans } from "@/actions/trade-plans";
import { redirect } from "next/navigation";
import { format, startOfMonth } from "date-fns";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { getUserTradingDataState } from "@/lib/trading-data-state";

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
 const user = await getAuthUser();

 if (!user) {
 redirect("/auth/login");
 }

 // Start independent account-state work before parsing the filters so it can
 // run in parallel with the account timezone lookup below.
 const tradingDataStatePromise = getUserTradingDataState(user.id);

 // Parse Pagination
 const page = typeof resolvedParams.page === "string" ? parseInt(resolvedParams.page) : 1;
 const limit = typeof resolvedParams.limit === "string" ? parseInt(resolvedParams.limit) : 20;

 // Parse Filters
 const accountId = typeof resolvedParams.accountId === "string" ? resolvedParams.accountId : undefined;
 const symbol = typeof resolvedParams.symbol === "string" ? resolvedParams.symbol : undefined;
 const type = typeof resolvedParams.type === "string" && resolvedParams.type !== "ALL" ? resolvedParams.type : undefined;
 const tag = typeof resolvedParams.tag === "string" && resolvedParams.tag !== "ALL" ? resolvedParams.tag : undefined;
 const strategy = typeof resolvedParams.strategy === "string" ? resolvedParams.strategy : undefined;
 const status = typeof resolvedParams.status === "string" && resolvedParams.status !== "ALL" ? resolvedParams.status : undefined;

 let dateFrom = typeof resolvedParams.from === "string" ? resolvedParams.from : undefined;
 let dateTo = typeof resolvedParams.to === "string" ? resolvedParams.to : undefined;

  // Use the default range in this request. Redirecting here made Journal fetch
  // its auth/state/query stack twice on a cold navigation.
  if (!dateFrom || !dateTo) {
    const now = new Date();
    const startMonthStr = format(startOfMonth(now), 'yyyy-MM-dd');
    const todayStr = format(now, 'yyyy-MM-dd');
    dateFrom = dateFrom || startMonthStr;
    dateTo = dateTo || todayStr;
  }

 const sortBy = typeof resolvedParams.sort === "string" ? resolvedParams.sort : undefined;
 const sortOrder = typeof resolvedParams.dir === "string" && (resolvedParams.dir === "asc" || resolvedParams.dir === "desc") ? resolvedParams.dir : undefined;

 // Fetch account timezone for broker-aligned day boundaries in parallel with
 // the user data-state check. The journal query starts once both are ready.
 const accountTimezonePromise = accountId
   ? prisma.tradingAccount.findFirst({
       where: { id: accountId, userId: user.id },
       select: { timezone: true },
     }).then((account) => account?.timezone || undefined)
   : Promise.resolve(undefined);

 const [tradingDataState, accountTimezone] = await Promise.all([
   tradingDataStatePromise,
   accountTimezonePromise,
 ]);

 const [{ entries, meta, stats }, { strategies }, userTags, tradePlans] = await Promise.all([
 getJournalEntries(page, limit, {
 accountId,
 symbol,
 type,
 status,
 tag,
 strategy,
 dateFrom,
 dateTo,
 sortBy,
 sortOrder,
 timezone: accountTimezone,
 }),
 getStrategies(),
 getUserTags(),
 getTradePlans(),
 ]);

 return (
 <div className="space-y-4">
 <JournalList
 initialEntries={entries}
 meta={meta}
 initialStats={stats}
 strategies={strategies}
 userTags={userTags}
 hasTradeData={tradingDataState.hasTradeData}
 initialTradePlans={tradePlans}
 />
 </div>
 );
}
