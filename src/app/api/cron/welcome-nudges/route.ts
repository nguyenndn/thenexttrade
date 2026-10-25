import { NextRequest, NextResponse } from "next/server";
import { processWelcomeNudges } from "@/lib/emails/welcome-nudges.server";
import { requireCronSecret } from "@/lib/api-auth";
import { recordCronRun } from "@/lib/cron/cron-health.server";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/welcome-nudges
 *
 * Cron job that sends D1/D3 in-app welcome notifications
 * to new users who haven't logged any trades yet.
 *
 * Schedule: Every 6 hours
 * Auth: Bearer CRON_SECRET
 */
export async function GET(request: NextRequest) {
    const cronStartedAt = new Date();
    const cronAuth = requireCronSecret(request);
    if (cronAuth instanceof NextResponse) return cronAuth;

    try {
        const result = await processWelcomeNudges();
        await recordCronRun("welcome-nudges", cronStartedAt, "SUCCESS");

        return NextResponse.json({
            success: true,
            ...result,
        });
    } catch (error) {
        console.error("[Cron] Welcome Nudges Error:", error);
        await recordCronRun("welcome-nudges", cronStartedAt, "FAILED", error);
        return new NextResponse("Internal Server Error", { status: 500 });
    }
}
