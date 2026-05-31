import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

/**
 * Lightweight API to check if the current user has any trade data.
 * Used by DashboardProvider to power sidebar visual hints for new users.
 * Returns { hasTradeData: boolean }
 */
export async function GET() {
    const user = await getAuthUser();
    if (!user) {
        return NextResponse.json({ hasTradeData: false }, { status: 401 });
    }

    const count = await prisma.journalEntry.count({
        where: { userId: user.id },
        take: 1,
    });

    return NextResponse.json({ hasTradeData: count > 0 });
}
