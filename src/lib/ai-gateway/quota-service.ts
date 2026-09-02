import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserProAccess } from "@/lib/pro-access";

const PRO_LIMIT = 50;
const FREE_LIMIT = 10;

// A request left in an in-flight state past this age is considered orphaned
// (the process died or crashed between reserveAiRequest and the gateway's
// finalize). Max real in-flight window is ~2-3 min (per-call timeout up to 60s
// times a multi-fallback failover chain), so 15 min is a safe margin.
export const STALE_REQUEST_THRESHOLD_MS = 15 * 60 * 1000;
export const STALE_ORPHANED_ERROR_CODE = "STALE_ORPHANED_REQUEST";

const quotaConsumingFilter: Prisma.AiRequestWhereInput = {
    OR: [
        { status: { in: ["ROUTING", "CALLING_PROVIDER", "COMPLETED"] } },
        { status: "REJECTED", errorCode: "SAFETY_REJECTED" },
        { status: "FAILED", attempts: { some: { latencyMs: { gt: 0 } } } },
    ],
};

function startOfUtcDay(): Date {
    const start = new Date();
    start.setUTCHours(0, 0, 0, 0);
    return start;
}

async function countConsumedRequests(
    db: Prisma.TransactionClient | typeof prisma,
    userId: string
): Promise<number> {
    return db.aiRequest.count({
        where: {
            userId,
            createdAt: { gte: startOfUtcDay() },
            ...quotaConsumingFilter,
        },
    });
}

/**
 * Mark in-flight AI requests that have been stuck in ROUTING / CALLING_PROVIDER
 * past the stale threshold as FAILED so they stop consuming the daily quota.
 * A stale FAILED row with no timed attempt is NOT counted by quotaConsumingFilter,
 * so this frees the slot. Safe against races: the gateway's saveGatewayAuditRecord
 * only touches rows still in ROUTING/CALLING_PROVIDER when it finalizes, so a
 * legitimate late-completing request overwrites this FAILED with its true
 * COMPLETED (which counts exactly once).
 */
async function markStaleInFlightRequests(
    db: Prisma.TransactionClient | typeof prisma,
    userId: string | undefined,
    before: Date
): Promise<number> {
    const result = await db.aiRequest.updateMany({
        where: {
            ...(userId ? { userId } : {}),
            status: { in: ["ROUTING", "CALLING_PROVIDER"] },
            createdAt: { lt: before },
        },
        data: {
            status: "FAILED",
            errorCode: STALE_ORPHANED_ERROR_CODE,
            completedAt: new Date(),
        },
    });
    return result.count;
}

/**
 * Global stale-request sweep (used by the /api/cron/cleanup-stale-ai-requests
 * job). Clears orphaned ROUTING/CALLING_PROVIDER requests across all users so a
 * quota slot burned by a crash/restart is freed even if the affected user never
 * makes another request. Optionally scoped to a single user (the lazy self-heal
 * path inside reserveAiRequest calls markStaleInFlightRequests directly instead).
 */
export async function sweepStaleAiRequests(
    userId?: string,
    thresholdMs: number = STALE_REQUEST_THRESHOLD_MS
): Promise<number> {
    return markStaleInFlightRequests(
        prisma,
        userId,
        new Date(Date.now() - thresholdMs)
    );
}

export async function getUserQuotaUsage(userId: string) {
    const proAccess = await getUserProAccess(userId);
    const dailyLimit = proAccess.isPro ? PRO_LIMIT : FREE_LIMIT;
    const usedToday = await countConsumedRequests(prisma, userId);
    return {
        isPro: proAccess.isPro,
        dailyLimit,
        usedToday,
        remainingToday: Math.max(0, dailyLimit - usedToday),
        hasQuota: usedToday < dailyLimit,
    };
}

export const checkUserQuota = getUserQuotaUsage;

export interface ReserveAiRequestInput {
    requestId: string;
    userId: string;
    symbol: string;
    timeframe?: string;
    analysisMode: string;
    promptVersion: string;
    taskKey?: string;
}

export async function reserveAiRequest(input: ReserveAiRequestInput) {
    const proAccess = await getUserProAccess(input.userId);
    const dailyLimit = proAccess.isPro ? PRO_LIMIT : FREE_LIMIT;

    return prisma.$transaction(
        async (tx) => {
            const lockKey = `ai-quota:${input.userId}:${startOfUtcDay().toISOString().slice(0, 10)}`;
            await tx.$executeRaw`SELECT pg_advisory_xact_lock(hashtext(${lockKey}))`;

            const duplicate = await tx.aiRequest.findUnique({
                where: { requestId: input.requestId },
            });
            if (duplicate) {
                return { status: "DUPLICATE" as const };
            }

            // Self-heal: free any of this user's slots stuck in ROUTING/CALLING_PROVIDER
            // from an earlier crash/restart before counting against the daily quota.
            // Runs under the per-user advisory lock, so it cannot race a concurrent reserve.
            await markStaleInFlightRequests(
                tx,
                input.userId,
                new Date(Date.now() - STALE_REQUEST_THRESHOLD_MS)
            );

            const usedToday = await countConsumedRequests(tx, input.userId);
            if (usedToday >= dailyLimit) {
                return {
                    status: "QUOTA_EXCEEDED" as const,
                    quota: {
                        isPro: proAccess.isPro,
                        dailyLimit,
                        usedToday,
                        remainingToday: 0,
                    },
                };
            }

            const aiRequest = await tx.aiRequest.create({
                data: {
                    requestId: input.requestId,
                    userId: input.userId,
                    symbol: input.symbol,
                    timeframe: input.timeframe,
                    analysisMode: input.analysisMode,
                    promptVersion: input.promptVersion,
                    taskKey: input.taskKey || "TRADE_ANALYSIS",
                    status: "ROUTING",
                },
            });
            return {
                status: "RESERVED" as const,
                aiRequest,
                quota: {
                    isPro: proAccess.isPro,
                    dailyLimit,
                    usedToday: usedToday + 1,
                    remainingToday: Math.max(0, dailyLimit - usedToday - 1),
                },
            };
        },
        { isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted }
    );
}
