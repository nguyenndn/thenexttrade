import { prisma } from "@/lib/prisma";
import { LicenseGitHubSyncJobStatus, Prisma } from "@prisma/client";
import { syncLicensesToGitHubBackup } from "@/lib/ea/github-license-sync.server";

const RETRY_BASE_MS = 5 * 60 * 1000;
const RETRY_MAX_MS = 6 * 60 * 60 * 1000;
const SKIPPED_RETRY_MS = 60 * 60 * 1000;
const MAX_ATTEMPTS = 12;
const PROCESSING_TIMEOUT_MS = 15 * 60 * 1000;

export interface LicenseGitHubSyncOutcome {
    githubSynced: boolean;
    githubSkipped: boolean;
    githubError?: string;
    syncJobId?: string;
}

export interface LicenseGitHubSyncJobSummary {
    processed: number;
    completed: number;
    retried: number;
    skipped: number;
    failed: number;
}

function computeBackoffMs(attempts: number): number {
    const exponential = RETRY_BASE_MS * Math.pow(2, Math.max(0, attempts - 1));
    return Math.min(exponential, RETRY_MAX_MS);
}

export async function enqueueLicenseGitHubSyncJob(params: {
    eventKey: string;
    payload?: Prisma.InputJsonValue;
    lastError?: string;
    nextAttemptAt?: Date;
}): Promise<{ id: string } | null> {
    try {
        return await prisma.licenseGitHubSyncJob.upsert({
            where: { eventKey: params.eventKey },
            create: {
                eventKey: params.eventKey,
                ...(params.payload !== undefined
                    ? { payload: params.payload }
                    : {}),
                status: LicenseGitHubSyncJobStatus.PENDING,
                lastError: params.lastError,
                nextAttemptAt: params.nextAttemptAt ?? new Date(),
            },
            update: {
                status: LicenseGitHubSyncJobStatus.PENDING,
                lastError: params.lastError,
                nextAttemptAt: params.nextAttemptAt ?? new Date(),
                completedAt: null,
                ...(params.payload !== undefined
                    ? { payload: params.payload }
                    : {}),
            },
            select: { id: true },
        });
    } catch (error) {
        console.error("enqueueLicenseGitHubSyncJob error:", error);
        return null;
    }
}

/**
 * Runs the GitHub backup sync. When the sync fails or is skipped (for
 * example because GITHUB_TOKEN is missing), a durable retry job is queued
 * so the backup can catch up without lying to the admin about the result.
 */
export async function syncLicenseBackupOrQueue(params: {
    eventKey: string;
    removedAccountNumber?: string;
    removedBroker?: string;
}): Promise<LicenseGitHubSyncOutcome> {
    const removal = params.removedAccountNumber
        ? {
              removedAccountNumber: params.removedAccountNumber,
              ...(params.removedBroker
                  ? { removedBroker: params.removedBroker }
                  : {}),
          }
        : undefined;
    const result = await syncLicensesToGitHubBackup(removal);

    if (result.success && result.synced) {
        return { githubSynced: true, githubSkipped: false };
    }

    const error = result.error || "GitHub backup sync failed";
    const job = await enqueueLicenseGitHubSyncJob({
        eventKey: params.eventKey,
        payload: removal,
        lastError: error,
        nextAttemptAt: new Date(Date.now() + RETRY_BASE_MS),
    });

    return {
        githubSynced: false,
        githubSkipped: Boolean(result.skipped),
        githubError: error,
        syncJobId: job?.id,
    };
}

/**
 * Processes queued GitHub sync retries. Safe to run from a cron route.
 */
export async function processLicenseGitHubSyncJobs(
    limit = 10
): Promise<LicenseGitHubSyncJobSummary> {
    const summary: LicenseGitHubSyncJobSummary = {
        processed: 0,
        completed: 0,
        retried: 0,
        skipped: 0,
        failed: 0,
    };

    const now = new Date();

    // Recover jobs stuck in PROCESSING after a crash/timeout.
    await prisma.licenseGitHubSyncJob.updateMany({
        where: {
            status: LicenseGitHubSyncJobStatus.PROCESSING,
            updatedAt: { lt: new Date(now.getTime() - PROCESSING_TIMEOUT_MS) },
        },
        data: {
            status: LicenseGitHubSyncJobStatus.PENDING,
            nextAttemptAt: now,
            lastError: "Processing timed out; requeued.",
        },
    });

    const jobs = await prisma.licenseGitHubSyncJob.findMany({
        where: {
            status: LicenseGitHubSyncJobStatus.PENDING,
            nextAttemptAt: { lte: now },
        },
        orderBy: { nextAttemptAt: "asc" },
        take: limit,
    });

    for (const job of jobs) {
        const claim = await prisma.licenseGitHubSyncJob.updateMany({
            where: {
                id: job.id,
                status: LicenseGitHubSyncJobStatus.PENDING,
            },
            data: { status: LicenseGitHubSyncJobStatus.PROCESSING },
        });

        if (claim.count === 0) continue;
        summary.processed++;

        const payload = job.payload as
            | { removedAccountNumber?: string; removedBroker?: string }
            | null;
        const removedAccountNumber =
            payload?.removedAccountNumber?.trim() || undefined;
        const removedBroker = payload?.removedBroker?.trim() || undefined;

        const result = await syncLicensesToGitHubBackup(
            removedAccountNumber
                ? {
                      removedAccountNumber,
                      ...(removedBroker ? { removedBroker } : {}),
                  }
                : undefined
        );

        if (result.success && result.synced) {
            await prisma.licenseGitHubSyncJob.update({
                where: { id: job.id },
                data: {
                    status: LicenseGitHubSyncJobStatus.COMPLETED,
                    completedAt: new Date(),
                    lastError: null,
                },
            });
            summary.completed++;
            continue;
        }

        const error = result.error || "GitHub backup sync failed";

        if (result.skipped) {
            // Missing configuration is not a failed attempt: keep the job
            // queued and try again once the token is configured.
            await prisma.licenseGitHubSyncJob.update({
                where: { id: job.id },
                data: {
                    status: LicenseGitHubSyncJobStatus.PENDING,
                    lastError: error,
                    nextAttemptAt: new Date(Date.now() + SKIPPED_RETRY_MS),
                },
            });
            summary.skipped++;
            continue;
        }

        const attempts = job.attempts + 1;
        const isExhausted = attempts >= MAX_ATTEMPTS;

        await prisma.licenseGitHubSyncJob.update({
            where: { id: job.id },
            data: {
                status: isExhausted
                    ? LicenseGitHubSyncJobStatus.FAILED
                    : LicenseGitHubSyncJobStatus.PENDING,
                attempts,
                lastError: error,
                nextAttemptAt: new Date(Date.now() + computeBackoffMs(attempts)),
            },
        });

        if (isExhausted) {
            summary.failed++;
        } else {
            summary.retried++;
        }
    }

    return summary;
}
