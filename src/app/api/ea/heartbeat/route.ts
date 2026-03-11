import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { detectBroker } from "@/lib/ea/broker-detection";

/**
 * Maps a GMT hour offset from the EA to the most appropriate IANA timezone.
 * Covers all common MT4/MT5 broker server timezones.
 */
function mapGmtOffsetToTimezone(offsetHours: number): string {
    const map: Record<number, string> = {
        [-5]: "America/New_York",   // US Eastern (some US brokers)
        [-4]: "America/New_York",   // US Eastern (DST)
        [-3]: "America/Sao_Paulo",  // Brazil
        0: "Etc/UTC",               // Exness, some FXCM
        1: "Europe/London",         // UK (BST / DST)
        2: "Europe/Athens",         // EET - Vantage, IC Markets, FTMO (Winter)
        3: "Europe/Athens",         // EEST - Vantage, IC Markets, FTMO (Summer / DST)
    };
    return map[offsetHours] || `Etc/GMT${offsetHours <= 0 ? '+' : '-'}${Math.abs(offsetHours)}`;
}

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
            gmtOffset,   // GMT offset in seconds (TimeCurrent - TimeGMT)
        } = body;

        const account = await prisma.tradingAccount.findUnique({
            where: { apiKey },
        });

        if (!account) {
            return NextResponse.json({ error: "Invalid API key" }, { status: 401 });
        }

        // ========================================
        // STRICT ACCOUNT NUMBER VALIDATION
        // ========================================
        if (!accountNumber) {
            return NextResponse.json({ error: "Missing accountNumber from EA payload" }, { status: 400 });
        }

        // Strict Lock: If accountNumber is already set, it MUST match.
        // If not set (first connect), we allow it and save it below.
        if (account.accountNumber) {
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

        // Auto-detect timezone from GMT offset (seconds -> IANA timezone)
        let detectedTimezone: string | undefined;
        if (gmtOffset !== undefined && gmtOffset !== null) {
            const offsetHours = Math.round(Number(gmtOffset) / 3600);
            detectedTimezone = mapGmtOffsetToTimezone(offsetHours);
        }

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

                // Auto-detect timezone from EA
                ...(detectedTimezone ? { timezone: detectedTimezone } : {}),
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
