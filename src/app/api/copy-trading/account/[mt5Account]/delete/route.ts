import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { deleteRegistration } from "@/lib/pvsr-client";
import { CopyTradingStatus } from "@prisma/client";

/**
 * DELETE /api/copy-trading/account/[mt5Account]/delete
 * Delete a PENDING/REJECTED/DISCONNECTED registration
 */
export async function DELETE(
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

        // Verify user owns this MT5 + is deletable status
        const registration = await prisma.copyTradingRegistration.findFirst({
            where: {
                userId: user.id,
                mt5AccountNumber: mt5Account,
                status: {
                    in: [
                        CopyTradingStatus.PENDING,
                        CopyTradingStatus.REJECTED,
                        CopyTradingStatus.DISCONNECTED,
                    ],
                },
            },
        });

        if (!registration) {
            return NextResponse.json(
                { error: "No deletable registration found. Active accounts must be disconnected first." },
                { status: 404 }
            );
        }

        // Notify PVSR for PENDING/REJECTED (PVSR does not accept DELETE for DISCONNECTED)
        if (registration.status === CopyTradingStatus.PENDING || registration.status === CopyTradingStatus.REJECTED) {
            const result = await deleteRegistration(mt5Account);
            if (!result.success) {
                // 409 = race condition (admin changed status concurrently)
                console.warn("[Copy Trading] PVSR delete failed (continuing local delete):", result.message);
            }
        }

        // Delete local record
        await prisma.copyTradingRegistration.delete({
            where: { id: registration.id },
        });

        return NextResponse.json({
            success: true,
            message: "Registration deleted successfully",
        });
    } catch (error) {
        console.error("[Copy Trading] Delete Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
