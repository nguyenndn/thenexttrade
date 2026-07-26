import "server-only";
import { prisma } from "@/lib/prisma";
import { getArticleOpsData } from "@/lib/articles/article-readiness.server";
import type { DateRange, ActionQueueReport, ActionQueueItem } from "./types";

export async function getActionQueueReport(
    range: DateRange
): Promise<ActionQueueReport> {
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
        stuckUsers72h,
        stuckMobileSyncUsers,
    ] = await Promise.all([
        prisma.vipRequest.count({ where: { status: "PENDING" } }),
        prisma.tradingAccount.count({
            where: {
                lastSync: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                totalTrades: { gt: 0 },
            },
        }),
        prisma.tradingAccount.count({ where: { lastSync: null } }),
        prisma.user.count({
            where: { createdAt: { gte: range.since }, profile: null },
        }),
        prisma.tradingAccount.count({
            where: { totalTrades: 0, lastSync: { not: null } },
        }),
        prisma.feedback.count({ where: { status: "OPEN" } }),
        prisma.securityLog.count({
            where: {
                createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
        }),
        getArticleOpsData("all").then((d) => d.summary),
        prisma.user.count({
            where: {
                createdAt: { lt: new Date(Date.now() - 72 * 60 * 60 * 1000) },
                journalEntries: { none: {} },
                tradingAccounts: {
                    every: { totalTrades: 0 },
                },
            },
        }),
        prisma.user.findMany({
            select: {
                settings: true,
                journalEntries: { select: { id: true }, take: 1 },
                tradingAccounts: { select: { id: true, totalTrades: true } },
            },
            take: 2000,
        }),
    ]);

    const stuckMobileSyncCount = stuckMobileSyncUsers.filter((u) => {
        const hasTrades =
            u.journalEntries.length > 0 ||
            u.tradingAccounts.some((a) => a.totalTrades > 0);
        if (hasTrades) return false;

        const settings = (u.settings as Record<string, any>) || {};
        const onboarding = (settings.onboarding || {}) as Record<string, any>;
        return !!onboarding.mobileSyncFallback;
    }).length;

    if (stuckMobileSyncCount > 0) {
        items.push({
            id: "stuck-mobile-sync",
            severity: stuckMobileSyncCount > 5 ? "high" : "medium",
            category: "activation",
            title: "Mobile Sync Dropoffs",
            description: `${stuckMobileSyncCount} mobile user(s) chose sync but never reached first value`,
            count: stuckMobileSyncCount,
            href: "/admin/users",
            cta: "View Users",
        });
    }

    if (pendingVipRequests > 0) {
        items.push({
            id: "pending-pro-requests",
            severity: pendingVipRequests > 3 ? "critical" : "high",
            category: "pro",
            title: "Pending Pro Requests",
            description: `${pendingVipRequests} Pro/VIP request(s) waiting for review`,
            count: pendingVipRequests,
            href: "/admin/ib/pipeline",
            cta: "Review Requests",
        });
    }
    if (staleAccounts > 0) {
        items.push({
            id: "stale-sync-accounts",
            severity: staleAccounts > 10 ? "high" : "medium",
            category: "sync",
            title: "Accounts Offline > 24h",
            description: `${staleAccounts} active account(s) haven't synced in over 24 hours`,
            count: staleAccounts,
            href: "/admin/trading-systems/accounts",
            cta: "View Accounts",
        });
    }
    if (neverSyncedAccounts > 0) {
        items.push({
            id: "never-synced-accounts",
            severity: "medium",
            category: "sync",
            title: "Accounts Never Synced",
            description: `${neverSyncedAccounts} account(s) created but never synced`,
            count: neverSyncedAccounts,
            href: "/admin/trading-systems/accounts",
            cta: "View Accounts",
        });
    }
    if (usersNoProfile > 0) {
        items.push({
            id: "users-no-profile",
            severity: "medium",
            category: "activation",
            title: "Users Without Profile",
            description: `${usersNoProfile} new user(s) without profile`,
            count: usersNoProfile,
            href: "/admin/users",
            cta: "View Users",
        });
    }
    if (usersNoTrades > 0) {
        items.push({
            id: "accounts-no-trades",
            severity: "low",
            category: "activation",
            title: "Connected Accounts Without Trades",
            description: `${usersNoTrades} account(s) synced but zero trades`,
            count: usersNoTrades,
            href: "/admin/trading-systems/accounts",
            cta: "View Accounts",
        });
    }
    if (articleOps.needsSeo > 0) {
        items.push({
            id: "articles-need-seo",
            severity: articleOps.needsSeo > 20 ? "medium" : "low",
            category: "content",
            title: "Articles Needing SEO",
            description: `${articleOps.needsSeo} published article(s) missing SEO metadata`,
            count: articleOps.needsSeo,
            href: "/admin/articles/ops",
            cta: "Fix SEO",
        });
    }
    if (articleOps.needsImages > 0) {
        items.push({
            id: "articles-need-images",
            severity: articleOps.needsImages > 20 ? "medium" : "low",
            category: "content",
            title: "Articles Missing Image",
            description: `${articleOps.needsImages} article(s) missing featured image`,
            count: articleOps.needsImages,
            href: "/admin/articles/ops",
            cta: "Fix Images",
        });
    }
    if (feedbackOpen > 0) {
        items.push({
            id: "feedback-open",
            severity: feedbackOpen > 5 ? "medium" : "low",
            category: "support",
            title: "Feedback Waiting Response",
            description: `${feedbackOpen} user feedback message(s) waiting`,
            count: feedbackOpen,
            href: "/admin/feedback",
            cta: "Review Feedback",
        });
    }
    if (securityRecent > 50) {
        items.push({
            id: "security-events",
            severity: securityRecent > 200 ? "critical" : "high",
            category: "security",
            title: "Security Events (24h)",
            description: `${securityRecent} security event(s) in the last 24 hours`,
            count: securityRecent,
            href: "/admin/security",
            cta: "Review Security",
        });
    }
    if (stuckUsers72h > 0) {
        items.push({
            id: "stuck-users-72h",
            severity: stuckUsers72h > 20 ? "high" : "medium",
            category: "activation",
            title: "Stuck Users (>72h)",
            description: `${stuckUsers72h} user(s) stuck after 72 hours without first value`,
            count: stuckUsers72h,
            href: "/admin/users",
            cta: "View Users",
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
