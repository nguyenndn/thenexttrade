import "server-only";
import { prisma } from "@/lib/prisma";
import type { DateRange, RevenueOpportunityReport, RevenueOpportunityRow } from "./types";
import { normalizeCountryCode, getCountryName } from "@/lib/country-utils";

const TABLE_LIMIT = 10;

export async function getRevenueOpportunityReport(range: DateRange): Promise<RevenueOpportunityReport> {
  const { since } = range;

  const [proUsers, freeUsersTotal, pendingVip, ibRevenue] = await Promise.all([
    prisma.proEntitlement.count({ where: { status: "ACTIVE" } }),
    prisma.user.count(),
    prisma.vipRequest.count({ where: { status: "PENDING" } }),
    prisma.ibActivitySnapshot.aggregate({ _sum: { estimatedIbRevenue: true }, where: { periodEnd: { gte: since } } }),
  ]);

  const freeUsers = freeUsersTotal - proUsers;
  const proUserIds = await prisma.proEntitlement.findMany({ where: { status: { in: ["ACTIVE", "GRACE"] } }, select: { userId: true } });
  const proUserIdSet = new Set(proUserIds.map((p) => p.userId));

  const candidates = await prisma.user.findMany({
    where: { tradingAccounts: { some: { OR: [{ balance: { gte: 10000 } }, { totalTrades: { gte: 10 } }] } } },
    select: {
      id: true, name: true, email: true,
      tradingAccounts: { select: { balance: true, totalTrades: true, broker: true, lastSync: true }, orderBy: { balance: "desc" }, take: 1 },
      vipRequests: { select: { status: true, country: true }, orderBy: { createdAt: "desc" }, take: 1 },
      journalEntries: { select: { id: true }, take: 1 },
    },
    take: 50, orderBy: { createdAt: "desc" },
  });

  const opportunities: RevenueOpportunityRow[] = [];
  for (const user of candidates) {
    if (proUserIdSet.has(user.id)) continue;
    const topAccount = user.tradingAccounts[0];
    if (!topAccount) continue;

    const country = user.vipRequests[0]?.country ? getCountryName(normalizeCountryCode(user.vipRequests[0].country)) : null;
    let opportunityReason = "Active trader without Pro";
    let suggestedAction = "Send Pro nudge";

    if (topAccount.balance >= 10000) { opportunityReason = `High balance ($${Math.round(topAccount.balance).toLocaleString()}) without Pro`; suggestedAction = "Review Pro opportunity"; }
    const pendingRequest = user.vipRequests.find((v) => v.status === "PENDING");
    if (pendingRequest) { opportunityReason = "Pro request pending"; suggestedAction = "Review Pro request"; }

    opportunities.push({ id: user.id, name: user.name, email: user.email, country, broker: topAccount.broker, balance: topAccount.balance, activitySummary: `${topAccount.totalTrades} trades, ${user.journalEntries.length > 0 ? "has journal" : "no journal"}`, proStatus: "Free", opportunityReason, suggestedAction });
  }

  opportunities.sort((a, b) => b.balance - a.balance);
  return { proUsers, freeUsers, proCandidates: opportunities.length, pendingProRequests: pendingVip, estimatedIbRevenue: ibRevenue._sum.estimatedIbRevenue ?? null, opportunities: opportunities.slice(0, TABLE_LIMIT) };
}
