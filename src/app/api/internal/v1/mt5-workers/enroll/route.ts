import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/mt5/worker-auth";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const worker_id = typeof body.worker_id === "string" ? body.worker_id.trim() : "";
    const enrollment_token = typeof body.enrollment_token === "string" ? body.enrollment_token.trim() : "";
    if (!worker_id || !enrollment_token) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const tokenHash = hashToken(enrollment_token);

    const result = await prisma.$transaction(async (tx) => {
      const tokenRecord = await tx.mt5EnrollmentToken.findUnique({
        where: { tokenHash },
      });

      if (!tokenRecord) {
        throw new Error("INVALID_TOKEN");
      }

      if (tokenRecord.workerId !== worker_id) {
        throw new Error("WORKER_MISMATCH");
      }

      if (tokenRecord.usedAt !== null) {
        throw new Error("TOKEN_USED");
      }

      if (tokenRecord.expiresAt < new Date()) {
        throw new Error("EXPIRED_TOKEN");
      }

      const workerToken = crypto.randomBytes(36).toString("base64url");
      const workerTokenHash = hashToken(workerToken);

      await tx.mt5EnrollmentToken.update({
        where: { tokenHash },
        data: { usedAt: new Date() },
      });

      await tx.mt5Worker.upsert({
        where: { id: worker_id },
        update: {
          tokenHash: workerTokenHash,
          status: "ENROLLED",
        },
        create: {
          id: worker_id,
          tokenHash: workerTokenHash,
          status: "ENROLLED",
        },
      });

      return workerToken;
    });

    return NextResponse.json({ worker_id, worker_token: result });
  } catch (error: any) {
    if (error.message === "INVALID_TOKEN") {
      return NextResponse.json({ error: "Enrollment token is invalid or was not found" }, { status: 401 });
    }
    if (error.message === "WORKER_MISMATCH") {
      return NextResponse.json({ error: "Enrollment token was issued for a different Worker ID" }, { status: 401 });
    }
    if (error.message === "TOKEN_USED") {
      return NextResponse.json({ error: "Enrollment token was already used; generate a fresh token" }, { status: 401 });
    }
    if (error.message === "EXPIRED_TOKEN") {
      return NextResponse.json({ error: "Enrollment token expired" }, { status: 401 });
    }
    console.error("Worker enrollment failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
