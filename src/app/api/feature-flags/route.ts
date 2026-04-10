import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/feature-flags?keys=feature_funded_challenge,feature_x
 * Public endpoint to check if features are enabled
 */
export async function GET(request: NextRequest) {
    const keys = request.nextUrl.searchParams.get("keys")?.split(",").filter(Boolean) || [];

    if (keys.length === 0) {
        return NextResponse.json({ flags: {} });
    }

    const settings = await prisma.systemSetting.findMany({
        where: { key: { in: keys } },
    });

    const flags: Record<string, boolean> = {};
    for (const key of keys) {
        const setting = settings.find(s => s.key === key);
        flags[key] = (setting?.value as { enabled: boolean })?.enabled ?? false;
    }

    return NextResponse.json({ flags });
}
