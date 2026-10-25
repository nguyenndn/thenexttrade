import { NextRequest, NextResponse } from "next/server";
import { syncEconomicEvents } from "@/lib/services/economic-calendar";
import { requireCronSecret } from "@/lib/api-auth";
import { recordCronRun } from "@/lib/cron/cron-health.server";

export const dynamic = "force-dynamic"; // Prevent caching

export async function GET(request: NextRequest) {
    const cronStartedAt = new Date();
    const cronAuth = requireCronSecret(request);
    if (cronAuth instanceof NextResponse) return cronAuth;

    try {
        const result = await syncEconomicEvents();
        await recordCronRun("sync-events", cronStartedAt, "SUCCESS");
        return NextResponse.json(result);
    } catch (error) {
        console.error("Sync API Error:", error);
        await recordCronRun("sync-events", cronStartedAt, "FAILED", error);
        return NextResponse.json(
            { success: false, error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
