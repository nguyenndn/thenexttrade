import "server-only";
import { prisma } from "@/lib/prisma";
import { getArticleOpsData } from "@/lib/articles/article-readiness.server";
import type { DateRange, ActionQueueReport, ActionQueueItem } from "./types";

export async function getActionQueueReport(range: DateRange): Promise<ActionQueueReport> {
  const items: ActionQueueItem[] = [];

  const [
    pendingVipRequests,
    staleAccounts,
    neverSyncedAccounts,
    usersNoProfile,
    usersNoTrades,
    feedbackOpen,
    securityRecent,
    articleOps,
  ] = await Promise.all([
    prisma.vipRequest.count({ where: { status: "PENDING" } }),
    prisma.tradingAccount.count({
      where: { lastSync: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }, totalTrades: { gt: 0 } },
    }),
    prisma.tradingAccount.count({ where: { lastSync: null } }),
    prisma.user.count({ where: { createdAt: { gte: range.since }, profile: null } }),
    prisma.tradingAccount.count({ where: { totalTrades: 0, lastSync: { not: null } } }),
    prisma.feedback.count({ where: { status: "OPEN" } }),
    prisma.securityLog.count({
      where: { createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } },
    }),
    getArticleOpsData("all").then((d) => d.summary),
  ]);

  if (pendingVipRequests > 0) {
    items.push({
      id: "pending-pro-requests", severity: pendingVipRequests > 3 ? "critical" : "high", category: "pro",
      title: "Pending Pro Requests", description: `${pendingVipRequests} Pro/VIP request(s) waiting for review`,
      count: pendingVipRequests, href: "/admin/ib/pipeline", cta: "Review Requests",
    });
  }
  if (staleAccounts > 0) {
    items.push({
      id: "stale-sync-accounts", severity: staleAccounts > 10 ? "high" : "medium", category: "sync",
      title: "Accounts Offline > 24h", description: `${staleAccounts} active account(s) haven't synced in over 24 hours`,
      count: staleAccounts, href: "/admin/ea/accounts", cta: "View Accounts",
    });
  }
  if (neverSyncedAccounts > 0) {
    items.push({
      id: "never-synced-accounts", severity: "medium", category: "sync",
      title: "Accounts Never Synced", description: `${neverSyncedAccounts} account(s) created but never synced`,
      count: neverSyncedAccounts, href: "/admin/ea/accounts", cta: "View Accounts",
    });
  }
  if (usersNoProfile > 0) {
    items.push({
      id: "users-no-profile", severity: "medium", category: "activation",
      title: "Users Without Profile", description: `${usersNoProfile} new user(s) without profile`,
      count: usersNoProfile, href: "/admin/users", cta: "View Users",
    });
  }
  if (usersNoTrades > 0) {
    items.push({
      id: "accounts-no-trades", severity: "low", category: "activation",
      title: "Connected Accounts Without Trades", description: `${usersNoTrades} account(s) synced but zero trades`,
      count: usersNoTrades, href: "/admin/ea/accounts", cta: "View Accounts",
    });
  }
  if (articleOps.needsSeo > 0) {
    items.push({
      id: "articles-need-seo", severity: articleOps.needsSeo > 20 ? "medium" : "low", category: "content",
      title: "Articles Needing SEO", description: `${articleOps.needsSeo} published article(s) missing SEO metadata`,
      count: articleOps.needsSeo, href: "/admin/articles/ops", cta: "Fix SEO",
    });
  }
  if (articleOps.needsImages > 0) {
    items.push({
      id: "articles-need-images", severity: articleOps.needsImages > 20 ? "medium" : "low", category: "content",
      title: "Articles Missing Image", description: `${articleOps.needsImages} article(s) missing featured image`,
      count: articleOps.needsImages, href: "/admin/articles/ops", cta: "Fix Images",
    });
  }
  if (feedbackOpen > 0) {
    items.push({
      id: "feedback-open", severity: feedbackOpen > 5 ? "medium" : "low", category: "support",
      title: "Feedback Waiting Response", description: `${feedbackOpen} user feedback message(s) waiting`,
      count: feedbackOpen, href: "/admin/feedback", cta: "Review Feedback",
    });
  }
  if (securityRecent > 50) {
    items.push({
      id: "security-events", severity: securityRecent > 200 ? "critical" : "high", category: "security",
      title: "Security Events (24h)", description: `${securityRecent} security event(s) in the last 24 hours`,
      count: securityRecent, href: "/admin/security", cta: "Review Security",
    });
  }

  const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
  items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return {
    items: items.slice(0, 12),
    totalCritical: items.filter((i) => i.severity === "critical").length,
    totalHigh: items.filter((i) => i.severity === "high").length,
  };
}
