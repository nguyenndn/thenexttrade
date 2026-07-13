import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveWorkerAuth } from "@/lib/mt5/worker-auth";

export async function POST(request: NextRequest, props: { params: Promise<{ jobId: string }> }) {
  const params = await props.params;
  try {
    const authResult = await resolveWorkerAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const workerId = authResult.workerId;
    const jobId = params.jobId;

    const { lease_id, error_code, error_message } = await request.json();
    if (!lease_id || !error_code || !error_message) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    await prisma.$transaction(async (tx) => {
      const job = await tx.mt5ImportJob.findUnique({
        where: { id: jobId },
      });

      if (!job) {
        throw new Error("NOT_FOUND");
      }
      if (job.workerId !== workerId || job.leaseId !== lease_id) {
        throw new Error("LEASE_MISMATCH");
      }
      if (job.leaseExpiresAt && job.leaseExpiresAt < new Date()) {
        throw new Error("LEASE_EXPIRED");
      }

      await tx.mt5ImportJob.update({
        where: { id: jobId },
        data: {
          status: "FAILED",
          errorCode: error_code,
          errorMessage: error_message,
        },
      });

      await tx.mt5Worker.update({
        where: { id: workerId },
        data: {
          currentJobId: null,
          status: "ONLINE",
        },
      });

      const attempt = await tx.mt5ImportAttempt.findFirst({
        where: { jobId, workerId },
        orderBy: { createdAt: "desc" },
      });
      if (attempt) {
        await tx.mt5ImportAttempt.update({
          where: { id: attempt.id },
          data: { status: "FAILED", errorCode: error_code, completedAt: new Date() },
        });
      }
    });

    return NextResponse.json({ accepted: true, status: "FAILED" });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }
    if (error.message === "LEASE_MISMATCH") {
      return NextResponse.json({ error: "Worker lease mismatch" }, { status: 409 });
    }
    if (error.message === "LEASE_EXPIRED") {
      return NextResponse.json({ error: "Worker lease expired" }, { status: 409 });
    }
    console.error("Job fail failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
