import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NotificationType, NotificationPriority } from "@prisma/client";

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body = await request.json();

        const {
            fullName,
            email,
            telegramHandle,
            tradingCapital,
            brokerName,
            customBrokerName,
            mt5Server,
            customServer,
            mt5AccountNumber,
            masterPassword,
            message,
        } = body;

        // Validate required fields
        if (!fullName?.trim() || !email?.trim() || !brokerName?.trim() || !mt5AccountNumber?.trim()) {
            return NextResponse.json({ error: "Missing required fields: fullName, email, brokerName, mt5AccountNumber" }, { status: 400 });
        }

        const isCustomBroker = brokerName === "Any Broker";
        if (isCustomBroker && !customBrokerName?.trim()) {
            return NextResponse.json({ error: "Custom broker name is required when 'Any Broker' is selected" }, { status: 400 });
        }
        if (!isCustomBroker && !mt5Server?.trim()) {
            return NextResponse.json({ error: "MT5 server is required" }, { status: 400 });
        }

        // Check for duplicate registration
        const existing = await prisma.copyTradingRegistration.findUnique({
            where: { mt5AccountNumber_brokerName: { mt5AccountNumber, brokerName: isCustomBroker ? customBrokerName : brokerName } },
        });

        if (existing) {
            return NextResponse.json({ error: "This MT5 account is already registered for copy trading" }, { status: 409 });
        }

        const resolvedBroker = isCustomBroker ? customBrokerName!.trim() : brokerName;
        const resolvedServer = isCustomBroker ? customServer?.trim() || "" : mt5Server;

        // Create registration
        const registration = await prisma.copyTradingRegistration.create({
            data: {
                userId: user.id,
                fullName: fullName.trim(),
                email: email.trim(),
                telegramHandle: telegramHandle?.trim() || null,
                tradingCapital: parseFloat(tradingCapital) || 0,
                brokerName: isCustomBroker ? "Any Broker" : brokerName,
                customBrokerName: isCustomBroker ? customBrokerName.trim() : null,
                mt5Server: isCustomBroker ? null : mt5Server,
                customServer: isCustomBroker ? customServer?.trim() || null : null,
                mt5AccountNumber: mt5AccountNumber.trim(),
                masterPassword: masterPassword || null, // TODO: encrypt
                message: message?.trim() || null,
            },
        });

        // Notify all admins
        const admins = await prisma.profile.findMany({
            where: { role: "ADMIN" },
            select: { userId: true },
        });

        if (admins.length > 0) {
            await prisma.notification.createMany({
                data: admins.map((admin) => ({
                    userId: admin.userId,
                    type: NotificationType.COPY_TRADING_REGISTERED,
                    title: "New Copy Trading Registration",
                    message: `${fullName} (${isCustomBroker ? customBrokerName : brokerName}) — $${parseFloat(tradingCapital || 0).toLocaleString()}`,
                    priority: NotificationPriority.HIGH,
                    link: "/admin/copy-trading",
                })),
            });
        }

        // Forward to PVSR Capital (fire-and-forget — don't block user)
        syncToPVSR({
            clientName: fullName.trim(),
            email: email.trim(),
            phone: "",
            telegram: telegramHandle?.trim() || "",
            mt5Account: mt5AccountNumber.trim(),
            mt5Server: resolvedServer,
            broker: resolvedBroker,
        }).catch((err) => {
            console.error("[PVSR Sync] Failed to forward registration:", err);
        });

        return NextResponse.json({ success: true, id: registration.id }, { status: 201 });
    } catch (error: any) {
        console.error("Copy Trading Register Error:", error);

        // Handle Prisma unique constraint error
        if (error.code === "P2002") {
            return NextResponse.json({ error: "This MT5 account is already registered" }, { status: 409 });
        }

        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}

// ============================================================================
// PVSR CAPITAL SYNC — Forward registration to PVSR API
// ============================================================================

interface PVSRRegistrationPayload {
    clientName: string;
    email: string;
    phone: string;
    telegram: string;
    mt5Account: string;
    mt5Server: string;
    broker: string;
}

async function syncToPVSR(payload: PVSRRegistrationPayload): Promise<void> {
    const apiUrl = process.env.PVSR_API_URL;
    const apiKey = process.env.PVSR_API_KEY;

    if (!apiUrl || !apiKey) {
        console.warn("[PVSR Sync] PVSR_API_URL or PVSR_API_KEY not configured — skipping sync");
        return;
    }

    const response = await fetch(`${apiUrl}/clients`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": apiKey,
        },
        body: JSON.stringify(payload),
        signal: AbortSignal.timeout(10_000), // 10s timeout
    });

    const data = await response.json();

    if (response.ok) {
        console.log(`[PVSR Sync] ✅ Registration forwarded successfully — ID: ${data.registrationId}`);
    } else if (response.status === 409) {
        console.log(`[PVSR Sync] ⚠️ Account already exists on PVSR — ${payload.mt5Account}`);
    } else {
        console.error(`[PVSR Sync] ❌ Failed (${response.status}):`, data.error);
    }
}
