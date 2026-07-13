import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveWorkerAuth } from "@/lib/mt5/worker-auth";

export async function POST(request: NextRequest) {
  try {
    const authResult = await resolveWorkerAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const workerId = authResult.workerId;
    const { version, status, current_job_id } = await request.json();

    await prisma.mt5Worker.update({
      where: { id: workerId },
      data: {
        status: "ONLINE",
        lastHeartbeat: new Date(),
        currentJobId: current_job_id || null,
        version: version || null,
      },
    });

    return NextResponse.json({
      accepted: true,
      worker_id: workerId,
      server_time_utc: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Worker heartbeat failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
