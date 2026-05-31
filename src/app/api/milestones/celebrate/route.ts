import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import {
    getUncelebratedMilestones,
    markMilestonesCelebrated,
    type MilestoneId,
} from "@/lib/milestones/milestones.server";

/**
 * GET /api/milestones/celebrate
 * Returns uncelebrated milestones for the current user.
 */
export async function GET() {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const milestones = await getUncelebratedMilestones(user.id);
    return NextResponse.json(milestones);
}

/**
 * POST /api/milestones/celebrate
 * Marks milestones as celebrated so they won't trigger the modal again.
 * Body: { milestoneIds: MilestoneId[] }
 */
export async function POST(request: Request) {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => null);
    const milestoneIds: MilestoneId[] = body?.milestoneIds;

    if (!Array.isArray(milestoneIds) || milestoneIds.length === 0) {
        return NextResponse.json(
            { error: "milestoneIds must be a non-empty array" },
            { status: 400 }
        );
    }

    await markMilestonesCelebrated(user.id, milestoneIds);
    return NextResponse.json({ success: true });
}
