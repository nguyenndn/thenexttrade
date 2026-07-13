import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { resolveWorkerAuth } from "@/lib/mt5/worker-auth";
import { projectMt5History } from "@/lib/mt5/projector";

export async function POST(request: NextRequest, props: { params: Promise<{ jobId: string }> }) {
  const params = await props.params;
  try {
    const authResult = await resolveWorkerAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const workerId = authResult.workerId;
    const jobId = params.jobId;

    const { lease_id } = await request.json();
    if (!lease_id) {
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

      // Verify batch manifest
      for (const entityType of ["ORDERS", "DEALS"]) {
        const batches = await tx.mt5Batch.findMany({
          where: { jobId, entityType },
          orderBy: { batchIndex: "asc" },
        });

        if (batches.length === 0) {
          throw new Error(`NO_${entityType}_BATCHES`);
        }

        const expectedTotal = batches[0].totalBatches;
        if (batches.length !== expectedTotal) {
          throw new Error(`INCOMPLETE_${entityType}_MANIFEST`);
        }

        for (let i = 0; i < expectedTotal; i++) {
          if (batches[i].batchIndex !== i) {
            throw new Error(`INCOMPLETE_${entityType}_MANIFEST`);
          }
        }
      }

      await tx.mt5ImportJob.update({
        where: { id: jobId },
        data: {
          status: "PROJECTING",
          progressPercent: 98,
          message: "Building trading journal",
          leaseExpiresAt: new Date(Date.now() + 600 * 1000),
        },
      });
    });

    // Keep this awaited. A fire-and-forget projection may be terminated by a
    // serverless runtime before the dashboard sees the imported trades.
    await projectMt5History(jobId);

    await prisma.$transaction(async (tx) => {
      const job = await tx.mt5ImportJob.findUnique({ where: { id: jobId } });
      if (!job || job.workerId !== workerId || job.leaseId !== lease_id) {
        throw new Error("LEASE_MISMATCH");
      }

      const now = new Date();
      await tx.mt5ImportJob.update({
        where: { id: jobId },
        data: {
          status: "COMPLETED",
          progressPercent: 100,
          message: "Import completed",
          completedAt: now,
        },
      });

      await tx.mt5Worker.update({
        where: { id: workerId },
        data: { currentJobId: null, status: "ONLINE" },
      });

      const attempt = await tx.mt5ImportAttempt.findFirst({
        where: { jobId, workerId },
        orderBy: { createdAt: "desc" },
      });
      if (attempt) {
        await tx.mt5ImportAttempt.update({
          where: { id: attempt.id },
          data: { status: "COMPLETED", completedAt: now },
        });
      }
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard/journal");
    revalidatePath("/dashboard/analytics");

    return NextResponse.json({ accepted: true, status: "COMPLETED" });
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
    if (error.message && (error.message.startsWith("NO_") || error.message.startsWith("INCOMPLETE_"))) {
      return NextResponse.json({ error: error.message.replace("_", " ") }, { status: 409 });
    }
    console.error("Job complete failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
