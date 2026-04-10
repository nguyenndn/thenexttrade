import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { getAccountDetail } from "@/lib/pvsr-client";
import { CopyTradingStatus } from "@prisma/client";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const registrations = await prisma.copyTradingRegistration.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            select: {
                id: true,
                fullName: true,
                email: true,
                telegramHandle: true,
                brokerName: true,
                customBrokerName: true,
                mt5Server: true,
                customServer: true,
                mt5AccountNumber: true,
                tradingCapital: true,
                status: true,
                rejectReason: true,
                disconnectedAt: true,
                disconnectReason: true,
                createdAt: true,
            },
        });

        // Sync PENDING accounts with PVSR to detect status changes
        const updatedRegistrations = await Promise.all(
            registrations.map(async (reg) => {
                if (reg.status !== CopyTradingStatus.PENDING) return reg;

                try {
                    const pvsrData = await getAccountDetail(reg.mt5AccountNumber);
                    if (!pvsrData) return reg;

                    const pvsrStatus = pvsrData.status as keyof typeof CopyTradingStatus;

                    // If PVSR status changed from PENDING → update local DB
                    if (pvsrStatus !== "PENDING" && pvsrStatus in CopyTradingStatus) {
                        await prisma.copyTradingRegistration.update({
                            where: { id: reg.id },
                            data: { status: CopyTradingStatus[pvsrStatus] },
                        });
                        return { ...reg, status: pvsrStatus };
                    }
                } catch (err) {
                    console.warn(`[Sync] Failed to check PVSR for ${reg.mt5AccountNumber}:`, err);
                }
                return reg;
            })
        );

        return NextResponse.json({ registrations: updatedRegistrations });
    } catch (error) {
        console.error("My Registrations Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
