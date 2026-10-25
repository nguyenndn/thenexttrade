import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { detectBroker } from "@/lib/ea/broker-detection";
import { resolveSyncAuth } from "@/lib/sync-auth";
import { parseBrokerNumber } from "@/lib/utils";
import {
    isVipEligibleBrokerInDatabase,
    normalizeBrokerKey,
    normalizeUsdBalance,
} from "@/lib/pro-access";
import { recordEaProductTelemetry } from "@/lib/ea/telemetry.server";
import {
    isDemoTradingAccount,
    isLiveTradingPayload,
} from "@/lib/trading-account-classification";
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
            productSlug,
            eaName,
            platform,
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

        const detectedBroker = detectBroker(server || "", broker || "");

        // Unified auth — supports both user sync key and legacy account key
        const auth = await resolveSyncAuth({
            request,
            accountNumber: accountNumber ? String(accountNumber) : null,
            broker: detectedBroker || broker || null,
            requireAccount: false, // resolved below; EA traffic never creates accounts
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

        const isRealAccount = isLiveTradingPayload({
            accountTradeMode,
            server,
            broker,
        });

        const resolvedAccountType = isRealAccount ? "REAL" : "DEMO";
        const safeBalance = parseBrokerNumber(balance) ?? undefined;
        const safeEquity = parseBrokerNumber(equity) ?? undefined;

        // resolveSyncAuth already resolved the broker-scoped account for a
        // user-level key. EA traffic must never create accounts, so an
        // unresolved login is a hard 404 below.
        const account = resolvedAccount;

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
                server: true,
                accountType: true,
                ibAttribution: true,
            },
        });
        hasStoredTimezone = currentAccount?.timezone ?? null;
        const storedIsNonLive = currentAccount
            ? isDemoTradingAccount(currentAccount)
            : false;

        // Anti-bypass: Convert Cent/USC balances to standard USD equivalent.
        const effectiveUsdBalance =
            safeBalance !== undefined
                ? normalizeUsdBalance(safeBalance, currency, server)
                : undefined;

        // Funding verification is a trusted-flow decision. A client heartbeat
        // alone must never grant Pro because balance/account type are supplied
        // by the EA and can be tampered with.
        // A stored broker is the trusted value. Client payload may fill in a
        // missing broker, but it must never override one already on the account.
        const resolvedBroker =
            currentAccount?.broker || detectedBroker || broker || "";
        const isEligibleBroker = await isVipEligibleBrokerInDatabase(
            resolvedBroker
        );
        const isRealBusinessAccount = isRealAccount && !storedIsNonLive;

        const hasVerifiedIbAttribution = ["VERIFIED", "CONFIRMED"].includes(
            String(currentAccount?.ibAttribution || "").toUpperCase()
        );
        let hasApprovedLicense = false;
        if (
            !hasVerifiedIbAttribution &&
            typeof prisma.eALicense?.findFirst === "function"
        ) {
            const license = await prisma.eALicense.findFirst({
                where: {
                    userId: user.id,
                    accountNumber: String(accountNumber).trim(),
                    status: "APPROVED",
                    OR: [
                        { expiryDate: null },
                        { expiryDate: { gt: new Date() } },
                    ],
                },
                select: { id: true, broker: true },
            });
            const resolvedBrokerKey = normalizeBrokerKey(resolvedBroker);
            hasApprovedLicense =
                !!license &&
                !!resolvedBrokerKey &&
                normalizeBrokerKey(license.broker) === resolvedBrokerKey;
        }
        const isTrustedAccount = hasVerifiedIbAttribution || hasApprovedLicense;

        let fundingUpdate: Record<string, unknown> = {};

        if (
            isTrustedAccount &&
            isRealBusinessAccount &&
            isEligibleBroker &&
            effectiveUsdBalance !== undefined &&
            effectiveUsdBalance >= 200
        ) {
            if (currentAccount?.fundingVerifiedAt) {
                fundingUpdate = {
                    fundingLastVerifiedAt: new Date(),
                    ...(currentAccount.fundingGraceUntil ? { fundingGraceUntil: null } : {}),
                };
            } else {
                fundingUpdate = {
                    fundingVerifiedAt: new Date(),
                    fundingAmount: effectiveUsdBalance,
                    fundingLastVerifiedAt: new Date(),
                    fundingGraceUntil: null,
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
                // Lock the broker after first connect. Admin can still correct
                // it in the database; heartbeat payload cannot change it.
                ...(!currentAccount?.broker && (detectedBroker || broker)
                    ? { broker: detectedBroker || broker }
                    : {}),
                ...(!currentAccount?.server && server ? { server } : {}),
                ...(currency ? { currency } : {}),
                ...(leverage ? { leverage: String(leverage) } : {}),
                ...(accountTradeMode !== undefined || server || broker
                    ? {
                          accountType:
                              storedIsNonLive && isRealAccount
                                  ? currentAccount?.accountType || "DEMO"
                                  : resolvedAccountType,
                      }
                    : {}),

                // Auto-detect timezone from EA — only when none is stored yet
                ...(detectedTimezone && !hasStoredTimezone
                    ? { timezone: detectedTimezone }
                    : {}),

                // Funding status updates
                ...fundingUpdate,
            },
        });

        // Record EA product telemetry & capital snapshot (non-blocking)
        await recordEaProductTelemetry({
            userId: user.id,
            tradingAccountId: account.id,
            accountNumber: String(accountNumber),
            eventType: "HEARTBEAT",
            productSlug: productSlug || null,
            eaName: eaName || null,
            eaVersion: eaVersion || null,
            balance: safeBalance,
            equity: safeEquity,
            currency: currency || null,
            broker: resolvedBroker || null,
            server: currentAccount?.server || server || null,
            platform: platform || account.platform || "MT5",
            accountType: resolvedAccountType,
            syncSource: "EA_HEARTBEAT",
        });

        const balanceEligible =
            isTrustedAccount &&
            isRealBusinessAccount &&
            isEligibleBroker &&
            effectiveUsdBalance !== undefined &&
            effectiveUsdBalance >= 200;

        return NextResponse.json({
            success: true,
            autoSync: account.autoSync,
            serverTime: new Date().toISOString(),
            balanceEligible,
            vipEligible: balanceEligible,
            minBalanceRequired: 200,
        });
    } catch (error) {
        console.error("EA heartbeat error:", error);
        return NextResponse.json(
            { error: "Heartbeat failed" },
            { status: 500 }
        );
    }
}
