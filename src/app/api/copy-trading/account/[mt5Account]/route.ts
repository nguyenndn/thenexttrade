import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getAccountDetail } from "@/lib/pvsr-client";

export const dynamic = "force-dynamic";

/**
 * GET /api/copy-trading/account/[mt5Account]
 * Proxy to PVSR Account Detail API — returns status + accountInfo + performance
 */
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ mt5Account: string }> }
) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { mt5Account } = await params;

        // Verify user owns this MT5 account
        const registration = await prisma.copyTradingRegistration.findFirst({
            where: {
                userId: user.id,
                mt5AccountNumber: mt5Account,
            },
            select: {
                id: true,
                status: true,
                brokerName: true,
                mt5Server: true,
                tradingCapital: true,
            },
        });

        if (!registration) {
            return NextResponse.json({ error: "Account not found" }, { status: 404 });
        }

        // Call PVSR API
        const detail = await getAccountDetail(mt5Account);

        if (!detail) {
            return NextResponse.json({ error: "Failed to fetch account detail" }, { status: 502 });
        }

        // Merge local registration data with PVSR response
        return NextResponse.json({
            ...detail,
            localRegistration: {
                id: registration.id,
                brokerName: registration.brokerName,
                mt5Server: registration.mt5Server,
                tradingCapital: registration.tradingCapital,
            },
        });
    } catch (error) {
        console.error("[Copy Trading] Account Detail Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
