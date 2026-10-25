import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * Persisted last-run health for scheduled jobs.
 *
 * Stored in `SystemSetting` under `cron:last-run:<job>` so cron routes can
 * report status without a schema change. A missing record means the job has
 * not run since this instrumentation was deployed — it does not prove the
 * external scheduler is configured.
 */
export const CRON_JOBS = [
    "activation-reminders",
    "cleanup-security-logs",
    "cleanup-stale-ai-requests",
    "expire-licenses",
    "generate-reports",
    "ib-snapshots",
    "license-github-sync",
    "send-scheduled-broadcasts",
    "support-sync",
    "sync-events",
    "vip-policy",
    "welcome-nudges",
] as const;

export type CronJobName = (typeof CRON_JOBS)[number];
export type CronRunStatus = "SUCCESS" | "FAILED";

export interface CronRunRecord {
    job: string;
    lastStartedAt: string;
    lastCompletedAt: string;
    status: CronRunStatus;
    durationMs: number;
    error: string | null;
}

const KEY_PREFIX = "cron:last-run:";

function scrubSecrets(value: string): string {
    return value
        .replace(/Bearer\s+[^\s,;]+/gi, "Bearer [redacted]")
        .replace(/gh[pousr]_[A-Za-z0-9]+/g, "[redacted-token]")
        .slice(0, 500);
}

function normalizeError(error: unknown): string | null {
    if (!error) return null;
    if (error instanceof Error) return scrubSecrets(error.message);
    if (typeof error === "string") return scrubSecrets(error);
    return "Unknown cron failure";
}

/**
 * Records the outcome of one cron invocation. Never throws: health logging
 * must not turn a successful job into a failed response.
 */
export async function recordCronRun(
    job: CronJobName,
    startedAt: Date,
    status: CronRunStatus,
    error?: unknown
): Promise<void> {
    const completedAt = new Date();
    const record: CronRunRecord = {
        job,
        lastStartedAt: startedAt.toISOString(),
        lastCompletedAt: completedAt.toISOString(),
        status,
        durationMs: Math.max(0, completedAt.getTime() - startedAt.getTime()),
        error: normalizeError(error),
    };

    const value = record as unknown as Prisma.InputJsonValue;

    try {
        await prisma.systemSetting.upsert({
            where: { key: `${KEY_PREFIX}${job}` },
            create: { key: `${KEY_PREFIX}${job}`, value },
            update: { value },
        });
    } catch (recordError) {
        console.error(`[cron] Failed to record last-run for ${job}`, recordError);
    }
}

export async function getCronRunRecords(): Promise<CronRunRecord[]> {
    try {
        const rows = await prisma.systemSetting.findMany({
            where: { key: { startsWith: KEY_PREFIX } },
            orderBy: { key: "asc" },
        });
        return rows
            .map((row) => row.value as unknown as CronRunRecord)
            .filter((value) => Boolean(value?.lastStartedAt));
    } catch (error) {
        console.error("[cron] Failed to read last-run records", error);
        return [];
    }
}
