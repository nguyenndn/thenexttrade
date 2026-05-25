"use server";

import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import {
  getUserMissions,
  claimMissionReward,
} from "@/lib/services/edge-missions.service";

export async function getMyMissions() {
  const user = await getAuthUser();
  if (!user) return { missions: [], xp: 0, error: "Unauthorized" };

  try {
    const missions = await getUserMissions(user.id);
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { xp: true }
    });
    return { missions, xp: dbUser?.xp ?? 0 };
  } catch (error) {
    console.error("getMyMissions error:", error);
    return { missions: [], xp: 0, error: "Failed to load missions" };
  }
}

export async function claimMission(missionId: string) {
  const user = await getAuthUser();
  if (!user) return { success: false, xpAwarded: 0, error: "Unauthorized" };

  try {
    return await claimMissionReward(user.id, missionId);
  } catch (error) {
    console.error("claimMission error:", error);
    return { success: false, xpAwarded: 0, error: "Failed to claim reward" };
  }
}

export async function getStreakGridData() {
  const user = await getAuthUser();
  if (!user) return { checkInHistory: [] as string[], tradeHistory: [] as string[], error: "Unauthorized" };

  try {
    const oneYearAgo = new Date();
    oneYearAgo.setDate(oneYearAgo.getDate() - 365);

    // 1. Fetch user check-in history
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { checkInHistory: true }
    });

    const checkInHistory = (dbUser?.checkInHistory as string[]) || [];

    // 2. Fetch trade entry dates for the past 365 days
    const trades = await prisma.journalEntry.findMany({
      where: {
        userId: user.id,
        entryDate: { gte: oneYearAgo }
      },
      select: { entryDate: true }
    });

    // Format all dates to YYYY-MM-DD and unique-ify
    const tradeHistory = Array.from(
      new Set(trades.map((t: any) => t.entryDate.toISOString().split("T")[0]))
    );

    const formattedCheckIn = Array.from(
      new Set(checkInHistory.map((h: any) => new Date(h).toISOString().split("T")[0]))
    );

    return {
      checkInHistory: formattedCheckIn,
      tradeHistory
    };
  } catch (error) {
    console.error("getStreakGridData error:", error);
    return { checkInHistory: [] as string[], tradeHistory: [] as string[], error: "Failed to load streak history" };
  }
}


