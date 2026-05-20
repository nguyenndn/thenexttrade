"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import type { IbLeadSource } from "@prisma/client";

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

  await Promise.all([
    // Create IbLead record
    prisma.ibLead.create({
      data: {
        userId: user?.id || null,
        sessionId: data.sessionId,
        broker: data.broker,
        affiliateUrl: data.affiliateUrl || null,
        source: data.source,
        utmSource: data.utmSource || null,
        utmMedium: data.utmMedium || null,
        utmCampaign: data.utmCampaign || null,
      },
    }),
    // Also track as AnalyticsEvent for unified analytics
    prisma.analyticsEvent.create({
      data: {
        name: "broker_ref_click",
        data: {
          broker: data.broker,
          source: data.source,
          affiliateUrl: data.affiliateUrl || null,
        },
        sessionId: data.sessionId,
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
  if (range === "7d") return new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  if (range === "30d") return new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
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
    prisma.ibLead.count({ where: { ...rangeWhere, convertedAt: { not: null } } }),
  ]);

  return {
    totalLeads,
    leads30d,
    leads7d,
    convertedLeads,
    conversionRate: totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0,
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

  const rangeStart = getRangeStart(range);
  const leadWhere = rangeStart ? { clickedAt: { gte: rangeStart } } : {};
  const requestWhere = rangeStart ? { createdAt: { gte: rangeStart } } : {};
  const entitlementWhere = rangeStart ? { createdAt: { gte: rangeStart } } : {};

  const [
    totalLeads,
    pendingRequests,
    verifiedUsers,
    activeProUsers,
    graceUsers,
    revokedUsers,
  ] = await Promise.all([
    prisma.ibLead.count({ where: leadWhere }),
    prisma.vipRequest.count({ where: { status: "PENDING" } }),
    prisma.proEntitlement.count({ where: { status: "ACTIVE", ...entitlementWhere } }),
    prisma.proEntitlement.count({
      where: {
        status: "ACTIVE",
        tradingAccountId: { not: null },
      },
    }),
    prisma.proEntitlement.count({ where: { status: "GRACE" } }),
    prisma.proEntitlement.count({ where: { status: "REVOKED" } }),
  ]);

  return {
    totalLeads,
    pendingRequests,
    requestsInRange: await prisma.vipRequest.count({ where: requestWhere }),
    verifiedUsers,
    activeProUsers,
    graceUsers,
    revokedUsers,
  };
}
