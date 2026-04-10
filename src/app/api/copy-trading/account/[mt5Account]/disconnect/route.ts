import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { disconnectAccount } from "@/lib/pvsr-client";
import { CopyTradingStatus } from "@prisma/client";

/**
 * POST /api/copy-trading/account/[mt5Account]/disconnect
 * Disconnect an APPROVED copy trading account
 */
export async function POST(
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

        // Verify user owns this MT5 + is APPROVED
        const registration = await prisma.copyTradingRegistration.findFirst({
            where: {
                userId: user.id,
                mt5AccountNumber: mt5Account,
                status: CopyTradingStatus.APPROVED,
            },
        });

        if (!registration) {
            return NextResponse.json(
                { error: "No active account found to disconnect" },
                { status: 404 }
            );
        }

        // Parse optional reason from body
        let reason = "User requested disconnect";
        try {
            const body = await request.json();
            if (body.reason) reason = body.reason;
        } catch {
            // No body is fine
        }

        // Call PVSR disconnect API
        const result = await disconnectAccount(mt5Account, reason);

        if (!result.success) {
            return NextResponse.json(
                { error: result.message || "Failed to disconnect at PVSR" },
                { status: 502 }
            );
        }

        // Update local DB
        await prisma.copyTradingRegistration.update({
            where: { id: registration.id },
            data: {
                status: CopyTradingStatus.DISCONNECTED,
                disconnectedAt: new Date(),
                disconnectReason: reason,
            },
        });

        return NextResponse.json({
            success: true,
            message: "Account disconnected successfully",
        });
    } catch (error) {
        console.error("[Copy Trading] Disconnect Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
