import "server-only";
import { prisma } from "@/lib/prisma";
import type { DateRange, AlertReport, AdminAlert } from "./types";
import { getArticleOpsData } from "@/lib/articles/article-readiness.server";

export async function getAlertReport(range: DateRange): Promise<AlertReport> {
    const { since, previousSince, previousUntil } = range;
    const alerts: AdminAlert[] = [];

    const [
        currentNewUsers,
        prevNewUsers,
        staleAccounts,
        totalActiveAccounts,
        highValueOffline,
        pendingVipOld,
        currentSecurityLogs,
        prevSecurityLogs,
        articleOps,
    ] = await Promise.all([
        prisma.user.count({ where: { createdAt: { gte: since } } }),
        prisma.user.count({
            where: { createdAt: { gte: previousSince, lt: previousUntil } },
        }),
        prisma.tradingAccount.count({
            where: {
                lastSync: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
                totalTrades: { gt: 0 },
            },
        }),
        prisma.tradingAccount.count({ where: { totalTrades: { gt: 0 } } }),
        prisma.tradingAccount.count({
            where: {
                balance: { gte: 10000 },
                lastSync: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
        }),
        prisma.vipRequest.count({
            where: {
                status: "PENDING",
                createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) },
            },
        }),
        prisma.securityLog.count({ where: { createdAt: { gte: since } } }),
        prisma.securityLog.count({
            where: { createdAt: { gte: previousSince, lt: previousUntil } },
        }),
        getArticleOpsData("all").then((d) => d.summary),
    ]);

    if (prevNewUsers > 0 && currentNewUsers < prevNewUsers * 0.5) {
        alerts.push({
            id: "signup-drop",
            severity: "warning",
            title: "Signup Drop",
            description: `New signups dropped ${Math.round(((prevNewUsers - currentNewUsers) / prevNewUsers) * 100)}% vs previous period`,
            metric: "new_users",
            currentValue: currentNewUsers,
            threshold: Math.round(prevNewUsers * 0.5),
            href: "/admin/analytics",
        });
    }
    const staleRate =
        totalActiveAccounts > 0
            ? (staleAccounts / totalActiveAccounts) * 100
            : 0;
    if (staleAccounts > 10 || staleRate > 20) {
        alerts.push({
            id: "sync-health",
            severity: staleAccounts > 20 ? "critical" : "warning",
            title: "Sync Health Issue",
            description: `${staleAccounts} active accounts (${Math.round(staleRate)}%) have stale sync`,
            metric: "stale_accounts",
            currentValue: staleAccounts,
            threshold: 10,
            href: "/admin/trading-systems/accounts",
        });
    }
    if (highValueOffline > 0) {
        alerts.push({
            id: "high-value-offline",
            severity: "critical",
            title: "High-Value Account Offline",
            description: `${highValueOffline} account(s) with balance ≥ $10,000 haven't synced in 24h`,
            metric: "high_value_offline",
            currentValue: highValueOffline,
            threshold: 0,
            href: "/admin/trading-systems/accounts",
        });
    }
    if (pendingVipOld > 0) {
        alerts.push({
            id: "pro-request-sla",
            severity: "warning",
            title: "Pro Request SLA Breach",
            description: `${pendingVipOld} Pro request(s) pending for more than 24 hours`,
            metric: "pending_vip_old",
            currentValue: pendingVipOld,
            threshold: 0,
            href: "/admin/ib/pipeline",
        });
    }
    if (prevSecurityLogs > 0 && currentSecurityLogs > prevSecurityLogs * 2) {
        alerts.push({
            id: "security-spike",
            severity: "critical",
            title: "Security Event Spike",
            description: `Security events increased ${Math.round(((currentSecurityLogs - prevSecurityLogs) / prevSecurityLogs) * 100)}%`,
            metric: "security_logs",
            currentValue: currentSecurityLogs,
            threshold: prevSecurityLogs * 2,
            href: "/admin/security",
        });
    }
    const articleBacklog = articleOps.needsSeo + articleOps.needsImages;
    if (articleBacklog > 20) {
        alerts.push({
            id: "article-ops-backlog",
            severity: "info",
            title: "Article Ops Backlog",
            description: `${articleBacklog} articles need SEO fixes or images`,
            metric: "article_backlog",
            currentValue: articleBacklog,
            threshold: 20,
            href: "/admin/articles/ops",
        });
    }

    const severityOrder = { critical: 0, warning: 1, info: 2 };
    alerts.sort(
        (a, b) => severityOrder[a.severity] - severityOrder[b.severity]
    );
    return { alerts };
}
