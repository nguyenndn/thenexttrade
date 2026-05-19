// ============================================================================
// EDGE MISSIONS SERVICE — Progress tracking & claim flow
// ============================================================================

import { prisma } from "@/lib/prisma";
import { EDGE_MISSIONS, getMissionDef, type MissionDef } from "@/config/edge-missions";

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
  const date = new Date(Date.UTC(
    input.getUTCFullYear(),
    input.getUTCMonth(),
    input.getUTCDate()
  ));

  // ISO week: Thursday determines the week-year
  date.setUTCDate(date.getUTCDate() + 4 - (date.getUTCDay() || 7));

  const weekYear = date.getUTCFullYear();
  const yearStart = new Date(Date.UTC(weekYear, 0, 1));
  const week = Math.ceil((((date.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);

  return { weekYear, week };
}

export function getCurrentWeekPeriodKey(date = new Date()) {
  const { weekYear, week } = getIsoWeekYearAndNumber(date);
  return `${weekYear}-W${String(week).padStart(2, "0")}`;
}

export function getCurrentDayPeriodKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function getMissionPeriodKey(def: MissionDef) {
  if (def.cadence === "DAILY") return getCurrentDayPeriodKey();
  if (def.cadence === "WEEKLY") return getCurrentWeekPeriodKey();
  return "lifetime";
}

export function getCurrentWeekRange(date = new Date()) {
  const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const day = start.getUTCDay() || 7;
  start.setUTCDate(start.getUTCDate() - day + 1);
  
  const end = new Date(start);
  end.setUTCDate(start.getUTCDate() + 7);
  
  return { start, end };
}

export function getCurrentDayRange(date = new Date()) {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const end = new Date(start);
  end.setDate(start.getDate() + 1);

  return { start, end };
}

/**
 * Get all mission progress for a user, initializing any missing records.
 */
export async function getUserMissions(
  userId: string
): Promise<MissionProgressItem[]> {
  // Fetch existing progress
  const existing = await prisma.userMissionProgress.findMany({
    where: { userId },
  });

  const progressMap = new Map(existing.map((p) => [`${p.missionId}:${p.periodKey}`, p]));

  const results: MissionProgressItem[] = [];

  for (const def of EDGE_MISSIONS) {
    const periodKey = getMissionPeriodKey(def);
    const record = progressMap.get(`${def.id}:${periodKey}`);

    // Auto-calculate progress from EdgeEvents for unclaimed missions
    let progress = record?.progress ?? 0;

    if (!record || (!record.claimed && !record.completedAt)) {
      // Count matching events
      const where: any = { userId, eventType: def.eventType };
      if (def.cadence === "DAILY") {
        const { start, end } = getCurrentDayRange();
        where.createdAt = { gte: start, lt: end };
      } else if (def.cadence === "WEEKLY") {
        const { start, end } = getCurrentWeekRange();
        where.createdAt = { gte: start, lt: end };
      }
      
      const eventCount = await prisma.edgeEvent.count({ where });
      progress = Math.min(eventCount, def.target);

      // Upsert progress record
      if (!record) {
        await prisma.userMissionProgress.create({
          data: {
            userId,
            missionId: def.id,
            periodKey,
            progress,
            target: def.target,
            completedAt: progress >= def.target ? new Date() : null,
          },
        });
      } else if (progress !== record.progress) {
        await prisma.userMissionProgress.update({
          where: { id: record.id },
          data: {
            progress,
            completedAt:
              progress >= def.target && !record.completedAt
                ? new Date()
                : record.completedAt,
          },
        });
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
 * Claim XP reward for a completed mission.
 */
export async function claimMissionReward(
  userId: string,
  missionId: string
): Promise<{ success: boolean; xpAwarded: number; error?: string }> {
  const def = getMissionDef(missionId);
  if (!def) return { success: false, xpAwarded: 0, error: "Unknown mission" };

  const periodKey = getMissionPeriodKey(def);

  const record = await prisma.userMissionProgress.findUnique({
    where: { userId_missionId_periodKey: { userId, missionId, periodKey } },
  });

  if (!record) return { success: false, xpAwarded: 0, error: "Mission not started" };
  if (record.claimed) return { success: false, xpAwarded: 0, error: "Already claimed" };
  if (record.progress < def.target) return { success: false, xpAwarded: 0, error: "Not yet completed" };

  // Award XP and mark claimed
  await prisma.$transaction([
    prisma.userMissionProgress.update({
      where: { id: record.id },
      data: { claimed: true, claimedAt: new Date() },
    }),
    prisma.user.update({
      where: { id: userId },
      data: { xp: { increment: def.xpReward } },
    }),
    prisma.edgeEvent.create({
      data: {
        userId,
        eventType: `MISSION_CLAIM_${missionId}`,
        sourceType: "Mission",
        sourceId: `${missionId}:${periodKey}`,
        xpAwarded: def.xpReward,
      },
    }),
  ]);

  return { success: true, xpAwarded: def.xpReward };
}
