import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { getUserTradingDataState } from "@/lib/trading-data-state";

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

    const tradingDataState = await getUserTradingDataState(user.id);

    return NextResponse.json({ hasTradeData: tradingDataState.hasTradeData });
}

