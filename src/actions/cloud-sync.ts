"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import { detectBroker } from "@/lib/ea/broker-detection";

export async function saveCloudSyncCredentials(
    accountId: string,
    investorPassword?: string,
    server?: string,
    broker?: string
) {
    const user = await getAuthUser();
    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    const account = await prisma.tradingAccount.findFirst({
        where: { id: accountId, userId: user.id },
        select: { id: true, accountNumber: true, server: true, credential: true },
    });

    if (!account) {
        return { success: false, error: "Account not found or access denied." };
    }

    const trimmedPassword = investorPassword?.trim();
    if (!trimmedPassword && !account.credential) {
        return { success: false, error: "Investor password is required." };
    }

    const effectiveServer = server?.trim() || account.server;
    if (!effectiveServer) {
        return {
            success: false,
            error: "Broker server is required. Please select or enter your broker server.",
        };
    }

    try {
        if (trimmedPassword) {
            await prisma.tradingAccountCredential.upsert({
                where: { accountId: account.id },
                create: {
                    accountId: account.id,
                    encryptedPassword: trimmedPassword,
                    keyVersion: "plain",
                },
                update: {
                    encryptedPassword: trimmedPassword,
                    keyVersion: "plain",
                    updatedAt: new Date(),
                },
            });
        }

        const detectedBroker =
            broker?.trim() ||
            (effectiveServer ? detectBroker(effectiveServer, "") : null);

        await prisma.tradingAccount.update({
            where: { id: account.id },
            data: {
                syncSource: "CLOUD_WORKER",
                ...(server?.trim() ? { server: server.trim() } : {}),
                ...(detectedBroker ? { broker: detectedBroker } : {}),
            },
        });

        revalidatePath("/dashboard/accounts");
        return { success: true };
    } catch (err: any) {
        return {
            success: false,
            error: err.message || "Failed to save credentials",
        };
    }
}

export async function triggerCloudSync(
    accountId: string,
    period: string | number = "30",
    customRange?: { from?: string | null; to?: string | null }
) {
    const user = await getAuthUser();
    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    const account = await prisma.tradingAccount.findFirst({
        where: { id: accountId, userId: user.id },
        include: { credential: true },
    });

    if (!account) {
        return { success: false, error: "Account not found" };
    }

    if (!account.credential) {
        return {
            success: false,
            error: "Please configure your Investor Password before syncing.",
            needsCredentials: true,
        };
    }

    // Check existing pending / running job
    const activeJob = await prisma.mt5ImportJob.findFirst({
        where: {
            accountId: account.id,
            status: { in: ["PENDING", "PROCESSING"] },
        },
        orderBy: { createdAt: "desc" },
    });

    if (activeJob) {
        const ageMs = Date.now() - new Date(activeJob.createdAt).getTime();
        const isPending = activeJob.status === "PENDING";
        const STALE_THRESHOLD_MS = isPending ? 60 * 1000 : 120 * 1000;
        if (ageMs > STALE_THRESHOLD_MS) {
            // Expire the old stuck job so user is not blocked
            await prisma.mt5ImportJob.update({
                where: { id: activeJob.id },
                data: {
                    status: "FAILED",
                    errorCode: "JOB_TIMEOUT",
                    errorMessage: isPending
                        ? "Sync request timed out waiting for worker pickup. Click Sync to try again or request Support Sync."
                        : "Previous sync request timed out during processing. Click Sync to try again.",
                    completedAt: new Date(),
                },
            });
        } else {
            return {
                success: true,
                jobId: activeJob.id,
                status: activeJob.status,
                message: isPending
                    ? "Sync request already in queue. Waiting for background worker."
                    : "Sync request is currently being processed by worker.",
            };
        }
    }

    const now = new Date();
    let fromDate: Date;
    let toDate: Date = now;
    const isCustom = String(period) === "custom";
    const isAll = String(period) === "all";

    if (isCustom) {
        if (customRange?.from) {
            fromDate = new Date(customRange.from);
        } else {
            fromDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        }
        if (customRange?.to) {
            const endOfDay = new Date(customRange.to);
            endOfDay.setHours(23, 59, 59, 999);
            toDate = endOfDay;
        }
    } else if (isAll) {
        fromDate = new Date(2015, 0, 1);
    } else {
        const days = Math.max(1, parseInt(String(period), 10) || 30);
        fromDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

    const job = await prisma.mt5ImportJob.create({
        data: {
            id: jobId,
            userId: user.id,
            accountId: account.id,
            mode: isAll ? "FULL_HISTORY" : "INCREMENTAL",
            rangeFrom: fromDate,
            rangeTo: toDate,
            status: "PENDING",
            progressPercent: 0,
            message: "Waiting for worker pickup...",
        },
    });

    revalidatePath("/dashboard/accounts");

    return {
        success: true,
        jobId: job.id,
        status: "PENDING",
        message: "Sync request queued successfully.",
    };
}

export async function getCloudSyncStatus(accountId: string) {
    const user = await getAuthUser();
    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    const account = await prisma.tradingAccount.findFirst({
        where: { id: accountId, userId: user.id },
        select: {
            id: true,
            syncSource: true,
            lastSync: true,
            credential: { select: { updatedAt: true } },
            mt5ImportJobs: {
                orderBy: { createdAt: "desc" },
                take: 1,
                select: {
                    id: true,
                    status: true,
                    message: true,
                    progressPercent: true,
                    dealsReceived: true,
                    errorMessage: true,
                    errorCode: true,
                    createdAt: true,
                    completedAt: true,
                },
            },
        },
    });

    if (!account) {
        return { success: false, error: "Account not found" };
    }

    let latestJob = account.mt5ImportJobs[0] || null;

    // Auto-expire stale PENDING (60s) or PROCESSING (120s) jobs
    if (latestJob && (latestJob.status === "PENDING" || latestJob.status === "PROCESSING")) {
        const ageMs = Date.now() - new Date(latestJob.createdAt).getTime();
        const isPending = latestJob.status === "PENDING";
        const STALE_THRESHOLD_MS = isPending ? 60 * 1000 : 120 * 1000;
        if (ageMs > STALE_THRESHOLD_MS) {
            const timeoutReason = isPending
                ? "Sync timed out: No background worker was available to pick up this request. Click Sync to retry or request manual Support Sync."
                : "Sync timed out during processing. The MT5 connection may have stalled. Click Sync to retry.";

            await prisma.mt5ImportJob.update({
                where: { id: latestJob.id },
                data: {
                    status: "FAILED",
                    errorCode: "JOB_TIMEOUT",
                    errorMessage: timeoutReason,
                    completedAt: new Date(),
                },
            });
            latestJob = {
                ...latestJob,
                status: "FAILED",
                errorCode: "JOB_TIMEOUT",
                errorMessage: timeoutReason,
            };
        }
    }

    return {
        success: true,
        hasCredentials: Boolean(account.credential),
        syncSource: account.syncSource,
        lastSync: account.lastSync,
        latestJob,
    };
}

export async function cancelCloudSyncJob(accountId: string, reason?: string) {
    const user = await getAuthUser();
    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    const activeJobs = await prisma.mt5ImportJob.findMany({
        where: {
            accountId,
            userId: user.id,
            status: { in: ["PENDING", "PROCESSING"] },
        },
        select: { id: true },
    });

    if (activeJobs.length === 0) {
        return { success: true, message: "No active sync job to cancel." };
    }

    await prisma.mt5ImportJob.updateMany({
        where: {
            id: { in: activeJobs.map((j) => j.id) },
        },
        data: {
            status: "FAILED",
            errorCode: reason ? "JOB_TIMEOUT" : "USER_CANCELLED",
            errorMessage: reason || "Sync cancelled by user.",
            completedAt: new Date(),
        },
    });

    revalidatePath("/dashboard/accounts");
    return { success: true, message: "Sync job cancelled." };
}
