import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireCronSecret } from "@/lib/api-auth";
import { recordCronRun } from "@/lib/cron/cron-health.server";

/**
 * GET /api/cron/cleanup-security-logs
 * Auto-cleanup: Delete security logs older than 90 days and expired blocked IPs.
 * Schedule: daily via Vercel Cron.
 */
export async function GET(request: Request) {
    const cronStartedAt = new Date();
    const cronAuth = requireCronSecret(request);
    if (cronAuth instanceof NextResponse) return cronAuth;

    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    try {
        const [deletedLogs, deletedIPs] = await Promise.all([
            // Delete old security logs
            prisma.securityLog.deleteMany({
                where: { createdAt: { lt: ninetyDaysAgo } },
            }),

            // Delete expired blocked IPs
            prisma.blockedIP.deleteMany({
                where: {
                    expiresAt: { lt: new Date() },
                },
            }),
        ]);

        await recordCronRun("cleanup-security-logs", cronStartedAt, "SUCCESS");
        return NextResponse.json({
            ok: true,
            deleted: {
                securityLogs: deletedLogs.count,
                expiredBlockedIPs: deletedIPs.count,
            },
        });
    } catch (error) {
        console.error("[Cron] Security cleanup failed:", error);
        await recordCronRun("cleanup-security-logs", cronStartedAt, "FAILED", error);
        return NextResponse.json({ error: "Cleanup failed" }, { status: 500 });
    }
}
