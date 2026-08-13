import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { detectBroker } from "@/lib/ea/broker-detection";
import { parseBrokerNumber } from "@/lib/utils";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({
    uniqueTokenPerInterval: 500,
    interval: 60000,
});

/**
 * Parse a numeric value from a Trade Manager payload, tolerating locale
 * formatting (US "1,234.56" or EU "1.234,56") and rejecting null/empty/NaN
 * instead of corrupting the column.
 */
function parseNumeric(val: unknown): number | undefined {
    const n = parseBrokerNumber(val);
    return n === null ? undefined : n;
}

/**
 * POST /api/sync/heartbeat
 * Trade Manager app sends periodic heartbeats for all connected accounts.
 * Auth: X-Sync-Key header
 */
export async function POST(request: NextRequest) {
    try {
        const syncApiKey =
            request.headers.get("X-Sync-Key") ||
            request.headers.get("X-API-Key");
        if (!syncApiKey) {
            return NextResponse.json(
                { error: "Missing sync API key" },
                { status: 401 }
            );
        }

        // Rate limit by key (consistent with the other sync routes)
        try {
            await limiter.check(120, syncApiKey);
        } catch {
            return NextResponse.json(
                { error: "Rate limit exceeded" },
                { status: 429 }
            );
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
            return NextResponse.json(
                { error: "Invalid sync API key" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const {
            accounts,
        }: {
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
            return NextResponse.json(
                { error: "Invalid payload" },
                { status: 400 }
            );
        }

        // Build account map
        const accountMap = new Map(
            user.tradingAccounts
                .filter((a) => a.accountNumber)
                .map((a) => [a.accountNumber!, a])
        );

        const updated: string[] = [];

        for (const acct of accounts) {
            const dbAccount = accountMap.get(String(acct.accountNumber));
            if (!dbAccount) continue;

            const updateData: Record<string, any> = {
                appLastHeartbeat: new Date(),
                lastHeartbeat: new Date(),
                status: acct.connected ? "CONNECTED" : "DISCONNECTED",
            };

            // Update balance/equity if provided (locale-tolerant, no NaN)
            const balance = parseNumeric(acct.balance);
            const equity = parseNumeric(acct.equity);
            if (balance !== undefined) updateData.balance = balance;
            if (equity !== undefined) updateData.equity = equity;

            // Auto-detect broker
            if (acct.server) {
                const detectedBroker = detectBroker(
                    acct.server,
                    acct.broker || ""
                );
                if (detectedBroker) updateData.broker = detectedBroker;
                updateData.server = acct.server;
            }
            if (acct.currency) updateData.currency = acct.currency;
            if (acct.leverage) updateData.leverage = String(acct.leverage);

            await prisma.tradingAccount.update({
                where: { id: dbAccount.id },
                data: updateData,
            });

            if (balance !== undefined) {
                try {
                    const { captureCapitalSnapshot } = await import(
                        "@/lib/admin/ib/capital.server"
                    );
                    await captureCapitalSnapshot({
                        tradingAccountId: dbAccount.id,
                        balance,
                        equity: equity ?? null,
                        currency: acct.currency || "USD",
                        source: "HEARTBEAT",
                    });
                } catch (e) {
                    // Non-blocking snapshot error
                }
            }

            updated.push(acct.accountNumber);
        }

        return NextResponse.json({
            success: true,
            updated,
            serverTime: new Date().toISOString(),
        });
    } catch (error) {
        console.error("Sync heartbeat error:", error);
        return NextResponse.json(
            { error: "Heartbeat failed" },
            { status: 500 }
        );
    }
}
