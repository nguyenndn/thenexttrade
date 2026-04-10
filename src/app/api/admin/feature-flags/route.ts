import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/admin/feature-flags
 * Returns all feature flags from SystemSetting
 */
export async function GET() {
    const settings = await prisma.systemSetting.findMany({
        where: { key: { startsWith: "feature_" } },
    });

    const flags: Record<string, boolean> = {};
    for (const s of settings) {
        flags[s.key] = (s.value as { enabled: boolean })?.enabled ?? false;
    }

    return NextResponse.json({ flags });
}

/**
 * POST /api/admin/feature-flags
 * Toggle a feature flag { key: "feature_x", enabled: true/false }
 */
export async function POST(request: Request) {
    const { key, enabled } = await request.json();

    if (!key?.startsWith("feature_")) {
        return NextResponse.json({ error: "Invalid feature key" }, { status: 400 });
    }

    await prisma.systemSetting.upsert({
        where: { key },
        create: { key, value: { enabled } },
        update: { value: { enabled } },
    });

    return NextResponse.json({ success: true, key, enabled });
}
