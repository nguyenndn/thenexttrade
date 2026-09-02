import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { detectBroker } from "@/lib/ea/broker-detection";
import { resolveSyncAuth } from "@/lib/sync-auth";
import { parseBrokerNumber } from "@/lib/utils";
import { isVipEligibleBroker, normalizeUsdBalance } from "@/lib/pro-access";

/**
 * Maps a GMT hour offset from the EA to the most appropriate IANA timezone.
 * Covers all common MT4/MT5 broker server timezones.
 */
function mapGmtOffsetToTimezone(offsetHours: number): string {
    const map: Record<number, string> = {
        [-5]: "America/New_York", // US Eastern (some US brokers)
        [-4]: "America/New_York", // US Eastern (DST)
        [-3]: "America/Sao_Paulo", // Brazil
        0: "Etc/UTC", // Exness, some FXCM
        1: "Europe/London", // UK (BST / DST)
        2: "Europe/Athens", // EET - common MT5 server timezone in winter
        3: "Europe/Athens", // EEST - common MT5 server timezone in summer/DST
    };
    return (
        map[offsetHours] ||
        `Etc/GMT${offsetHours <= 0 ? "+" : "-"}${Math.abs(offsetHours)}`
    );
}

// ============================================================================
// HANDLER
// ============================================================================

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const {
            eaVersion,
            accountNumber,
            balance,
            equity,
            accountTradeMode, // ACCOUNT_TRADE_MODE (0=DEMO, 1=CONTEST, 2=REAL)
            // EA auto-collected info
            broker, // ACCOUNT_COMPANY
            server, // ACCOUNT_SERVER
            currency, // ACCOUNT_CURRENCY
            leverage, // ACCOUNT_LEVERAGE
            gmtOffset, // GMT offset in seconds (TimeCurrent - TimeGMT)
            isSyncing, // Background sync state
        } = body;

        // Unified auth — supports both user sync key and legacy account key
        const auth = await resolveSyncAuth({
            request,
            accountNumber: accountNumber ? String(accountNumber) : null,
            requireAccount: false, // we handle account resolution/creation below
        });

        if (!auth.success) {
            return NextResponse.json(
                { error: auth.error },
                { status: auth.status }
            );
        }

        const { user, account: resolvedAccount, authMode } = auth.data;

        // ========================================
        // RESOLVE ACCOUNT
        // ========================================
        if (!accountNumber) {
            return NextResponse.json(
                { error: "Missing accountNumber from EA payload" },
                { status: 400 }
            );
        }

        let account = resolvedAccount;

        // For user-level key: if account not found by accountNumber, try to find or auto-create
        if (!account && authMode === "USER_SYNC_KEY") {
            // Try to find by userId + accountNumber
            const existing = await prisma.tradingAccount.findFirst({
                where: {
                    userId: user.id,
                    accountNumber: String(accountNumber),
                },
                select: {
                    id: true,
                    userId: true,
                    accountNumber: true,
                    platform: true,
                    autoSync: true,
                    syncOpenTrades: true,
                },
            });

            if (existing) {
                account = existing;
            }
            // If still not found, the heartbeat will be rejected
        }

        if (!account) {
            return NextResponse.json(
                {
                    error: "Account not found",
                    message: `No trading account with number #${accountNumber} found for this user.`,
                },
                { status: 404 }
            );
        }

        // Legacy mode: strict account number validation (lock-in)
        if (authMode === "LEGACY_ACCOUNT_KEY" && account.accountNumber) {
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

        // Only auto-set the timezone on first connect — the heuristic offset
        // map is crude and flips across DST, so it must not overwrite a
        // user-set or previously stored value on every beat.
        let hasStoredTimezone: string | null = null;
        const currentAccount = await prisma.tradingAccount.findUnique({
            where: { id: account.id },
            select: {
                timezone: true,
                fundingVerifiedAt: true,
                fundingGraceUntil: true,
                broker: true,
            },
        });
        hasStoredTimezone = currentAccount?.timezone ?? null;

        // Locale-tolerant numeric parsing (US "1,234.56" or EU "1.234,56",
        // never NaN).
        const safeBalance = parseBrokerNumber(balance) ?? undefined;
        const safeEquity = parseBrokerNumber(equity) ?? undefined;

        // Anti-bypass: Convert Cent/USC balances to standard USD equivalent ($300 threshold)
        const effectiveUsdBalance =
            safeBalance !== undefined
                ? normalizeUsdBalance(safeBalance, currency, server)
                : undefined;

        // Funding initial verification ($300 on REAL account from partner broker)
        const resolvedBroker = detectedBroker || broker || currentAccount?.broker || "";
        const isEligibleBroker = isVipEligibleBroker(resolvedBroker);
        const isRealAccount =
            accountTradeMode === "REAL" ||
            accountTradeMode === 2 ||
            accountTradeMode === "2" ||
            accountTradeMode === "ACCOUNT_TRADE_MODE_REAL" ||
            (!accountTradeMode &&
                !String(server || "").toLowerCase().includes("demo") &&
                !String(server || "").toLowerCase().includes("contest") &&
                !String(broker || "").toLowerCase().includes("demo"));

        let fundingUpdate: Record<string, unknown> = {};

        if (isRealAccount && isEligibleBroker && effectiveUsdBalance !== undefined && effectiveUsdBalance >= 300) {
            if (!currentAccount?.fundingVerifiedAt) {
                fundingUpdate = {
                    fundingVerifiedAt: new Date(),
                    fundingAmount: effectiveUsdBalance,
                    fundingLastVerifiedAt: new Date(),
                    fundingGraceUntil: null,
                };
                await prisma.proEntitlement.upsert({
                    where: { tradingAccountId: account.id },
                    create: {
                        userId: user.id,
                        tradingAccountId: account.id,
                        broker: resolvedBroker,
                        status: "ACTIVE",
                        source: "IB_VERIFIED",
                        startsAt: new Date(),
                    },
                    update: {
                        status: "ACTIVE",
                        source: "IB_VERIFIED",
                        startsAt: new Date(),
                    },
                });
            } else if (currentAccount?.fundingGraceUntil) {
                fundingUpdate = {
                    fundingGraceUntil: null,
                    fundingLastVerifiedAt: new Date(),
                };
            }
        }

        // Update heartbeat, status, and EA-collected info
        await prisma.tradingAccount.update({
            where: { id: account.id },
            data: {
                lastHeartbeat: new Date(),
                status: isSyncing ? "SYNCING" : "CONNECTED",
                eaVersion,

                // Auto-collected from EA
                // accountNumber: Lock on first connect, ignore updates if set
                accountNumber: account.accountNumber || String(accountNumber),

                // Update stats if provided
                ...(safeBalance !== undefined && Number.isFinite(safeBalance)
                    ? { balance: safeBalance }
                    : {}),
                ...(safeEquity !== undefined && Number.isFinite(safeEquity)
                    ? { equity: safeEquity }
                    : {}),

                // Auto-collect info (Spec 1.1)
                ...(broker ? { broker: detectedBroker || broker } : {}),
                ...(server ? { server } : {}),
                ...(currency ? { currency } : {}),
                ...(leverage ? { leverage: String(leverage) } : {}),

                // Auto-detect timezone from EA — only when none is stored yet
                ...(detectedTimezone && !hasStoredTimezone
                    ? { timezone: detectedTimezone }
                    : {}),

                // Funding status updates
                ...fundingUpdate,
            },
        });

        return NextResponse.json({
            success: true,
            autoSync: account.autoSync,
            serverTime: new Date().toISOString(),
        });
    } catch (error) {
        console.error("EA heartbeat error:", error);
        return NextResponse.json(
            { error: "Heartbeat failed" },
            { status: 500 }
        );
    }
}
