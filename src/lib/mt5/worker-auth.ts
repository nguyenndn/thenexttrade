import { NextRequest } from "next/server";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function resolveWorkerAuth(request: NextRequest): Promise<{ success: true; workerId: string } | { success: false; status: number; error: string }> {
  const authHeader = request.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Worker ")) {
    return { success: false, status: 401, error: "Missing or invalid worker authorization header" };
  }
  const token = authHeader.substring(7);
  const tokenHash = hashToken(token);

  const worker = await prisma.mt5Worker.findFirst({
    where: { tokenHash },
    select: { id: true, status: true }
  });

  if (!worker || worker.status === "REVOKED") {
    return { success: false, status: 401, error: "Unauthorized worker token" };
  }

  return { success: true, workerId: worker.id };
}
