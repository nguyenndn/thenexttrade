import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { CopyTradingStatus } from "@prisma/client";

const PVSR_API_URL = process.env.PVSR_API_URL || "";
const PVSR_API_KEY = process.env.PVSR_API_KEY || "";

/**
 * POST /api/copy-trading/reconnect
 * Re-register a DISCONNECTED account by reusing existing data.
 * - Resets local status to PENDING
 * - Calls POST /clients on PVSR to re-register
 */
export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { mt5AccountNumber } = await request.json();

        if (!mt5AccountNumber?.trim()) {
            return NextResponse.json({ error: "MT5 account number is required" }, { status: 400 });
        }

        // Find the DISCONNECTED registration owned by this user
        const registration = await prisma.copyTradingRegistration.findFirst({
            where: {
                userId: user.id,
                mt5AccountNumber: mt5AccountNumber.trim(),
                status: CopyTradingStatus.DISCONNECTED,
            },
        });

        if (!registration) {
            return NextResponse.json({ error: "No disconnected account found for this MT5 number" }, { status: 404 });
        }

        // Resolve broker/server for PVSR payload
        const isCustomBroker = registration.brokerName === "Any Broker";
        const resolvedBroker = isCustomBroker ? (registration.customBrokerName || registration.brokerName) : registration.brokerName;
        const resolvedServer = registration.customServer || registration.mt5Server || "";

        // Call PVSR to re-register
        if (PVSR_API_URL && PVSR_API_KEY) {
            const pvsrResponse = await fetch(`${PVSR_API_URL}/clients`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-api-key": PVSR_API_KEY,
                },
                body: JSON.stringify({
                    clientName: registration.fullName,
                    email: registration.email,
                    phone: registration.phone || "",
                    telegram: registration.telegramHandle || "",
                    mt5Account: registration.mt5AccountNumber,
                    mt5Server: resolvedServer,
                    broker: resolvedBroker,
                }),
                signal: AbortSignal.timeout(10_000),
            });

            const pvsrData = await pvsrResponse.json();

            if (!pvsrResponse.ok && pvsrResponse.status !== 409) {
                console.error("[Reconnect] PVSR re-register failed:", pvsrData);
                return NextResponse.json(
                    { error: pvsrData.error || "Failed to re-register with PVSR" },
                    { status: 502 }
                );
            }

            console.log(`[Reconnect] ✅ PVSR re-register: ${pvsrResponse.status}`, pvsrData);
        }

        // Reset local record to PENDING
        await prisma.copyTradingRegistration.update({
            where: { id: registration.id },
            data: {
                status: CopyTradingStatus.PENDING,
                disconnectedAt: null,
                disconnectReason: null,
                reviewedBy: null,
                reviewedAt: null,
                rejectReason: null,
            },
        });

        return NextResponse.json({ success: true, message: "Reconnection request sent. Awaiting PVSR approval." });
    } catch (error) {
        console.error("[Reconnect] Error:", error);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
