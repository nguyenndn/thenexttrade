import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getInvestorPasswordForAccount } from "@/lib/credentials/investor-password.server";

const WORKER_KEY =
    process.env.WORKER_API_KEY ||
    process.env.MT5_WORKER_KEY ||
    "tnt-worker-secret-key-2026";

export async function GET(request: NextRequest) {
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

        const workerId =
            request.headers.get("x-worker-id") || "tnt-laptop-worker";

        // Find the oldest PENDING job
        const job = await prisma.mt5ImportJob.findFirst({
            where: { status: "PENDING" },
            orderBy: { createdAt: "asc" },
            include: {
                account: {
                    select: {
                        id: true,
                        accountNumber: true,
                        server: true,
                        broker: true,
                        credential: true,
                    },
                },
            },
        });

        if (!job) {
            return NextResponse.json({ job: null });
        }

        const pwResult = await getInvestorPasswordForAccount(job.accountId);
        if (!pwResult.ok) {
            await prisma.mt5ImportJob.update({
                where: { id: job.id },
                data: {
                    status: "FAILED",
                    errorCode: "NO_CREDENTIALS",
                    errorMessage:
                        "No investor password configured for this account.",
                    completedAt: new Date(),
                },
            });
            return NextResponse.json({
                job: null,
                message: "Job failed: missing investor credentials",
            });
        }

        const investorPassword = pwResult.password;

        // Mark as PROCESSING
        const leaseExpiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 min lease
        await prisma.mt5ImportJob.update({
            where: { id: job.id },
            data: {
                status: "PROCESSING",
                workerId,
                leaseExpiresAt,
                message: `Picked up by worker ${workerId}`,
            },
        });

        return NextResponse.json({
            job: {
                id: job.id,
                accountId: job.accountId,
                accountNumber: job.account.accountNumber,
                server: job.account.server,
                broker: job.account.broker,
                investorPassword,
                rangeFrom: job.rangeFrom.toISOString(),
                rangeTo: job.rangeTo.toISOString(),
            },
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
