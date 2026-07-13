import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { resolveWorkerAuth, hashToken } from "@/lib/mt5/worker-auth";

export async function POST(request: NextRequest) {
  try {
    const authResult = await resolveWorkerAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const workerId = authResult.workerId;

    const result = await prisma.$transaction(async (tx) => {
      const now = new Date();

      // 1. Recycle jobs with expired leases
      await tx.mt5ImportJob.updateMany({
        where: {
          status: { in: ["CLAIMED", "AUTHENTICATING", "FETCHING_ORDERS", "FETCHING_DEALS", "UPLOADING", "PROJECTING"] },
          leaseExpiresAt: { lt: now },
        },
        data: {
          status: "QUEUED",
          workerId: null,
          leaseId: null,
          leaseExpiresAt: null,
          secretTokenHash: null,
          secretUsedAt: null,
          message: "Lease expired; queued again",
        },
      });

      // 2. Fetch oldest queued job
      const job = await tx.mt5ImportJob.findFirst({
        where: { status: "QUEUED" },
        orderBy: { createdAt: "asc" },
        include: {
          account: {
            select: { id: true, accountNumber: true, server: true },
          },
        },
      });

      if (!job) {
        return null;
      }

      // 3. Generate unique claim tokens and leases
      const leaseId = "lease_" + crypto.randomBytes(16).toString("hex");
      const secretExchangeToken = crypto.randomBytes(24).toString("base64url");
      const leaseExpiresAt = new Date(Date.now() + 600 * 1000); // 10 minutes lease

      await tx.mt5ImportJob.update({
        where: { id: job.id },
        data: {
          status: "CLAIMED",
          workerId,
          leaseId,
          leaseExpiresAt,
          secretTokenHash: hashToken(secretExchangeToken),
          progressPercent: 2,
          message: "Claimed by worker",
        },
      });

      // 4. Check past attempt counts to log attempt number
      const previousAttempts = await tx.mt5ImportAttempt.count({
        where: { jobId: job.id },
      });

      await tx.mt5ImportAttempt.create({
        data: {
          jobId: job.id,
          workerId,
          attemptNumber: previousAttempts + 1,
          status: "CLAIMED",
        },
      });

      return {
        job_id: job.id,
        lease_id: leaseId,
        lease_expires_at: leaseExpiresAt.toISOString(),
        account: {
          id: job.account.id,
          login: job.account.accountNumber || "",
          server: job.account.server || "",
        },
        range: {
          from: job.rangeFrom.toISOString(),
          to: job.rangeTo.toISOString(),
        },
        secret_exchange_token: secretExchangeToken,
      };
    });

    return NextResponse.json({ job: result });
  } catch (error) {
    console.error("Job claim failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
