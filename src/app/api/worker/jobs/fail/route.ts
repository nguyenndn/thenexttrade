import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notifyAdminsOfSyncFailure } from "@/lib/admin/admin-notification.server";

const WORKER_KEY =
    process.env.WORKER_API_KEY ||
    process.env.MT5_WORKER_KEY ||
    "tnt-worker-secret-key-2026";

export async function POST(request: NextRequest) {
    try {
        const authHeader =
            request.headers.get("x-worker-key") ||
            request.headers.get("authorization");
        if (
            !authHeader ||
            (authHeader !== WORKER_KEY &&
                authHeader !== `Bearer ${WORKER_KEY}`)
        ) {
            return NextResponse.json(
                { error: "Unauthorized worker access" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            jobId,
            errorCode = "WORKER_ERROR",
            errorMessage = "Unknown worker error",
        }: {
            jobId: string;
            errorCode?: string;
            errorMessage?: string;
        } = body;

        if (!jobId) {
            return NextResponse.json(
                { error: "Missing jobId" },
                { status: 400 }
            );
        }

        const job = await prisma.mt5ImportJob.findUnique({
            where: { id: jobId },
            include: {
                account: {
                    select: {
                        id: true,
                        userId: true,
                        broker: true,
                        accountNumber: true,
                        server: true,
                    },
                },
            },
        });

        if (!job) {
            return NextResponse.json(
                { error: "Job not found" },
                { status: 404 }
            );
        }

        await prisma.mt5ImportJob.update({
            where: { id: jobId },
            data: {
                status: "FAILED",
                errorCode,
                errorMessage,
                completedAt: new Date(),
                message: `Failed: ${errorMessage}`,
            },
        });

        // If MT5 connection timed out 5 times or failed, create a support ticket and alert Admins
        if (
            job.account &&
            (errorCode === "LOGIN_TIMEOUT_5X" ||
                errorCode === "LOGIN_FAILED" ||
                errorCode === "SERVERS_DAT_PROVISION_FAILED")
        ) {
            try {
                const existingPending = await prisma.supportSyncTicket.findFirst({
                    where: {
                        tradingAccountId: job.account.id,
                        status: "PENDING",
                    },
                });

                if (!existingPending) {
                    await prisma.supportSyncTicket.create({
                        data: {
                            userId: job.account.userId,
                            tradingAccountId: job.account.id,
                            broker: job.account.broker || "Unknown Broker",
                            accountNumber:
                                job.account.accountNumber || "Unknown",
                            server: job.account.server || null,
                            status: "PENDING",
                            notes: `[Auto-Worker Alert] Sync failed (${errorCode}). Error: ${errorMessage}`,
                        },
                    });
                }
            } catch (ticketErr) {
                console.error("[createSupportSyncTicket error]:", ticketErr);
            }

            await notifyAdminsOfSyncFailure({
                jobId: job.id,
                userId: job.account.userId,
                broker: job.account.broker || "Unknown Broker",
                accountNumber: job.account.accountNumber || "Unknown",
                server: job.account.server || null,
                errorMessage,
            });
        }

        revalidatePath("/dashboard/accounts");
        revalidatePath("/admin/ib/sync-requests");

        return NextResponse.json({ success: true, status: "FAILED" });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
