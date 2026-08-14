import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/api-auth";
import { runJournalAutopilotSweep } from "@/lib/journal/autopilot.server";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/journal-autopilot
 * Fills the empty trading-psychology fields (entryReason, exitReason,
 * notesPsychology, mistakes, emotionBefore/After, followedPlan) of EA-synced
 * CLOSED trades from the last 7 days using the AI Gateway — once per trade,
 * only for users who enabled "AI Journal Autopilot" in settings and hold Pro.
 *
 * Schedule: once per day (platform-agnostic HTTP scheduler, same auth as the
 * other /api/cron routes).
 *
 * Security: protected by CRON_SECRET bearer token. Does not dispatch emails.
 */
export async function GET(request: Request) {
    const cronAuth = requireCronSecret(request);
    if (cronAuth instanceof NextResponse) return cronAuth;

    try {
        const summary = await runJournalAutopilotSweep();
        return NextResponse.json({ ok: true, ...summary });
    } catch (error) {
        console.error("[Cron] Journal autopilot sweep failed:", error);
        return NextResponse.json(
            { error: "Journal autopilot sweep failed" },
            { status: 500 }
        );
    }
}
