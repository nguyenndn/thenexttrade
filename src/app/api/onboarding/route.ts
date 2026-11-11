import { NextResponse, NextRequest } from "next/server";
import { z } from "zod";
import { getAuthUser } from "@/lib/auth-cache";
import {
    getOnboardingState,
    updateOnboardingSettings,
    completeOnboarding,
    skipOnboarding,
} from "@/lib/onboarding/onboarding.server";

export const dynamic = "force-dynamic";

const OnboardingPostSchema = z
    .object({
        action: z.enum(["step", "complete", "skip"]),
        lastCompletedStep: z.number().int().min(1).max(4).optional(),
        tradingGoal: z.string().trim().min(1).max(100).optional(),
        preferredSyncMethod: z.enum(["EA_SYNC", "MANUAL"]).optional(),
        completedAt: z.string().datetime().optional(),
        skippedAt: z.string().datetime().optional(),
    })
    .strict();

/**
 * GET /api/onboarding
 * Returns the current onboarding state.
 */
export async function GET() {
    const user = await getAuthUser();
    if (!user)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const state = await getOnboardingState(user.id);
    return NextResponse.json(state);
}

/**
 * POST /api/onboarding
 * Updates onboarding state.
 * Body: { action: "step" | "complete" | "skip", ...patch }
 */
export async function POST(request: NextRequest) {
    const user = await getAuthUser();
    if (!user)
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let rawBody: unknown;
    try {
        rawBody = await request.json();
    } catch {
        return NextResponse.json(
            { error: "Invalid JSON body" },
            { status: 400 }
        );
    }

    const parsed = OnboardingPostSchema.safeParse(rawBody);
    if (!parsed.success) {
        return NextResponse.json(
            {
                error: "Invalid onboarding payload",
                details: parsed.error.flatten(),
            },
            { status: 400 }
        );
    }

    const { action, ...patch } = parsed.data;

    switch (action) {
        case "step":
            await updateOnboardingSettings(user.id, patch);
            break;
        case "complete":
            await completeOnboarding(user.id);
            break;
        case "skip":
            await skipOnboarding(user.id);
            break;
    }

    return NextResponse.json({ success: true });
}
