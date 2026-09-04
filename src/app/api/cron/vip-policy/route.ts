import { NextRequest, NextResponse } from "next/server";
import { runVipPolicyReconciliation } from "@/lib/services/vip-policy.service";
import { requireCronSecret } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        const cronAuth = requireCronSecret(request);
        if (cronAuth instanceof NextResponse) {
            return cronAuth;
        }

        const result = await runVipPolicyReconciliation();

        return NextResponse.json({
            success: true,
            timestamp: new Date().toISOString(),
            result,
        });
    } catch (error) {
        console.error("VIP Policy cron error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
