import { NextRequest, NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { getBridgeStateForAccount } from "@/lib/mt5-bridge/client.server";
import type { CloudAccountSummary } from "@/lib/mt5-bridge/types";

export const dynamic = "force-dynamic";

// Cache verified accountId -> userId ownership so lite polling ticks skip redundant Prisma findMany/profile queries
const verifiedOwnerCache = new Map<string, string>();

export async function GET(request: NextRequest) {
    try {
        const user = await getAuthUser();
        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const { searchParams } = new URL(request.url);
        const requestedAccountId = searchParams.get("accountId");
        const symbol = searchParams.get("symbol") || undefined;
        const timeframe = parseInt(searchParams.get("timeframe") || "15", 10) || 15;
        const isLite = searchParams.get("lite") === "1";

        if (
            isLite &&
            requestedAccountId &&
            verifiedOwnerCache.get(requestedAccountId) === user.id
        ) {
            const stateRes = await getBridgeStateForAccount({
                accountId: requestedAccountId,
                symbol,
                timeframe,
            });

            return NextResponse.json({
                success: true,
                lite: true,
                activeAccountId: requestedAccountId,
                state: stateRes.ok ? stateRes.state : null,
                bridgeError: stateRes.ok ? null : stateRes.error,
            });
        }

        const [accounts, profile] = await Promise.all([
            prisma.tradingAccount.findMany({
                where: {
                    userId: user.id,
                    accountNumber: { not: null },
                },
                include: {
                    credential: { select: { keyVersion: true } },
                    proEntitlement: {
                        select: { status: true, expiresAt: true },
                    },
                },
                orderBy: [{ lastHeartbeat: "desc" }, { createdAt: "desc" }],
            }),
            prisma.profile.findUnique({
                where: { userId: user.id },
                select: { telegramId: true, mainTradingAccountId: true },
            }),
        ]);

        const mainAccountId = profile?.mainTradingAccountId || null;

        const cloudAccounts: CloudAccountSummary[] = accounts.map((acc) => {
            verifiedOwnerCache.set(acc.id, user.id);
            const isUnderIb =
                acc.ibAttribution === "VERIFIED" ||
                acc.ibAttribution === "CONFIRMED" ||
                acc.proEntitlement?.status === "ACTIVE";
            const defaultExpiry = new Date(
                acc.createdAt.getTime() + 30 * 24 * 60 * 60 * 1000
            ).toISOString();

            return {
                id: acc.id,
                name: acc.name,
                accountNumber: acc.accountNumber || "",
                broker: acc.broker || "MT5 Broker",
                server: acc.server || "",
                balance: acc.balance || 0,
                equity: acc.equity ?? acc.balance ?? 0,
                currency: acc.currency || "USD",
                status: acc.status,
                isUnderIb,
                accessExpiresAt:
                    acc.proEntitlement?.expiresAt?.toISOString() ||
                    defaultExpiry,
                lastHeartbeat: acc.lastHeartbeat?.toISOString() || null,
                hasStoredCredential: Boolean(acc.credential),
                isMain: acc.id === mainAccountId,
            };
        });

        const activeAcc =
            cloudAccounts.find((a) => a.id === requestedAccountId) ||
            cloudAccounts.find((a) => a.id === mainAccountId) ||
            cloudAccounts.find((a) => a.hasStoredCredential) ||
            cloudAccounts[0] ||
            null;

        if (!activeAcc) {
            return NextResponse.json({
                success: true,
                accounts: [],
                activeAccountId: null,
                state: null,
                telegramId: profile?.telegramId || "",
            });
        }

        const stateRes = await getBridgeStateForAccount({
            accountId: activeAcc.id,
            symbol,
            timeframe,
        });

        return NextResponse.json({
            success: true,
            accounts: cloudAccounts,
            activeAccountId: activeAcc.id,
            state: stateRes.ok ? stateRes.state : null,
            bridgeError: stateRes.ok ? null : stateRes.error,
            telegramId: profile?.telegramId || "",
        });
    } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : "State error";
        return NextResponse.json({ error: msg }, { status: 500 });
    }
}
