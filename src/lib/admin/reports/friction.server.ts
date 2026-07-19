import "server-only";
import { prisma } from "@/lib/prisma";
import type { DateRange, FrictionReport, FrictionRow } from "./types";

export async function getFrictionReport(
    range: DateRange
): Promise<FrictionReport> {
    const { since } = range;
    const [
        securityLogs,
        feedbackCount,
        rejectedVip,
        blockedReports,
        staleAccounts,
    ] = await Promise.all([
        prisma.securityLog.groupBy({
            by: ["type"],
            where: { createdAt: { gte: since } },
            _count: { id: true },
        }),
        prisma.feedback.count({ where: { createdAt: { gte: since } } }),
        prisma.vipRequest.count({
            where: { status: "REJECTED", updatedAt: { gte: since } },
        }),
        prisma.analyticsEvent.count({
            where: {
                name: "weekly_review_generate_blocked_no_data",
                createdAt: { gte: since },
            },
        }),
        prisma.tradingAccount.count({
            where: {
                lastSync: { lt: new Date(Date.now() - 48 * 60 * 60 * 1000) },
                totalTrades: { gt: 0 },
            },
        }),
    ]);

    const items: FrictionRow[] = [];
    let totalFrictionEvents = 0;

    for (const log of securityLogs) {
        const count = log._count.id;
        totalFrictionEvents += count;
        if (count > 0)
            items.push({
                area: `Security: ${log.type}`,
                count,
                affectedUsers: 0,
                severity:
                    count > 100 ? "critical" : count > 20 ? "high" : "medium",
                recommendedFix: "Review security logs for patterns",
                href: "/admin/security",
            });
    }
    if (feedbackCount > 0) {
        totalFrictionEvents += feedbackCount;
        items.push({
            area: "Support / Feedback",
            count: feedbackCount,
            affectedUsers: feedbackCount,
            severity: feedbackCount > 10 ? "high" : "medium",
            recommendedFix: "Review and respond to feedback",
            href: "/admin/feedback",
        });
    }
    if (rejectedVip > 0) {
        totalFrictionEvents += rejectedVip;
        items.push({
            area: "Pro Request Rejection",
            count: rejectedVip,
            affectedUsers: rejectedVip,
            severity: "medium",
            recommendedFix: "Review rejection reasons and improve guidance",
            href: "/admin/ib/pipeline",
        });
    }
    if (blockedReports > 0) {
        totalFrictionEvents += blockedReports;
        items.push({
            area: "Report Generation Blocked",
            count: blockedReports,
            affectedUsers: 0,
            severity: blockedReports > 20 ? "high" : "medium",
            recommendedFix: "Improve data collection for report generation",
            href: "/admin/release-health",
        });
    }
    if (staleAccounts > 0) {
        totalFrictionEvents += staleAccounts;
        items.push({
            area: "Account Sync Failure (48h+)",
            count: staleAccounts,
            affectedUsers: staleAccounts,
            severity: staleAccounts > 10 ? "high" : "medium",
            recommendedFix: "Check EA connectivity and notify users",
            href: "/admin/ea/accounts",
        });
    }

    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    items.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);
    return { items: items.slice(0, 10), totalFrictionEvents };
}
