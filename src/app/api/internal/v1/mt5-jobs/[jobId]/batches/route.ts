import { NextRequest, NextResponse } from "next/server";
import zlib from "zlib";
import crypto from "crypto";
import { prisma } from "@/lib/prisma";
import { resolveWorkerAuth } from "@/lib/mt5/worker-auth";

function canonicalRecords(records: any[]): string {
  const sortKeys = (obj: any): any => {
    if (obj === null || typeof obj !== "object") {
      return obj;
    }
    if (Array.isArray(obj)) {
      return obj.map(sortKeys);
    }
    const sortedObj: any = {};
    const keys = Object.keys(obj).sort();
    for (const key of keys) {
      sortedObj[key] = sortKeys(obj[key]);
    }
    return sortedObj;
  };
  const jsonStr = JSON.stringify(sortKeys(records));
  return jsonStr.replace(/[\u007f-\uffff]/g, (c) => {
    return "\\u" + ("0000" + c.charCodeAt(0).toString(16)).slice(-4);
  });
}

export async function POST(request: NextRequest, props: { params: Promise<{ jobId: string }> }) {
  const params = await props.params;
  try {
    const authResult = await resolveWorkerAuth(request);
    if (!authResult.success) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }
    const workerId = authResult.workerId;
    const jobId = params.jobId;

    let bodyBuffer = Buffer.from(await request.arrayBuffer());
    const contentEncoding = request.headers.get("content-encoding") || "";

    if (contentEncoding.toLowerCase() === "gzip") {
      try {
        bodyBuffer = zlib.gunzipSync(bodyBuffer);
      } catch (err) {
        return NextResponse.json({ error: "Invalid gzip body" }, { status: 400 });
      }
    }

    let payload: any;
    try {
      payload = JSON.parse(bodyBuffer.toString("utf8"));
    } catch (err) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    const { lease_id, entity_type, batch_index, total_batches, checksum, records } = payload;

    if (
      !lease_id ||
      !entity_type ||
      batch_index === undefined ||
      total_batches === undefined ||
      !checksum ||
      !Array.isArray(records)
    ) {
      return NextResponse.json({ error: "Missing batch fields" }, { status: 422 });
    }

    if (entity_type !== "ORDERS" && entity_type !== "DEALS") {
      return NextResponse.json({ error: "Invalid entity_type" }, { status: 422 });
    }

    const actualChecksum = crypto.createHash("sha256").update(canonicalRecords(records)).digest("hex");
    if (actualChecksum !== checksum) {
      return NextResponse.json({ error: "Batch checksum mismatch" }, { status: 409 });
    }

    const leaseExpiresAt = new Date(Date.now() + 600 * 1000);

    const result = await prisma.$transaction(async (tx) => {
      const job = await tx.mt5ImportJob.findUnique({
        where: { id: jobId },
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

      // Check for duplicate batch index
      const existingBatch = await tx.mt5Batch.findUnique({
        where: {
          jobId_entityType_batchIndex: {
            jobId,
            entityType: entity_type,
            batchIndex: batch_index,
          },
        },
      });

      if (existingBatch) {
        if (existingBatch.checksum !== checksum || existingBatch.totalBatches !== total_batches) {
          throw new Error("IDEMPOTENCY_CONFLICT");
        }
        return { duplicate: true, received: existingBatch.recordCount };
      }

      // Ingress raw records
      const now = new Date();
      if (entity_type === "ORDERS") {
        for (const record of records) {
          if (!record.ticket) throw new Error("RECORD_INVALID");
          const ticket = String(record.ticket);
          await tx.mt5RawOrder.upsert({
            where: {
              accountId_ticket: {
                accountId: job.accountId,
                ticket,
              },
            },
            create: {
              accountId: job.accountId,
              ticket,
              payloadJson: record,
              lastJobId: jobId,
              updatedAt: now,
            },
            update: {
              payloadJson: record,
              lastJobId: jobId,
              updatedAt: now,
            },
          });
        }

        await tx.mt5ImportJob.update({
          where: { id: jobId },
          data: {
            ordersReceived: { increment: records.length },
            status: "UPLOADING",
            message: `Uploaded ORDERS batch ${batch_index + 1}/${total_batches}`,
            leaseExpiresAt,
          },
        });
      } else {
        for (const record of records) {
          if (!record.ticket) throw new Error("RECORD_INVALID");
          const ticket = String(record.ticket);
          await tx.mt5RawDeal.upsert({
            where: {
              accountId_ticket: {
                accountId: job.accountId,
                ticket,
              },
            },
            create: {
              accountId: job.accountId,
              ticket,
              payloadJson: record,
              lastJobId: jobId,
              updatedAt: now,
            },
            update: {
              payloadJson: record,
              lastJobId: jobId,
              updatedAt: now,
            },
          });
        }

        await tx.mt5ImportJob.update({
          where: { id: jobId },
          data: {
            dealsReceived: { increment: records.length },
            status: "UPLOADING",
            message: `Uploaded DEALS batch ${batch_index + 1}/${total_batches}`,
            leaseExpiresAt,
          },
        });
      }

      await tx.mt5Batch.create({
        data: {
          jobId,
          entityType: entity_type,
          batchIndex: batch_index,
          totalBatches: total_batches,
          checksum,
          recordCount: records.length,
        },
      });

      return { duplicate: false, received: records.length };
    });

    return NextResponse.json({ accepted: true, duplicate: result.duplicate, received: result.received });
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
    if (error.message === "IDEMPOTENCY_CONFLICT") {
      return NextResponse.json({ error: "Idempotency conflict for batch index" }, { status: 409 });
    }
    if (error.message === "RECORD_INVALID") {
      return NextResponse.json({ error: "Every record requires ticket" }, { status: 422 });
    }
    console.error("Batch upload failed:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
