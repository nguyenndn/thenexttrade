import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { getUserMissions } from "@/lib/services/edge-missions.service";

/**
 * GET /api/missions/claimable-count
 * Returns the count of missions that are completed but not yet claimed.
 * Returns the same current-period logic used by the missions page so daily and weekly
 * repeatable missions become claimable as soon as the user completes the source event.
 */
export async function GET() {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ count: 0 }, { status: 401 });

    const missions = await getUserMissions(user.id);
    const claimableCount = missions.filter(
        (mission) => mission.completed && !mission.claimed
    ).length;

    return NextResponse.json({ count: claimableCount });
}
