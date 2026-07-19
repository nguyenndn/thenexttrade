import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveExecutionPlan } from "@/lib/ai-gateway/execution-resolver";

export async function GET() {
    try {
        // Basic DB check
        await prisma.$queryRaw`SELECT 1`;

        const plan = await resolveExecutionPlan();
        const candidates = plan.steps.filter((s) => s.kind === "candidate");
        const skipped = plan.steps.filter((s) => s.kind === "skipped");
        const isProviderReady = Boolean(plan.policy && candidates.length > 0);

        return NextResponse.json({
            status: isProviderReady ? "online" : "degraded",
            database: "online",
            provider: isProviderReady ? "online" : "offline",
            routing: {
                policy_configured: Boolean(plan.policy),
                routable_models: candidates.length,
                skipped_models: skipped.map((item) => ({
                    code: item.diagnostic.errorCode,
                    reason: item.diagnostic.reason,
                })),
            },
            timestamp: new Date().toISOString(),
        });
    } catch {
        return NextResponse.json(
            {
                status: "degraded",
                database: "offline",
                provider: "unknown",
                timestamp: new Date().toISOString(),
            },
            { status: 503 }
        );
    }
}
