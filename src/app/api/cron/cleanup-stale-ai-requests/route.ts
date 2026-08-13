import { NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/api-auth";
import { sweepStaleAiRequests } from "@/lib/ai-gateway/quota-service";

export const dynamic = "force-dynamic";

/**
 * GET /api/cron/cleanup-stale-ai-requests
 * Frees daily AI quota slots orphaned as ROUTING / CALLING_PROVIDER when a
 * request is reserved but the process crashes/restarts before the gateway
 * finalizes it (see quota-service.ts STALE_REQUEST_THRESHOLD_MS). Marks them
 * FAILED/STALE_ORPHANED_REQUEST, which the quota filter does not count, so the
 * affected user's remaining_today recovers without waiting for the UTC day
 * rollover.
 *
 * Schedule: every 15 minutes (platform-agnostic HTTP scheduler, same auth as the
 * other /api/cron routes). The per-user lazy self-heal in reserveAiRequest covers
 * users who keep making requests; this job covers everyone else.
 *
 * Security: protected by CRON_SECRET bearer token.
 */
export async function GET(request: Request) {
    const cronAuth = requireCronSecret(request);
    if (cronAuth instanceof NextResponse) return cronAuth;

    try {
        const cleared = await sweepStaleAiRequests();
        return NextResponse.json({ ok: true, cleared });
    } catch (error) {
        console.error("[Cron] Stale AI request cleanup failed:", error);
        return NextResponse.json(
            { error: "Stale AI request cleanup failed" },
            { status: 500 }
        );
    }
}
