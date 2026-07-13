import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest, props: { params: Promise<{ id: string }> }) {
  const params = await props.params;
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const accountId = params.id;

    let { from, to, mode } = await request.json();
    mode = mode || "FULL";

    let fromDt: Date;
    let toDt: Date = to ? new Date(to) : new Date();

    if (mode === "INCREMENTAL") {
      // Find the last successful job
      const lastJob = await prisma.mt5ImportJob.findFirst({
        where: { accountId, status: "COMPLETED" },
        orderBy: { rangeTo: "desc" },
      });

      if (lastJob && lastJob.rangeTo) {
        // Start from 1 day before the last successful rangeTo to ensure no overlap gaps
        fromDt = new Date(lastJob.rangeTo.getTime() - 24 * 60 * 60 * 1000);
      } else {
        // Fallback if no successful jobs exist
        fromDt = new Date(toDt.getTime() - 30 * 24 * 60 * 60 * 1000);
      }
    } else {
      if (!from) {
        return NextResponse.json({ error: "Missing from parameter for FULL mode" }, { status: 400 });
      }
      fromDt = new Date(from);
    }

    if (isNaN(fromDt.getTime()) || isNaN(toDt.getTime())) {
      return NextResponse.json({ error: "Invalid date format" }, { status: 400 });
    }

    if (fromDt >= toDt) {
      return NextResponse.json({ error: "from date must be earlier than to date" }, { status: 422 });
    }

    // Limit range to 10 years
    const maxRangeMs = 10 * 365.25 * 24 * 60 * 60 * 1000;
    if (toDt.getTime() - fromDt.getTime() > maxRangeMs) {
      return NextResponse.json({ error: "Date range cannot exceed 10 years" }, { status: 422 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const account = await tx.tradingAccount.findFirst({
        where: { id: accountId, userId: user.id },
      });

      if (!account) {
        throw new Error("NOT_FOUND");
      }

      // Check if there is already a queued or active import job for this account
      const activeJob = await tx.mt5ImportJob.findFirst({
        where: {
          accountId,
          status: { in: ["QUEUED", "CLAIMED", "AUTHENTICATING", "FETCHING_ORDERS", "FETCHING_DEALS", "UPLOADING", "CLEANING_UP", "PROJECTING"] },
        },
      });

      if (activeJob) {
        throw new Error("ALREADY_ACTIVE");
      }

      const jobId = "imp_" + crypto.randomBytes(8).toString("hex");
      const now = new Date();

      await tx.mt5ImportJob.create({
        data: {
          id: jobId,
          userId: user.id,
          accountId,
          mode: mode || "FULL",
          rangeFrom: fromDt,
          rangeTo: toDt,
          status: "QUEUED",
          progressPercent: 0,
          message: "Queued",
          createdAt: now,
          updatedAt: now,
        },
      });

      return jobId;
    });

    return NextResponse.json({
      job_id: result,
      status: "QUEUED",
      created_at: new Date().toISOString(),
    }, { status: 202 });
  } catch (error: any) {
    if (error.message === "NOT_FOUND") {
      return NextResponse.json({ error: "Trading account not found" }, { status: 404 });
    }
    if (error.message === "ALREADY_ACTIVE") {
      return NextResponse.json({ error: "An import job is already queued or in progress for this account" }, { status: 409 });
    }
    console.error("Failed to trigger import:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
