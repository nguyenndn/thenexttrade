import { NextRequest, NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/api-auth";
import { prisma } from "@/lib/prisma";
import {
    getSupportSyncJobId,
    SUPPORT_SYNC_MODE,
} from "@/lib/services/support-sync-jobs.server";
import { recordCronRun } from "@/lib/cron/cron-health.server";

export const dynamic = "force-dynamic";

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

export async function GET(request: NextRequest) {
    const cronStartedAt = new Date();
    try {
        const cronAuth = requireCronSecret(request);
        if (cronAuth instanceof NextResponse) return cronAuth;

        const now = new Date();
        const dueTickets = await prisma.supportSyncTicket.findMany({
            where: {
                status: "PENDING",
                scheduledFor: { lte: now },
                tradingAccountId: { not: null },
                tradingAccount: { isNot: null },
            },
            select: {
                id: true,
                userId: true,
                tradingAccountId: true,
                accountNumber: true,
            },
            orderBy: { scheduledFor: "asc" },
            take: 100,
        });

        let jobsCreated = 0;
        let ticketsSkipped = 0;
        let ticketsWithoutAccount = 0;

        for (const ticket of dueTickets) {
            if (!ticket.tradingAccountId) {
                ticketsWithoutAccount++;
                continue;
            }

            const activeJob = await prisma.mt5ImportJob.findFirst({
                where: {
                    accountId: ticket.tradingAccountId,
                    mode: SUPPORT_SYNC_MODE,
                    status: { in: ["PENDING", "PROCESSING"] },
                },
                select: { id: true },
            });
            if (activeJob) {
                ticketsSkipped++;
                continue;
            }

            const jobId = getSupportSyncJobId(ticket.id);
            const existingJob = await prisma.mt5ImportJob.findUnique({
                where: { id: jobId },
                select: { id: true },
            });
            if (existingJob) {
                ticketsSkipped++;
                continue;
            }

            await prisma.mt5ImportJob.create({
                data: {
                    id: jobId,
                    userId: ticket.userId,
                    accountId: ticket.tradingAccountId,
                    mode: SUPPORT_SYNC_MODE,
                    rangeFrom: new Date(now.getTime() - THIRTY_DAYS_MS),
                    rangeTo: now,
                    status: "PENDING",
                    progressPercent: 0,
                    message: `Scheduled support sync for #${ticket.accountNumber}`,
                },
            });
            jobsCreated++;
        }

        await recordCronRun("support-sync", cronStartedAt, "SUCCESS");
        return NextResponse.json({
            success: true,
            timestamp: now.toISOString(),
            jobsCreated,
            ticketsScanned: dueTickets.length,
            ticketsSkipped,
            ticketsWithoutAccount,
        });
    } catch (error) {
        console.error("Support Sync cron error:", error);
        await recordCronRun("support-sync", cronStartedAt, "FAILED", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
