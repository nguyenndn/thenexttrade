"use server";

import { prisma } from "@/lib/prisma";
import { requireAdminAuth } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import crypto from "crypto";
import { hashToken } from "@/lib/mt5/worker-auth";

export async function getMt5Workers() {
  await requireAdminAuth();
  return prisma.mt5Worker.findMany({
    orderBy: { lastHeartbeat: "desc" },
  });
}

export async function revokeMt5Worker(workerId: string) {
  await requireAdminAuth();
  await prisma.mt5Worker.update({
    where: { id: workerId },
    data: { status: "REVOKED" },
  });
  revalidatePath("/admin/mt5");
}

export async function getMt5Jobs() {
  await requireAdminAuth();
  return prisma.mt5ImportJob.findMany({
    orderBy: { createdAt: "desc" },
    include: {
      account: {
        select: { name: true, accountNumber: true, server: true },
      },
    },
  });
}

export async function getEnrollmentTokens() {
  await requireAdminAuth();
  return prisma.mt5EnrollmentToken.findMany({
    orderBy: { createdAt: "desc" },
  });
}

export async function revokeEnrollmentToken(tokenHash: string) {
  await requireAdminAuth();
  await prisma.mt5EnrollmentToken.update({
    where: { tokenHash },
    data: { usedAt: new Date() },
  });
  revalidatePath("/admin/mt5/tokens");
}

export async function deleteEnrollmentToken(tokenHash: string) {
  await requireAdminAuth();
  await prisma.mt5EnrollmentToken.delete({
    where: { tokenHash },
  });
  revalidatePath("/admin/mt5/tokens");
}

export async function createMt5EnrollmentToken(workerId: string, ttlMinutes = 15) {
  await requireAdminAuth();
  const normalizedWorkerId = workerId.trim();
  if (!normalizedWorkerId) {
    throw new Error("Worker ID is required");
  }
  const enrollmentToken = crypto.randomBytes(24).toString("base64url");
  const expiresAt = new Date(Date.now() + ttlMinutes * 60 * 1000);

  await prisma.mt5EnrollmentToken.create({
    data: {
      tokenHash: hashToken(enrollmentToken),
      rawToken: enrollmentToken,
      workerId: normalizedWorkerId,
      expiresAt,
    },
  });
  revalidatePath("/admin/mt5/tokens");
  return { enrollmentToken, expiresAt, workerId: normalizedWorkerId };
}
