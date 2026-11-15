// ============================================================================
// EDGE MISSIONS SERVICE — Progress tracking & claim flow
// ============================================================================

import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import {
    EDGE_MISSIONS,
    getMissionDef,
    type MissionDef,
} from "@/config/edge-missions";
import { isAcademyEnabled } from "@/app/admin/academy/actions";

export interface MissionProgressItem {
    missionId: string;
    periodKey: string;
    def: MissionDef;
    progress: number;
    target: number;
    completed: boolean;
    claimed: boolean;
    claimedAt: string | null;
}

function getIsoWeekYearAndNumber(input: Date) {
    const date = new Date(
        Date.UTC(
            input.getUTCFullYear(),
            input.getUTCMonth(),
            input.getUTCDate()
        )
    );

    // ISO week: Thursday determines the week-year
    date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));

    const weekYear = date.getUTCFullYear();
    const yearStart = new Date(Date.UTC(weekYear, 0, 1));
    const week = Math.ceil(
        ((date.getTime() - yearStart.getTime()) / 86400000 + 1) / 7
    );

    return { weekYear, week };
}

export function getCurrentWeekPeriodKey(date = new Date()) {
    const { weekYear, week } = getIsoWeekYearAndNumber(date);
    return `${weekYear}-W${String(week).padStart(2, "0")}`;
}

export function getCurrentDayPeriodKey(date = new Date()) {
    const year = date.getUTCFullYear();
    const month = String(date.getUTCMonth() + 1).padStart(2, "0");
    const day = String(date.getUTCDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export function getMissionPeriodKey(def: MissionDef, date = new Date()) {
    if (def.cadence === "DAILY") return getCurrentDayPeriodKey(date);
    if (def.cadence === "WEEKLY") return getCurrentWeekPeriodKey(date);
    return "lifetime";
}

export function getCurrentWeekRange(date = new Date()) {
    const start = new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    );
    const day = start.getUTCDay() || 7;
    start.setUTCDate(start.getUTCDate() - day + 1);

    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 7);

    return { start, end };
}

export function getCurrentDayRange(date = new Date()) {
    const start = new Date(
        Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())
    );
    const end = new Date(start);
    end.setUTCDate(start.getUTCDate() + 1);

    return { start, end };
}

/**
 * Get all mission progress for a user, initializing any missing records.
 */
export async function getUserMissions(
    userId: string
): Promise<MissionProgressItem[]> {
    const now = new Date();

    // Fetch existing progress and feature flag in parallel
    const [existing, academyEnabled] = await Promise.all([
        prisma.userMissionProgress.findMany({
            where: { userId },
        }),
        isAcademyEnabled(),
    ]);

    const progressMap = new Map(
        existing.map((p) => [`${p.missionId}:${p.periodKey}`, p])
    );

    const activeMissionDefs = academyEnabled
        ? EDGE_MISSIONS
        : EDGE_MISSIONS.filter(
              (def) =>
                  !def.ctaHref.startsWith("/dashboard/academy") &&
                  !def.ctaHref.startsWith("/academy")
          );

    const results: MissionProgressItem[] = [];

    for (const def of activeMissionDefs) {
        const periodKey = getMissionPeriodKey(def, now);
        let record = progressMap.get(`${def.id}:${periodKey}`);

        // Auto-calculate progress from EdgeEvents for unclaimed missions
        let progress = record?.progress ?? 0;

        if (!record || (!record.claimed && !record.completedAt)) {
            const where: Prisma.EdgeEventWhereInput = {
                userId,
                eventType: def.eventType,
            };
            if (def.cadence === "DAILY") {
                const { start, end } = getCurrentDayRange(now);
                where.createdAt = { gte: start, lt: end };
            } else if (def.cadence === "WEEKLY") {
                const { start, end } = getCurrentWeekRange(now);
                where.createdAt = { gte: start, lt: end };
            }

            const eventCount = await prisma.edgeEvent.count({ where });
            progress = Math.min(eventCount, def.target);

            // Atomic upsert (with P2002 fallback for concurrent requests)
            const completedAt =
                progress >= def.target
                    ? (record?.completedAt ?? now)
                    : (record?.completedAt ?? null);

            if (!record || progress !== record.progress) {
                try {
                    record = await prisma.userMissionProgress.upsert({
                        where: {
                            userId_missionId_periodKey: {
                                userId,
                                missionId: def.id,
                                periodKey,
                            },
                        },
                        create: {
                            userId,
                            missionId: def.id,
                            periodKey,
                            progress,
                            target: def.target,
                            completedAt,
                        },
                        update: {
                            progress,
                            completedAt,
                        },
                    });
                } catch (err) {
                    if (
                        err instanceof Prisma.PrismaClientKnownRequestError &&
                        err.code === "P2002"
                    ) {
                        const concurrentRecord =
                            await prisma.userMissionProgress.findUnique({
                                where: {
                                    userId_missionId_periodKey: {
                                        userId,
                                        missionId: def.id,
                                        periodKey,
                                    },
                                },
                            });
                        if (concurrentRecord) {
                            record = concurrentRecord;
                            progress = Math.max(progress, concurrentRecord.progress);
                        }
                    } else {
                        throw err;
                    }
                }
            }
        }

        results.push({
            missionId: def.id,
            periodKey,
            def,
            progress,
            target: def.target,
            completed: progress >= def.target,
            claimed: record?.claimed ?? false,
            claimedAt: record?.claimedAt?.toISOString() ?? null,
        });
    }

    return results;
}

/**
 * Claim XP reward for a completed mission (concurrency-safe via conditional updateMany).
 */
export async function claimMissionReward(
    userId: string,
    missionId: string
): Promise<{ success: boolean; xpAwarded: number; error?: string }> {
    const def = getMissionDef(missionId);
    if (!def) return { success: false, xpAwarded: 0, error: "Unknown mission" };

    const periodKey = getMissionPeriodKey(def);

    const row = await prisma.userMissionProgress.findUnique({
        where: { userId_missionId_periodKey: { userId, missionId, periodKey } },
    });

    if (!row)
        return { success: false, xpAwarded: 0, error: "Mission not started" };
    if (row.claimed)
        return { success: false, xpAwarded: 0, error: "Already claimed" };
    if (row.progress < def.target)
        return { success: false, xpAwarded: 0, error: "Not yet completed" };

    try {
        await prisma.$transaction(async (tx) => {
            const updated = await tx.userMissionProgress.updateMany({
                where: {
                    id: row.id,
                    userId,
                    claimed: false,
                    progress: { gte: def.target },
                },
                data: {
                    claimed: true,
                    claimedAt: new Date(),
                },
            });

            if (updated.count !== 1) {
                throw new Error("Mission already claimed or incomplete");
            }

            await tx.user.update({
                where: { id: userId },
                data: { xp: { increment: def.xpReward } },
            });

            await tx.edgeEvent.create({
                data: {
                    userId,
                    eventType: `MISSION_CLAIM_${missionId}`,
                    sourceType: "Mission",
                    sourceId: `${missionId}:${periodKey}`,
                    xpAwarded: def.xpReward,
                },
            });
        });

        return { success: true, xpAwarded: def.xpReward };
    } catch (err) {
        if (
            err instanceof Error &&
            err.message === "Mission already claimed or incomplete"
        ) {
            return { success: false, xpAwarded: 0, error: "Already claimed" };
        }
        throw err;
    }
}
