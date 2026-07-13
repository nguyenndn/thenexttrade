import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const jobId = params.id;

    const job = await prisma.mt5ImportJob.findFirst({
      where: { id: jobId, userId: user.id },
    });

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({
      job_id: job.id,
      status: job.status,
      progress_percent: job.progressPercent,
      message: job.message,
      worker_id: job.workerId,
      orders_received: job.ordersReceived,
      deals_received: job.dealsReceived,
      error_code: job.errorCode,
      error_message: job.errorMessage,
      created_at: job.createdAt.toISOString(),
      updated_at: job.updatedAt.toISOString(),
      completed_at: job.completedAt ? job.completedAt.toISOString() : null,
    });
  } catch (error) {
    console.error("Failed to retrieve import job status:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
