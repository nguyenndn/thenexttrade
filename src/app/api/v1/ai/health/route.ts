import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveExecutionPlan } from "@/lib/ai-gateway/execution-resolver";
import { requireAdmin } from "@/lib/api-auth";

async function isAdminCaller(): Promise<boolean> {
    try {
        const auth = await requireAdmin();
        return !(auth instanceof NextResponse);
    } catch {
        return false;
    }
}

export async function GET() {
    const isAdmin = await isAdminCaller();

    try {
        // Basic DB check
        await prisma.$queryRaw`SELECT 1`;

        const plan = await resolveExecutionPlan();
        const candidates = plan.steps.filter((s) => s.kind === "candidate");
        const skipped = plan.steps.filter((s) => s.kind === "skipped");
        const isProviderReady = Boolean(plan.policy && candidates.length > 0);

        if (!isAdmin) {
            return NextResponse.json({
                status: isProviderReady ? "ok" : "degraded",
            });
        }

        return NextResponse.json({
            status: isProviderReady ? "ok" : "degraded",
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
        if (!isAdmin) {
            return NextResponse.json(
                { status: "degraded" },
                { status: 503 }
            );
        }

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
