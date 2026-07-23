import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getUserProAccess } from "@/lib/pro-access";

const PRO_LIMIT = 100;
const FREE_LIMIT = 10;

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
