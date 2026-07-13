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

    const body = await request.json();
    const { lease_id, status, progress_percent, message, terminal_pid, terminal_slot_id } = body;

    if (!lease_id || !status) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const leaseExpiresAt = new Date(Date.now() + 600 * 1000); // Extend lease by 10m

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
          status,
          progressPercent: progress_percent ?? job.progressPercent,
          message: message ?? job.message,
          leaseExpiresAt,
        },
      });

      // Update current attempt
      const attempt = await tx.mt5ImportAttempt.findFirst({
        where: { jobId, workerId },
        orderBy: { createdAt: "desc" },
      });
      if (attempt) {
        const updateData: any = { status };
        if (terminal_pid) updateData.terminalPid = parseInt(terminal_pid);
        if (terminal_slot_id) updateData.terminalSlotId = terminal_slot_id;
        if (status === "AUTHENTICATING") {
          updateData.accountVerified = true;
          updateData.brokerConnectedAt = new Date();
        }
        if (status === "FETCHING_ORDERS" || status === "FETCHING_DEALS") {
          updateData.fetchStartedAt = new Date();
        }
        if (status === "CLEANING_UP") {
          updateData.cleanupCompletedAt = new Date();
        }

        await tx.mt5ImportAttempt.update({
          where: { id: attempt.id },
          data: updateData,
        });
      }
    });

    return NextResponse.json({ accepted: true, lease_expires_at: leaseExpiresAt.toISOString() });
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
    console.error("Progress update failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
