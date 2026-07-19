import { NextResponse, NextRequest } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import {
    getOnboardingState,
    updateOnboardingSettings,
    completeOnboarding,
    skipOnboarding,
} from "@/lib/onboarding/onboarding.server";

export const dynamic = "force-dynamic";

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

    const body = await request.json();
    const { action, ...patch } = body;

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
        default:
            return NextResponse.json(
                { error: "Invalid action" },
                { status: 400 }
            );
    }

    return NextResponse.json({ success: true });
}
