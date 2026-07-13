import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireAdminAuth } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { hashToken } from "@/lib/mt5/worker-auth";

export async function POST(request: NextRequest) {
  try {
    try {
      await requireAdminAuth();
    } catch (err: any) {
      return NextResponse.json({ error: err.message || "Unauthorized" }, { status: 401 });
    }

    const { worker_id, ttl_minutes } = await request.json();
    if (!worker_id) {
      return NextResponse.json({ error: "Missing worker_id" }, { status: 400 });
    }

    const ttl = ttl_minutes ? parseInt(ttl_minutes) : 15;
    const enrollmentToken = crypto.randomBytes(24).toString("base64url");
    const expiresAt = new Date(Date.now() + ttl * 60 * 1000);

    await prisma.mt5EnrollmentToken.create({
      data: {
        tokenHash: hashToken(enrollmentToken),
        workerId: worker_id,
        expiresAt,
      },
    });

    return NextResponse.json({
      worker_id,
      enrollment_token: enrollmentToken,
      expires_at: expiresAt.toISOString(),
    }, { status: 201 });
  } catch (error) {
    console.error("Failed to generate enrollment token:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
