import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { EDGE_MISSIONS } from "@/config/edge-missions";
import { getMissionPeriodKey } from "@/lib/services/edge-missions.service";

/**
 * GET /api/missions/claimable-count
 * Returns the count of missions that are completed but not yet claimed.
 * Lightweight endpoint for badge notifications.
 */
export async function GET() {
  const user = await getAuthUser();
  if (!user) return NextResponse.json({ count: 0 }, { status: 401 });

  // Build period keys for all missions
  const periodKeys = [...new Set(EDGE_MISSIONS.map(getMissionPeriodKey))];

  const claimableCount = await prisma.userMissionProgress.count({
    where: {
      userId: user.id,
      periodKey: { in: periodKeys },
      completedAt: { not: null },
      claimed: false,
    },
  });

  return NextResponse.json({ count: claimableCount });
}
