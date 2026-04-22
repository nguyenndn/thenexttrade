import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { detectBroker } from "@/lib/ea/broker-detection";

/**
 * POST /api/sync/heartbeat
 * TNT Connect app sends periodic heartbeats for all connected accounts.
 * Auth: X-Sync-Key header
 */
export async function POST(request: NextRequest) {
    try {
        const syncApiKey = request.headers.get("X-Sync-Key");
        if (!syncApiKey) {
            return NextResponse.json({ error: "Missing sync API key" }, { status: 401 });
        }

        const user = await prisma.user.findUnique({
            where: { syncApiKey },
            select: {
                id: true,
                tradingAccounts: {
                    select: { id: true, accountNumber: true },
                },
            },
        });

        if (!user) {
            return NextResponse.json({ error: "Invalid sync API key" }, { status: 401 });
        }

        const body = await request.json();
        const { accounts }: {
            accounts: Array<{
                accountNumber: string;
                connected: boolean;
                balance?: number;
                equity?: number;
                broker?: string;
                server?: string;
                currency?: string;
                leverage?: string;
            }>;
        } = body;

        if (!Array.isArray(accounts)) {
            return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
        }

        // Build account map
        const accountMap = new Map(
            user.tradingAccounts
                .filter(a => a.accountNumber)
                .map(a => [a.accountNumber!, a])
        );

        const updated: string[] = [];

        for (const acct of accounts) {
            const dbAccount = accountMap.get(String(acct.accountNumber));
            if (!dbAccount) continue;

            const updateData: Record<string, any> = {
                appLastHeartbeat: new Date(),
                status: acct.connected ? "CONNECTED" : "DISCONNECTED",
            };

            // Update balance/equity if provided
            if (acct.balance !== undefined) updateData.balance = parseFloat(String(acct.balance));
            if (acct.equity !== undefined) updateData.equity = parseFloat(String(acct.equity));

            // Auto-detect broker
            if (acct.server) {
                const detectedBroker = detectBroker(acct.server, acct.broker || "");
                if (detectedBroker) updateData.broker = detectedBroker;
                updateData.server = acct.server;
            }
            if (acct.currency) updateData.currency = acct.currency;
            if (acct.leverage) updateData.leverage = String(acct.leverage);

            await prisma.tradingAccount.update({
                where: { id: dbAccount.id },
                data: updateData,
            });

            updated.push(acct.accountNumber);
        }

        return NextResponse.json({
            success: true,
            updated,
            serverTime: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Sync heartbeat error:", error);
        return NextResponse.json({ error: "Heartbeat failed" }, { status: 500 });
    }
}
