import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeSyncApiKey } from "@/lib/utils/api-key";
import { detectBroker } from "@/lib/ea/broker-detection";
import { parseBrokerNumber } from "@/lib/utils";
import { recordEaProductTelemetry } from "@/lib/ea/telemetry.server";
import { AccountStatus } from "@prisma/client";
import {
    isDemoTradingAccount,
    isNonLiveTradingPayload,
} from "@/lib/trading-account-classification";
import { normalizeBrokerKey } from "@/lib/pro-access";

interface VerifyLicensePayload {
    licenseKey?: string | null;
    apiKey?: string | null;
    accountNumber?: string | number | null;
    broker?: string | null;
    server?: string | null;
    accountTradeMode?: string | number | null;
    platform?: string | null;
    balance?: string | number | null;
    equity?: string | number | null;
    currency?: string | null;
    productSlug?: string | null;
    eaName?: string | null;
    eaVersion?: string | null;
}

async function handleVerifyLicense(
    request: NextRequest,
    payload: VerifyLicensePayload
) {
    const rawAccount =
        payload.accountNumber !== undefined && payload.accountNumber !== null
            ? String(payload.accountNumber).trim()
            : "";

    if (!rawAccount || rawAccount === "0") {
        return NextResponse.json(
            {
                success: false,
                valid: false,
                state: "UNKNOWN",
                code: "MISSING_ACCOUNT_NUMBER",
                message: "Missing MT5/MT4 accountNumber in request.",
            },
            { status: 400 }
        );
    }

    const headerKey =
        request.headers.get("X-License-Key") ||
        request.headers.get("X-API-Key") ||
        request.headers.get("X-Sync-Key");
    const rawKey = headerKey || payload.licenseKey || payload.apiKey || null;
    const normalizedKey = normalizeSyncApiKey(rawKey);

    const isDemo = isNonLiveTradingPayload({
        accountTradeMode: payload.accountTradeMode,
        server: payload.server,
        broker: payload.broker,
    });
    const resolvedAccountType = isDemo ? "DEMO" : "REAL";
    const detectedBroker = detectBroker(
        payload.server || "",
        payload.broker || ""
    );
    const requestedBrokerKey = normalizeBrokerKey(
        detectedBroker || payload.broker
    );
    const safeBalance = parseBrokerNumber(payload.balance) ?? undefined;
    const safeEquity = parseBrokerNumber(payload.equity) ?? undefined;

    // 1. Look up EALicense rows for this accountNumber. Licenses are unique
    // per (broker, accountNumber), so the broker must match too — the same
    // login at another broker is a different account.
    const allEaLicenses = await prisma.eALicense.findMany({
        where: { accountNumber: rawAccount },
        orderBy: { updatedAt: "desc" },
    });
    const eaLicenses = requestedBrokerKey
        ? allEaLicenses.filter(
              (lic) =>
                  normalizeBrokerKey(lic.broker) === requestedBrokerKey
          )
        : allEaLicenses;

    const now = new Date();
    const approvedEaLicense = eaLicenses.find(
        (lic) =>
            lic.status === AccountStatus.APPROVED &&
            (!lic.expiryDate || lic.expiryDate >= now)
    );
    const explicitlyRevokedLicense = eaLicenses.find(
        (lic) =>
            lic.status === AccountStatus.REJECTED ||
            lic.status === AccountStatus.SUSPENDED ||
            lic.status === AccountStatus.EXPIRED ||
            (lic.status === AccountStatus.APPROVED &&
                lic.expiryDate &&
                lic.expiryDate < now)
    );

    // 2. If a License Key was provided, resolve the key owner & enforce 1-Account-1-License
    if (normalizedKey) {
        const accountByKey = await prisma.tradingAccount.findUnique({
            where: { apiKey: normalizedKey },
            select: {
                id: true,
                userId: true,
                accountNumber: true,
                broker: true,
                server: true,
                accountType: true,
                platform: true,
                ibAttribution: true,
                proEntitlement: {
                    select: {
                        status: true,
                        expiresAt: true,
                    },
                },
            },
        });

        if (accountByKey) {
            const accountBrokerKey = normalizeBrokerKey(
                accountByKey.broker || detectedBroker || payload.broker
            );
            // The account key itself identifies the broker, so search the
            // unfiltered license list and compare against the account broker.
            const approvedAccountLicense = allEaLicenses.find(
                (lic) =>
                    lic.userId === accountByKey.userId &&
                    normalizeBrokerKey(lic.broker) === accountBrokerKey &&
                    lic.status === AccountStatus.APPROVED &&
                    (!lic.expiryDate || lic.expiryDate >= now)
            );
            const revokedAccountLicense = allEaLicenses.find(
                (lic) =>
                    lic.userId === accountByKey.userId &&
                    normalizeBrokerKey(lic.broker) === accountBrokerKey &&
                    (lic.status === AccountStatus.REJECTED ||
                        lic.status === AccountStatus.SUSPENDED ||
                        lic.status === AccountStatus.EXPIRED ||
                        (lic.status === AccountStatus.APPROVED &&
                            lic.expiryDate &&
                            lic.expiryDate < now))
            );

            // STRICT 1-TO-1 ACCOUNT BINDING ON REAL ACCOUNTS:
            // A License Key issued for Account A cannot be used on Real Account B
            if (
                !isDemo &&
                accountByKey.accountNumber &&
                accountByKey.accountNumber.trim() !== rawAccount
            ) {
                return NextResponse.json(
                    {
                        success: false,
                        valid: false,
                        state: "REVOKED",
                        code: "ACCOUNT_MISMATCH",
                        expectedAccount: accountByKey.accountNumber,
                        actualAccount: rawAccount,
                        message: `This License Key belongs exclusively to trading account #${accountByKey.accountNumber} and cannot be used on #${rawAccount}. Please register account #${rawAccount} under our IB on Trading Systems to receive its own License Key.`,
                    },
                    { status: 403 }
                );
            }

            if (isDemo) {
                return NextResponse.json({
                    success: true,
                    valid: true,
                    state: "VALID",
                    code: "DEMO_AUTHORIZED",
                    accountNumber: rawAccount,
                    expiryDate: "2099-12-31",
                    message: "Demo account authorized.",
                });
            }

            // Check if explicitly revoked/rejected in EALicense
            if (revokedAccountLicense && !approvedAccountLicense) {
                return NextResponse.json(
                    {
                        success: false,
                        valid: false,
                        state: "REVOKED",
                        code: "LICENSE_REVOKED",
                        accountNumber: rawAccount,
                        message: `License for account #${rawAccount} is ${revokedAccountLicense.status.toLowerCase()}.`,
                    },
                    { status: 403 }
                );
            }

            const hasActivePro =
                accountByKey.proEntitlement &&
                (accountByKey.proEntitlement.status === "ACTIVE" ||
                    accountByKey.proEntitlement.status === "GRACE") &&
                (!accountByKey.proEntitlement.expiresAt ||
                    accountByKey.proEntitlement.expiresAt >= now);

            const isIbApproved =
                Boolean(approvedAccountLicense) ||
                accountByKey.ibAttribution === "VERIFIED" ||
                accountByKey.ibAttribution === "CONFIRMED" ||
                Boolean(hasActivePro);

            if (!isIbApproved) {
                return NextResponse.json(
                    {
                        success: false,
                        valid: false,
                        state: "REVOKED",
                        code: "ACCOUNT_NOT_APPROVED_UNDER_IB",
                        accountNumber: rawAccount,
                        message: `Trading account #${rawAccount} is pending IB verification. Please wait for Admin approval on Trading Systems.`,
                    },
                    { status: 403 }
                );
            }

            const storedIsNonLive = isDemoTradingAccount(accountByKey);

            // Update live capital & telemetry non-blockingly
            await prisma.tradingAccount
                .update({
                    where: { id: accountByKey.id },
                    data: {
                        lastHeartbeat: now,
                        status: "CONNECTED",
                        accountNumber:
                            accountByKey.accountNumber || rawAccount,
                        ...(safeBalance !== undefined &&
                        Number.isFinite(safeBalance)
                            ? { balance: safeBalance }
                            : {}),
                        ...(safeEquity !== undefined &&
                        Number.isFinite(safeEquity)
                            ? { equity: safeEquity }
                            : {}),
                        ...(!accountByKey.broker &&
                        (detectedBroker || payload.broker)
                            ? { broker: detectedBroker || payload.broker }
                            : {}),
                        ...(!accountByKey.server && payload.server
                            ? { server: payload.server }
                            : {}),
                        ...(payload.currency
                            ? { currency: payload.currency }
                            : {}),
                        ...(!storedIsNonLive
                            ? { accountType: resolvedAccountType }
                            : {}),
                    },
                })
                .catch(() => {});

            await recordEaProductTelemetry({
                userId: accountByKey.userId,
                tradingAccountId: accountByKey.id,
                accountNumber: rawAccount,
                eventType: "HEARTBEAT",
                productSlug: payload.productSlug || null,
                eaName: payload.eaName || null,
                eaVersion: payload.eaVersion || null,
                balance: safeBalance,
                equity: safeEquity,
                currency: payload.currency || null,
                broker:
                    accountByKey.broker ||
                    detectedBroker ||
                    payload.broker ||
                    null,
                server: accountByKey.server || payload.server || null,
                platform: payload.platform || accountByKey.platform || "MT5",
                accountType: resolvedAccountType,
                syncSource: "EA_LICENSE_VERIFY",
            });

            const expiryYmd = approvedAccountLicense?.expiryDate
                ? approvedAccountLicense.expiryDate.toISOString().slice(0, 10)
                : "2099-12-31";

            return NextResponse.json({
                success: true,
                valid: true,
                state: "VALID",
                code: "LICENSE_VALID",
                accountNumber: rawAccount,
                expiryDate: expiryYmd,
                message: `Account #${rawAccount} license verified (Lifetime IB Access).`,
            });
        }

        // Fallback: Check if user entered their User.syncApiKey
        const userBySyncKey = await prisma.user.findUnique({
            where: { syncApiKey: normalizedKey },
            select: { id: true },
        });

        if (userBySyncKey) {
            if (isDemo) {
                return NextResponse.json({
                    success: true,
                    valid: true,
                    state: "VALID",
                    code: "DEMO_AUTHORIZED",
                    accountNumber: rawAccount,
                    expiryDate: "2099-12-31",
                });
            }

            // Even with User.syncApiKey, this SPECIFIC Real accountNumber MUST be IB-approved!
            const matchingCandidates = await prisma.tradingAccount.findMany({
                where: {
                    userId: userBySyncKey.id,
                    accountNumber: rawAccount,
                },
                select: {
                    id: true,
                    broker: true,
                    platform: true,
                    ibAttribution: true,
                    proEntitlement: {
                        select: { status: true, expiresAt: true },
                    },
                },
                take: 25,
            });
            const brokerScopedCandidates = requestedBrokerKey
                ? matchingCandidates.filter(
                      (candidate) =>
                          normalizeBrokerKey(candidate.broker) ===
                          requestedBrokerKey
                  )
                : matchingCandidates;

            if (brokerScopedCandidates.length > 1) {
                return NextResponse.json(
                    {
                        success: false,
                        valid: false,
                        state: "REVOKED",
                        code: "ACCOUNT_AMBIGUOUS",
                        accountNumber: rawAccount,
                        message: `Account #${rawAccount} has duplicate records at broker ${detectedBroker || payload.broker}. Contact support to resolve the duplicate.`,
                    },
                    { status: 409 }
                );
            }

            const matchingAccount =
                brokerScopedCandidates[0] ||
                (matchingCandidates.length === 1 &&
                !normalizeBrokerKey(matchingCandidates[0].broker)
                    ? matchingCandidates[0]
                    : null);

            const userApprovedLicense = eaLicenses.find(
                (lic) =>
                    lic.userId === userBySyncKey.id &&
                    normalizeBrokerKey(lic.broker) ===
                        normalizeBrokerKey(
                            matchingAccount?.broker ||
                                detectedBroker ||
                                payload.broker
                        ) &&
                    lic.status === AccountStatus.APPROVED &&
                    (!lic.expiryDate || lic.expiryDate >= now)
            );

            const hasActivePro =
                matchingAccount?.proEntitlement &&
                (matchingAccount.proEntitlement.status === "ACTIVE" ||
                    matchingAccount.proEntitlement.status === "GRACE") &&
                (!matchingAccount.proEntitlement.expiresAt ||
                    matchingAccount.proEntitlement.expiresAt >= now);

            const isSpecificAccountApproved =
                Boolean(userApprovedLicense) ||
                matchingAccount?.ibAttribution === "VERIFIED" ||
                matchingAccount?.ibAttribution === "CONFIRMED" ||
                Boolean(hasActivePro);

            if (!isSpecificAccountApproved) {
                return NextResponse.json(
                    {
                        success: false,
                        valid: false,
                        state: "REVOKED",
                        code: "ACCOUNT_NOT_LICENSED_UNDER_IB",
                        accountNumber: rawAccount,
                        message: `Account #${rawAccount} is not licensed under our IB network. Each trading account requires its own IB verification and License Key.`,
                    },
                    { status: 403 }
                );
            }

            return NextResponse.json({
                success: true,
                valid: true,
                state: "VALID",
                code: "LICENSE_VALID",
                accountNumber: rawAccount,
                expiryDate: userApprovedLicense?.expiryDate
                    ? userApprovedLicense.expiryDate.toISOString().slice(0, 10)
                    : "2099-12-31",
            });
        }

        // Key is completely invalid
        return NextResponse.json(
            {
                success: false,
                valid: false,
                state: "REVOKED",
                code: "INVALID_LICENSE_KEY",
                accountNumber: rawAccount,
                message:
                    "Invalid License Key. Please copy the exact License Key for your MT5 account from Trading Systems.",
            },
            { status: 403 }
        );
    }

    // 3. No License Key provided (Legacy account-number-only validation)
    if (isDemo) {
        return NextResponse.json({
            success: true,
            valid: true,
            state: "VALID",
            code: "DEMO_AUTHORIZED",
            accountNumber: rawAccount,
            expiryDate: "2099-12-31",
        });
    }

    if (approvedEaLicense) {
        const licenseBrokerKey = normalizeBrokerKey(approvedEaLicense.broker);
        const linkedCandidates = await prisma.tradingAccount.findMany({
            where: {
                userId: approvedEaLicense.userId,
                accountNumber: rawAccount,
            },
            select: { id: true, broker: true, platform: true },
            take: 25,
        });
        const linkedMatches = licenseBrokerKey
            ? linkedCandidates.filter(
                  (candidate) =>
                      normalizeBrokerKey(candidate.broker) === licenseBrokerKey
              )
            : linkedCandidates;
        // Telemetry only — resolve the single account for this license.
        const linkedAccount =
            linkedMatches[0] ||
            (linkedCandidates.length === 1 &&
            !normalizeBrokerKey(linkedCandidates[0].broker)
                ? linkedCandidates[0]
                : null);

        if (linkedAccount) {
            await recordEaProductTelemetry({
                userId: approvedEaLicense.userId,
                tradingAccountId: linkedAccount.id,
                accountNumber: rawAccount,
                eventType: "HEARTBEAT",
                productSlug: payload.productSlug || null,
                eaName: payload.eaName || null,
                eaVersion: payload.eaVersion || null,
                balance: safeBalance,
                equity: safeEquity,
                currency: payload.currency || null,
                broker:
                    detectedBroker ||
                    payload.broker ||
                    approvedEaLicense.broker ||
                    null,
                server: payload.server || null,
                platform: payload.platform || linkedAccount.platform || "MT5",
                accountType: resolvedAccountType,
                syncSource: "EA_LICENSE_VERIFY",
            });
        }

        return NextResponse.json({
            success: true,
            valid: true,
            state: "VALID",
            code: "LICENSE_VALID",
            accountNumber: rawAccount,
            expiryDate: approvedEaLicense.expiryDate
                ? approvedEaLicense.expiryDate.toISOString().slice(0, 10)
                : "2099-12-31",
        });
    }

    // Check if account is IB-verified in TradingAccount / ProEntitlement
    const verifiedCandidates = await prisma.tradingAccount.findMany({
        where: {
            accountNumber: rawAccount,
            OR: [
                { ibAttribution: { in: ["VERIFIED", "CONFIRMED"] } },
                {
                    proEntitlement: {
                        is: {
                            status: { in: ["ACTIVE", "GRACE"] },
                        },
                    },
                },
            ],
        },
        select: {
            id: true,
            userId: true,
            broker: true,
            platform: true,
        },
        take: 25,
    });
    const verifiedScoped = requestedBrokerKey
        ? verifiedCandidates.filter(
              (candidate) =>
                  normalizeBrokerKey(candidate.broker) === requestedBrokerKey
          )
        : verifiedCandidates;

    if (verifiedScoped.length > 1) {
        return NextResponse.json(
            {
                success: false,
                valid: false,
                state: "REVOKED",
                code: "ACCOUNT_AMBIGUOUS",
                accountNumber: rawAccount,
                message: `Account #${rawAccount} has duplicate records at broker ${detectedBroker || payload.broker}. Contact support to resolve the duplicate.`,
            },
            { status: 409 }
        );
    }

    const verifiedTradingAccount =
        verifiedScoped[0] ||
        (verifiedCandidates.length === 1 &&
        !normalizeBrokerKey(verifiedCandidates[0].broker)
            ? verifiedCandidates[0]
            : null);

    if (verifiedTradingAccount && !explicitlyRevokedLicense) {
        await recordEaProductTelemetry({
            userId: verifiedTradingAccount.userId,
            tradingAccountId: verifiedTradingAccount.id,
            accountNumber: rawAccount,
            eventType: "HEARTBEAT",
            productSlug: payload.productSlug || null,
            eaName: payload.eaName || null,
            eaVersion: payload.eaVersion || null,
            balance: safeBalance,
            equity: safeEquity,
            currency: payload.currency || null,
            broker:
                detectedBroker ||
                payload.broker ||
                verifiedTradingAccount.broker ||
                null,
            server: payload.server || null,
            platform:
                payload.platform || verifiedTradingAccount.platform || "MT5",
            accountType: resolvedAccountType,
            syncSource: "EA_LICENSE_VERIFY",
        });

        return NextResponse.json({
            success: true,
            valid: true,
            state: "VALID",
            code: "LICENSE_VALID",
            accountNumber: rawAccount,
            expiryDate: "2099-12-31",
        });
    }

    return NextResponse.json(
        {
            success: false,
            valid: false,
            state: "REVOKED",
            code: "ACCOUNT_NOT_AUTHORIZED",
            accountNumber: rawAccount,
            message: `Account #${rawAccount} is not authorized. Please register your trading account under our IB on Trading Systems.`,
        },
        { status: 403 }
    );
}

export async function POST(request: NextRequest) {
    try {
        const body = (await request.json()) as VerifyLicensePayload;
        return await handleVerifyLicense(request, body);
    } catch (error) {
        console.error("POST /api/ea/license/verify error:", error);
        return NextResponse.json(
            {
                success: false,
                valid: false,
                state: "UNKNOWN",
                error: "License verification error",
            },
            { status: 500 }
        );
    }
}

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const payload: VerifyLicensePayload = {
            licenseKey: searchParams.get("licenseKey") || searchParams.get("apiKey"),
            accountNumber:
                searchParams.get("accountNumber") ||
                searchParams.get("account"),
            broker: searchParams.get("broker"),
            server: searchParams.get("server"),
            accountTradeMode: searchParams.get("accountTradeMode"),
            platform: searchParams.get("platform"),
            productSlug: searchParams.get("productSlug"),
            eaName: searchParams.get("eaName"),
            eaVersion: searchParams.get("eaVersion"),
        };
        return await handleVerifyLicense(request, payload);
    } catch (error) {
        console.error("GET /api/ea/license/verify error:", error);
        return NextResponse.json(
            {
                success: false,
                valid: false,
                state: "UNKNOWN",
                error: "License verification error",
            },
            { status: 500 }
        );
    }
}
