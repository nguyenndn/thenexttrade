import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import {
    MILESTONES,
    getUncelebratedMilestones,
    markMilestonesCelebrated,
    type MilestoneId,
} from "@/lib/milestones/milestones.server";

const VALID_MILESTONE_IDS = new Set<string>(MILESTONES.map((m) => m.id));

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
    const rawIds: unknown = body?.milestoneIds;

    if (
        !Array.isArray(rawIds) ||
        rawIds.length === 0 ||
        rawIds.length > MILESTONES.length ||
        !rawIds.every(
            (id): id is MilestoneId =>
                typeof id === "string" && VALID_MILESTONE_IDS.has(id)
        )
    ) {
        return NextResponse.json(
            { error: "milestoneIds must be a non-empty array of valid milestone IDs" },
            { status: 400 }
        );
    }

    await markMilestonesCelebrated(user.id, rawIds);
    return NextResponse.json({ success: true });
}
