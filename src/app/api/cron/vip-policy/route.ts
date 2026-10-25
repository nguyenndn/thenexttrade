import { NextRequest, NextResponse } from "next/server";
import { runVipPolicyReconciliation } from "@/lib/services/vip-policy.service";
import { requireCronSecret } from "@/lib/api-auth";
import { recordCronRun } from "@/lib/cron/cron-health.server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    const cronStartedAt = new Date();
    try {
        const cronAuth = requireCronSecret(request);
        if (cronAuth instanceof NextResponse) {
            return cronAuth;
        }

        const result = await runVipPolicyReconciliation();
        await recordCronRun("vip-policy", cronStartedAt, "SUCCESS");

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            result,
        });
    } catch (error) {
        console.error("VIP Policy cron error:", error);
        await recordCronRun("vip-policy", cronStartedAt, "FAILED", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
