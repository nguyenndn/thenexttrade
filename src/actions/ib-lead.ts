"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import type { IbLeadSource } from "@prisma/client";
import { computeCapitalBreakdown } from "@/lib/admin/ib/capital.server";

// ============================================================================
// IB LEAD TRACKING
// ============================================================================

/**
 * Track a broker affiliate link click.
 * Called client-side when user clicks a broker referral link.
 */
export async function trackBrokerClick(data: {
    broker: string;
    affiliateUrl?: string;
    source: IbLeadSource;
    sessionId: string;
    utmSource?: string;
    utmMedium?: string;
    utmCampaign?: string;
}) {
    const user = await getAuthUser().catch(() => null);

    // This action runs from public pages (anonymous attribution is by design),
    // so validate inputs and cap lengths — otherwise a junk payload writes
    // garbage rows into the IB funnel (e.g. a caller may pass
    // `selectedBroker || ""`, which can be empty).
    const broker = (data.broker || "").trim();
    if (!broker || broker.length > 50) return { success: false };
    const sessionId = (data.sessionId || "").trim();
    if (!sessionId || sessionId.length > 100) return { success: false };
    const cap = (v?: string, max = 200) =>
        v && v.length <= max ? v : null;
    const affiliateUrl = cap(data.affiliateUrl, 500);
    const utmSource = cap(data.utmSource);
    const utmMedium = cap(data.utmMedium);
    const utmCampaign = cap(data.utmCampaign);

    await Promise.all([
        // Create IbLead record
        prisma.ibLead.create({
            data: {
                userId: user?.id || null,
                sessionId,
                broker,
                affiliateUrl,
                source: data.source,
                utmSource,
                utmMedium,
                utmCampaign,
            },
        }),
        // Also track as AnalyticsEvent for unified analytics
        prisma.analyticsEvent.create({
            data: {
                name: "broker_ref_click",
                data: {
                    broker,
                    source: data.source,
                    affiliateUrl,
                },
                sessionId,
                userId: user?.id || null,
            },
        }),
    ]);

    return { success: true };
}

/**
 * Link the user's most recent IbLead to their latest VIP request.
 * Called after VIP request submission to complete the funnel attribution.
 * PRO-QA-004 fix.
 */
export async function linkIbLeadToVipRequest(broker: string) {
    const user = await getAuthUser().catch(() => null);
    if (!user) return;

    // Find the user's latest VIP request
    const latestRequest = await prisma.vipRequest.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        select: { id: true },
    });

    if (!latestRequest) return;

    // Find the latest IbLead for this user/broker that hasn't been converted yet
    const lead = await prisma.ibLead.findFirst({
        where: {
            userId: user.id,
            broker,
            convertedAt: null,
        },
        orderBy: { clickedAt: "desc" },
    });

    if (lead) {
        await prisma.ibLead.update({
            where: { id: lead.id },
            data: {
                convertedAt: new Date(),
                vipRequestId: latestRequest.id,
            },
        });
    }
}

// ============================================================================
// ADMIN QUERIES
// ============================================================================

export type IbStatsRange = "7d" | "30d" | "all";

function getRangeStart(range: IbStatsRange) {
    const now = new Date();
    if (range === "7d")
        return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    if (range === "30d")
        return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    return null;
}

export async function getIbLeadStats(range: IbStatsRange = "30d") {
    const user = await getAuthUser();
    if (!user) return null;

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
    });
    if (profile?.role !== "ADMIN") return null;

    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const rangeStart = getRangeStart(range);
    const rangeWhere = rangeStart ? { clickedAt: { gte: rangeStart } } : {};

    const [
        totalLeads,
        leads30d,
        leads7d,
        leadsByBroker,
        leadsBySource,
        convertedLeads,
    ] = await Promise.all([
        prisma.ibLead.count({ where: rangeWhere }),
        prisma.ibLead.count({ where: { clickedAt: { gte: thirtyDaysAgo } } }),
        prisma.ibLead.count({ where: { clickedAt: { gte: sevenDaysAgo } } }),
        prisma.ibLead.groupBy({
            by: ["broker"],
            where: rangeWhere,
            _count: true,
            orderBy: { _count: { broker: "desc" } },
            take: 10,
        }),
        prisma.ibLead.groupBy({
            by: ["source"],
            where: rangeWhere,
            _count: true,
            orderBy: { _count: { source: "desc" } },
        }),
        prisma.ibLead.count({
            where: { ...rangeWhere, convertedAt: { not: null } },
        }),
    ]);

    return {
        totalLeads,
        leads30d,
        leads7d,
        convertedLeads,
        conversionRate:
            totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
        leadsByBroker: leadsByBroker.map((l) => ({
            broker: l.broker,
            count: l._count,
        })),
        leadsBySource: leadsBySource.map((l) => ({
            source: l.source,
            count: l._count,
        })),
    };
}

export async function getIbOverviewStats(range: IbStatsRange = "30d") {
    const user = await getAuthUser();
    if (!user) return null;

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
    });
    if (profile?.role !== "ADMIN") return null;

    const now = new Date();
    const rangeStart = getRangeStart(range);
    const leadWhere = rangeStart ? { clickedAt: { gte: rangeStart } } : {};
    const requestWhere = rangeStart ? { createdAt: { gte: rangeStart } } : {};

    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const tradeWhere = rangeStart
        ? { exitDate: { gte: rangeStart }, status: "CLOSED" as const }
        : { status: "CLOSED" as const };

    const [
        totalLeads,
        pendingRequests,
        requestsInRange,
        activeEntitlements,
        graceEntitlements,
        revokedEntitlements,
        activeAccounts24h,
        monitoredAccounts,
        activeToolUsers,
        tradeStatsRange,
        tradeStats30d,
    ] = await Promise.all([
        prisma.ibLead.count({ where: leadWhere }),
        prisma.vipRequest.count({ where: { status: "PENDING" } }),
        prisma.vipRequest.count({ where: requestWhere }),
        prisma.proEntitlement.findMany({
            where: {
                status: "ACTIVE",
                OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            },
            select: { userId: true },
            distinct: ["userId"],
        }),
        prisma.proEntitlement.findMany({
            where: {
                status: "GRACE",
                OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
            },
            select: { userId: true },
            distinct: ["userId"],
        }),
        prisma.proEntitlement.findMany({
            where: { status: "REVOKED" },
            select: { userId: true },
            distinct: ["userId"],
        }),
        prisma.tradingAccount.count({
            where: {
                status: { notIn: ["PENDING", "REJECTED", "SUSPENDED"] },
                accountType: { not: "DEMO" },
                OR: [
                    { lastHeartbeat: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
                    { lastSync: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } },
                ],
            },
        }),
        prisma.tradingAccount.findMany({
            where: { status: { notIn: ["PENDING", "REJECTED", "SUSPENDED"] } },
            select: {
                userId: true,
                broker: true,
                accountNumber: true,
                balance: true,
                equity: true,
                currency: true,
                accountType: true,
                server: true,
                status: true,
                lastHeartbeat: true,
                lastSync: true,
            },
        }),
        prisma.eAProductUsageEvent.findMany({
            where: {
                occurredAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) },
                eventType: { in: ["HEARTBEAT", "SYNC", "SETUP_CONFIRMED"] },
            },
            select: { userId: true },
            distinct: ["userId"],
        }),
        prisma.journalEntry.aggregate({
            where: tradeWhere,
            _sum: { lotSize: true },
            _count: { _all: true },
        }),
        prisma.journalEntry.aggregate({
            where: { status: "CLOSED", exitDate: { gte: thirtyDaysAgo } },
            _sum: { lotSize: true },
            _count: { _all: true },
        }),
    ]);

    const activeUserSet = new Set(activeEntitlements.map((e) => e.userId));
    const graceUserSet = new Set(graceEntitlements.map((e) => e.userId));
    const revokedUserSet = new Set(revokedEntitlements.map((e) => e.userId));
    const capital = computeCapitalBreakdown(monitoredAccounts);
    const staleAccounts = monitoredAccounts.filter((account) => {
        const signal = [account.lastHeartbeat, account.lastSync]
            .filter(Boolean)
            .map((value) => new Date(value as Date).getTime())
            .sort((a, b) => b - a)[0];
        if (!signal) return false;
        const age = now.getTime() - signal;
        return age > 24 * 60 * 60 * 1000 && age <= 7 * 24 * 60 * 60 * 1000;
    }).length;
    const disconnectedAccounts = monitoredAccounts.filter((account) => {
        const signal = [account.lastHeartbeat, account.lastSync]
            .filter(Boolean)
            .map((value) => new Date(value as Date).getTime())
            .sort((a, b) => b - a)[0];
        return !signal || now.getTime() - signal > 7 * 24 * 60 * 60 * 1000;
    }).length;
    const accountKeys = new Set<string>();
    let duplicateAccountWarnings = 0;
    for (const account of monitoredAccounts) {
        const key = `${account.userId}:${account.broker || ""}:${account.accountNumber || ""}`.toLowerCase();
        if (key !== ":" && accountKeys.has(key)) duplicateAccountWarnings += 1;
        if (key !== ":") accountKeys.add(key);
    }

    const rangeLotSum = tradeStatsRange._sum?.lotSize ?? 0;
    const rangeTradeCount = tradeStatsRange._count?._all ?? 0;
    const d30LotSum = tradeStats30d._sum?.lotSize ?? 0;
    const d30TradeCount = tradeStats30d._count?._all ?? 0;

    return {
        totalLeads,
        pendingRequests,
        requestsInRange,
        verifiedUsers: activeUserSet.size,
        activeProUsers: new Set([...activeUserSet, ...graceUserSet]).size,
        graceUsers: graceUserSet.size,
        revokedUsers: revokedUserSet.size,
        activeAccounts: monitoredAccounts.length,
        activeAccounts24h,
        reportedCapitalUSD: capital.usdBalanceTotal,
        freshCapitalUSD: capital.usdFreshBalanceTotal,
        reportedEquityUSD: capital.usdEquityTotal,
        currencyBreakdown: capital.byCurrency,
        freshCurrencyBreakdown: capital.freshByCurrency,
        equityCurrencyBreakdown: capital.equityByCurrency,
        totalLots: Math.round(rangeLotSum * 100) / 100,
        totalTrades: rangeTradeCount,
        totalLots30d: Math.round(d30LotSum * 100) / 100,
        totalTrades30d: d30TradeCount,
        staleAccounts,
        disconnectedAccounts,
        vipUsersWithoutFirstSync: [...activeUserSet, ...graceUserSet].filter(
            (userId) => !monitoredAccounts.some((account) => account.userId === userId && account.lastSync)
        ).length,
        activeToolUsers: activeToolUsers.length,
        duplicateAccountWarnings,
    };
}
