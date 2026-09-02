import { NextRequest, NextResponse } from "next/server";
import { runVipPolicyReconciliation } from "@/lib/services/vip-policy.service";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
    try {
        // Authenticate cron caller (Vercel Cron header or Bearer CRON_SECRET)
        const authHeader = request.headers.get("authorization");
        const cronSecret = process.env.CRON_SECRET;

        if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
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
