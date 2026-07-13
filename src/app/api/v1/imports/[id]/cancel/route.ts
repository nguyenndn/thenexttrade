import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";

const CANCELLABLE_STATUSES = [
  "QUEUED",
  "CLAIMED",
  "AUTHENTICATING",
  "FETCHING_ORDERS",
  "FETCHING_DEALS",
  "UPLOADING",
];

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
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

    if (!CANCELLABLE_STATUSES.includes(job.status)) {
      return NextResponse.json(
        { error: `Cannot cancel job in status: ${job.status}` },
        { status: 400 }
      );
    }

    const updatedJob = await prisma.mt5ImportJob.update({
      where: { id: jobId },
      data: {
        status: "CANCELLED",
        errorCode: "IMPORT_CANCELLED",
        errorMessage: "Cancelled by user",
        leaseExpiresAt: null, // Revoke lease so worker drops it
      },
    });

    return NextResponse.json({
      success: true,
      job_id: updatedJob.id,
      status: updatedJob.status,
    });
  } catch (error) {
    console.error("Failed to cancel import job:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
