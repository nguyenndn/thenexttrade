import { NextRequest, NextResponse } from "next/server";
import { requireCronSecret } from "@/lib/api-auth";
import { processLicenseGitHubSyncJobs } from "@/lib/ea/license-github-sync-outbox.server";
import { recordCronRun } from "@/lib/cron/cron-health.server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const cronStartedAt = new Date();
    const cronAuth = requireCronSecret(request);
    if (cronAuth instanceof NextResponse) return cronAuth;

    try {
        const summary = await processLicenseGitHubSyncJobs(20);
        await recordCronRun("license-github-sync", cronStartedAt, "SUCCESS");
        return NextResponse.json({ success: true, ...summary });
    } catch (error) {
        console.error("Cron License GitHub Sync Error:", error);
        await recordCronRun("license-github-sync", cronStartedAt, "FAILED", error);
        return NextResponse.json(
            { success: false, error: "License GitHub sync failed" },
            { status: 500 }
        );
    }
}
