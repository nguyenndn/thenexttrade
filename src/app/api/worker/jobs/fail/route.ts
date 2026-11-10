import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { notifyAdminsOfSyncFailure } from "@/lib/admin/admin-notification.server";

function sanitizeWorkerErrorMessage(
    message: string | null | undefined,
    maxLength = 500
): string {
    const cleaned = (message || "Unknown worker error")
        .replace(/[\r\n\t]+/g, " ")
        .trim();
    return (cleaned || "Unknown worker error").slice(0, maxLength);
}

export async function POST(request: NextRequest) {
    try {
        const configuredWorkerKey =
            process.env.WORKER_API_KEY || process.env.MT5_WORKER_KEY;

        if (!configuredWorkerKey) {
            console.error(
                "[Worker Auth] Worker authentication is misconfigured: neither WORKER_API_KEY nor MT5_WORKER_KEY is set in environment."
            );
            return NextResponse.json(
                { error: "Server worker authentication is not configured" },
                { status: 503 }
            );
        }

        const authHeader =
            request.headers.get("x-worker-key") ||
            request.headers.get("authorization");
        if (
            !authHeader ||
            (authHeader !== configuredWorkerKey &&
                authHeader !== `Bearer ${configuredWorkerKey}`)
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

        const safeErrorMessage = sanitizeWorkerErrorMessage(errorMessage, 500);

        await prisma.mt5ImportJob.update({
            where: { id: jobId },
            data: {
                status: "FAILED",
                errorCode,
                errorMessage: safeErrorMessage,
                completedAt: new Date(),
                message: `Failed: ${safeErrorMessage}`,
            },
        });

        // If MT5 connection timed out 5 times or failed, alert Admins
        if (
            job.account &&
            (errorCode === "LOGIN_TIMEOUT_5X" ||
                errorCode === "LOGIN_FAILED" ||
                errorCode === "SERVERS_DAT_PROVISION_FAILED")
        ) {
            await notifyAdminsOfSyncFailure({
                jobId: job.id,
                userId: job.account.userId,
                broker: job.account.broker || "Unknown Broker",
                accountNumber: job.account.accountNumber || "Unknown",
                server: job.account.server || null,
                errorMessage: safeErrorMessage,
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
