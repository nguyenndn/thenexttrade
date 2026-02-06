import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { detectBroker } from "@/lib/ea/broker-detection";

export async function POST(request: NextRequest) {
    try {
        const apiKey = request.headers.get("X-API-Key");
        if (!apiKey) {
            return NextResponse.json({ error: "Missing API key" }, { status: 401 });
        }

        const body = await request.json();
        const {
            eaVersion,
            accountNumber,
            balance,
            equity,
            // EA auto-collected info
            broker,      // ACCOUNT_COMPANY
            server,      // ACCOUNT_SERVER  
            currency,    // ACCOUNT_CURRENCY
            leverage,    // ACCOUNT_LEVERAGE
        } = body;

        const account = await prisma.tradingAccount.findUnique({
            where: { apiKey },
        });

        if (!account) {
            return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
        }

        // ========================================
        // ACCOUNT NUMBER VALIDATION (Spec 1.1)
        // ========================================
        // Strict Lock: If accountNumber is already set, it MUST match.
        // If not set (first connect), we allow it and save it below.
        if (account.accountNumber && accountNumber) {
            if (account.accountNumber !== String(accountNumber)) {
                return NextResponse.json(
                    {
                        error: "Account mismatch",
                        message: `This API key is linked to account #${account.accountNumber}, but EA is running on #${accountNumber}. Please use correct API key.`,
                        expectedAccount: account.accountNumber,
                        actualAccount: String(accountNumber),
                    },
                    { status: 403 }
                );
            }
        }

        // Auto-detect broker
        const detectedBroker = detectBroker(server || "", broker || "");

        // Update heartbeat, status, and EA-collected info
        await prisma.tradingAccount.update({
            where: { id: account.id },
            data: {
                lastHeartbeat: new Date(),
                status: "CONNECTED",
                eaVersion,

                // Auto-collected from EA
                // accountNumber: Lock on first connect, ignore updates if set
                accountNumber: account.accountNumber || String(accountNumber),

                // Update stats if provided
                ...(balance !== undefined ? { balance: parseFloat(balance) } : {}),
                ...(equity !== undefined ? { equity: parseFloat(equity) } : {}),

                // Auto-collect info (Spec 1.1)
                ...(broker ? { broker: detectedBroker || broker } : {}),
                ...(server ? { server } : {}),
                ...(currency ? { currency } : {}),
                ...(leverage ? { leverage: String(leverage) } : {}),
            },
        });

        return NextResponse.json({
            success: true,
            autoSync: account.autoSync,
            serverTime: new Date().toISOString(),
        });
    } catch (error) {
        console.error("EA heartbeat error:", error);
        return NextResponse.json({ error: "Heartbeat failed" }, { status: 500 });
    }
}
