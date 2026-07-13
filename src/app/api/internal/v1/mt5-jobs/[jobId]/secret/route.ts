import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveWorkerAuth, hashToken } from "@/lib/mt5/worker-auth";
import { decryptPassword } from "@/lib/crypto";

export async function POST(request: NextRequest, props: { params: Promise<{ jobId: string }> }) {
  const params = await props.params;
  try {
    const authResult = await resolveWorkerAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const workerId = authResult.workerId;
    const jobId = params.jobId;

    const { lease_id, secret_exchange_token } = await request.json();
    if (!lease_id || !secret_exchange_token) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const job = await tx.mt5ImportJob.findUnique({
        where: { id: jobId },
        include: {
          account: {
            select: { id: true, accountNumber: true, server: true },
          },
        },
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
      if (job.secretUsedAt !== null || job.secretTokenHash !== hashToken(secret_exchange_token)) {
        throw new Error("TOKEN_INVALID");
      }

      const credential = await tx.tradingAccountCredential.findUnique({
        where: { accountId: job.accountId },
      });

      if (!credential) {
        throw new Error("CREDENTIAL_MISSING");
      }

      let password = "";
      try {
        password = decryptPassword(credential.encryptedPassword);
      } catch (err) {
        throw new Error("DECRYPT_FAILED");
      }

      await tx.mt5ImportJob.update({
        where: { id: jobId },
        data: {
          secretUsedAt: new Date(),
          status: "AUTHENTICATING",
          progressPercent: 5,
          message: "Credential exchanged",
        },
      });

      // Update current attempt
      const attempt = await tx.mt5ImportAttempt.findFirst({
        where: { jobId, workerId },
        orderBy: { createdAt: "desc" },
      });
      if (attempt) {
        await tx.mt5ImportAttempt.update({
          where: { id: attempt.id },
          data: { status: "AUTHENTICATING" },
        });
      }

      return {
        login: job.account.accountNumber || "",
        server: job.account.server || "",
        investor_password: password,
      };
    });

    return NextResponse.json(result);
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
    if (error.message === "TOKEN_INVALID") {
      return NextResponse.json({ error: "Invalid or already-used secret exchange token" }, { status: 401 });
    }
    if (error.message === "CREDENTIAL_MISSING") {
      return NextResponse.json({ error: "Investor credential not found" }, { status: 404 });
    }
    if (error.message === "DECRYPT_FAILED") {
      return NextResponse.json({ error: "Credential decrypt failed" }, { status: 500 });
    }
    console.error("Secret exchange failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
