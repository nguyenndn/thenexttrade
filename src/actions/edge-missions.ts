"use server";

import { getAuthUser } from "@/lib/auth-cache";
import {
  getUserMissions,
  claimMissionReward,
} from "@/lib/services/edge-missions.service";

export async function getMyMissions() {
  const user = await getAuthUser();
  if (!user) return { missions: [], error: "Unauthorized" };

  try {
    const missions = await getUserMissions(user.id);
    return { missions };
  } catch (error) {
    console.error("getMyMissions error:", error);
    return { missions: [], error: "Failed to load missions" };
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
