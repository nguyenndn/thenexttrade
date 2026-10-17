import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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

        const jobId = request.nextUrl.searchParams.get("jobId");
        if (!jobId) {
            return NextResponse.json(
                { error: "Missing jobId parameter" },
                { status: 400 }
            );
        }

        const job = await prisma.mt5ImportJob.findUnique({
            where: { id: jobId },
            select: { id: true, status: true, errorMessage: true },
        });

        if (!job) {
            return NextResponse.json({
                exists: false,
                isCancelled: true,
                status: "NOT_FOUND",
            });
        }

        const isCancelled =
            job.status === "FAILED" ||
            job.status === "COMPLETED" ||
            Boolean(job.errorMessage?.toLowerCase().includes("cancel"));

        return NextResponse.json({
            exists: true,
            jobId: job.id,
            status: job.status,
            isCancelled,
        });
    } catch (error: any) {
        return NextResponse.json(
            { error: error.message || "Internal server error" },
            { status: 500 }
        );
    }
}
