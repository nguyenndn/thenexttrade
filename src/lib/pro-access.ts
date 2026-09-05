// Pro Access Utility — used by server actions, API routes, and feature gates
// Implements 7-Day Free Trial & Two-Layer Active Trader Retention Policy (v1.4.0)

import { prisma } from "@/lib/prisma";
import type { ProStatus, ProSource } from "@prisma/client";

// ============================================================================
// CONSTANTS (Official Parameters from docs/VIP-MEMBERSHIP-AND-TRIAL-SPEC.md)
// ============================================================================

export const TRIAL_DURATION_DAYS = 7;
export const MIN_MONTHLY_LOTS = 2.0;
export const MIN_30D_LOTS = MIN_MONTHLY_LOTS;
export const INACTIVITY_WARN_DAYS = 7;
export const INACTIVITY_WARNING_DAYS = INACTIVITY_WARN_DAYS;
export const INACTIVITY_PAUSE_DAYS = 14;
export const FUNDING_MIN_BALANCE = 300;
export const FUNDING_RECHECK_DAYS = 30;
export const FUNDING_GRACE_DAYS = 7;
export const VALID_SYNC_SOURCES = ["EA_SYNC", "EA_HISTORY", "SUPPORT_SYNC"];
export const VIP_ELIGIBLE_BROKERS = ["VANTAGE", "EXNESS", "VTMARKETS", "ULTIMAMARKETS"];

export function getTrialDaysRemaining(userCreatedAt: Date, now: Date = new Date()): number {
    const trialDurationMs = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
    const trialEndsAt = new Date(userCreatedAt.getTime() + trialDurationMs);
    if (now >= trialEndsAt) return 0;
    const diffMs = trialEndsAt.getTime() - now.getTime();
    return Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
}

export function isTrialActive(userCreatedAt: Date, now: Date = new Date()): boolean {
    const trialDurationMs = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
    const trialEndsAt = new Date(userCreatedAt.getTime() + trialDurationMs);
    return now < trialEndsAt;
}

/**
 * Calculate trading days elapsed between two dates (excluding Saturday and Sunday).
 * Advances 24 hours at a time from startDate to endDate and counts only weekdays (UTC Mon-Fri).
 * Forex markets close on weekends, so Saturday and Sunday do not contribute to inactivity.
 */
export function countTradingDaysBetween(startDate: Date, endDate: Date = new Date()): number {
    if (startDate >= endDate) return 0;

    let count = 0;
    const current = new Date(startDate.getTime());
    const oneDayMs = 24 * 60 * 60 * 1000;

    while (current.getTime() + oneDayMs <= endDate.getTime()) {
        current.setTime(current.getTime() + oneDayMs);
        const dayOfWeek = current.getUTCDay(); // 0 = Sun, 6 = Sat
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            count++;
        }
    }
    return count;
}

/**
 * Subtract N trading days from a date (skipping Saturdays and Sundays).
 * Useful for deterministic testing and date offset calculations.
 */
export function subtractTradingDays(fromDate: Date, tradingDays: number): Date {
    const current = new Date(fromDate.getTime());
    let remaining = tradingDays;
    const oneDayMs = 24 * 60 * 60 * 1000;

    while (remaining > 0) {
        current.setTime(current.getTime() - oneDayMs);
        const dayOfWeek = current.getUTCDay();
        if (dayOfWeek !== 0 && dayOfWeek !== 6) {
            remaining--;
        }
    }
    return current;
}

// ============================================================================
// TYPES
// ============================================================================

export type PolicyState = "ACTIVE" | "WARNED" | "PAUSED";

export interface TrialInfo {
    isTrial: boolean;
    daysRemaining: number;
    trialEndsAt: Date;
}

export interface ActivityInfo {
    rolling30dLots: number;
    minLotsRequired: number;
    daysSinceLastTrade: number | null;
    lastTradeAt: Date | null;
    policyState: PolicyState;
    reason?: string;
}

export interface FundingInfo {
    verified: boolean;
    verifiedAt: Date | null;
    lastVerifiedAt: Date | null;
    graceUntil: Date | null;
    amount: number | null;
    inGrace: boolean;
    expired: boolean;
}

export interface AccountProStatus {
    tradingAccountId: string;
    accountName: string;
    broker: string | null;
    status: ProStatus;
    isPro: boolean;
    source: ProSource | null;
    expiresAt: Date | null;
    policyState?: PolicyState;
    rolling30dLots?: number;
    daysSinceLastTrade?: number | null;
    fundingVerified?: boolean;
}

export interface ProAccessResult {
    isPro: boolean;
    status: ProStatus | "TRIAL";
    source: ProSource | null;
    expiresAt: Date | null;
    policyState?: PolicyState;
    trialInfo?: TrialInfo | null;
    activityInfo?: ActivityInfo;
    fundingInfo?: FundingInfo;
}

export interface UserProAccessResult extends ProAccessResult {
    activeAccountCount: number;
    accounts: AccountProStatus[];
}

// ============================================================================
// BROKER HELPERS
// ============================================================================

export function normalizeBrokerKey(value: string | null | undefined): string {
    if (!value) return "";
    const cleaned = value.toUpperCase().replace(/[\s\-_]/g, "");
    if (cleaned.startsWith("VANTAGE")) return "VANTAGE";
    if (cleaned.startsWith("EXNESS")) return "EXNESS";
    if (cleaned.startsWith("VTMARKET") || cleaned === "VT" || cleaned.startsWith("VTGLOBAL")) return "VTMARKETS";
    if (cleaned.startsWith("ULTIMA")) return "ULTIMAMARKETS";
    return cleaned;
}

export function isVipEligibleBroker(broker: string | null | undefined): boolean {
    return VIP_ELIGIBLE_BROKERS.includes(normalizeBrokerKey(broker));
}

export function isCentAccount(currency?: string | null, server?: string | null): boolean {
    const cur = String(currency || "").toUpperCase();
    const srv = String(server || "").toLowerCase();
    return cur.includes("CENT") || cur === "USC" || srv.includes("cent");
}

export function normalizeUsdBalance(balance: number, currency?: string | null, server?: string | null): number {
    if (isCentAccount(currency, server)) {
        return balance / 100;
    }
    return balance;
}

// ============================================================================
// ACCOUNT-LEVEL PRO ACCESS — use for account-specific features
// ============================================================================

/**
 * Check Pro access for a specific trading account.
 * Evaluates Entitlement + Activity Policy for this account.
 */
export async function getAccountProAccess(
    userId: string,
    tradingAccountId: string,
    now: Date = new Date()
): Promise<ProAccessResult> {
    // Verify account belongs to user & fetch funding fields
    const account = await prisma.tradingAccount.findFirst({
        where: { id: tradingAccountId, userId },
        select: {
            id: true,
            broker: true,
            balance: true,
            fundingVerifiedAt: true,
            fundingAmount: true,
            fundingLastVerifiedAt: true,
            fundingGraceUntil: true,
        },
    });

    if (!account) {
        return { isPro: false, status: "NONE", source: null, expiresAt: null };
    }

    const entitlement = await prisma.proEntitlement.findUnique({
        where: { tradingAccountId },
        select: {
            id: true,
            status: true,
            source: true,
            expiresAt: true,
        },
    });

    // Auto-expire grace period in entitlement
    if (
        entitlement?.status === "GRACE" &&
        entitlement.expiresAt &&
        now > entitlement.expiresAt
    ) {
        await prisma.proEntitlement.update({
            where: { tradingAccountId },
            data: { status: "EXPIRED" },
        });
        entitlement.status = "EXPIRED";
    }

    const hasEntitlement =
        entitlement?.status === "ACTIVE" || entitlement?.status === "GRACE";

    // 1. If no active entitlement, check if user is within 7-day trial
    if (!hasEntitlement) {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { createdAt: true },
        });

        if (user) {
            const trialDurationMs = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
            const trialEndsAt = new Date(user.createdAt.getTime() + trialDurationMs);
            if (now < trialEndsAt) {
                const diffMs = trialEndsAt.getTime() - now.getTime();
                const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
                return {
                    isPro: true,
                    status: "TRIAL",
                    source: "PROMO",
                    expiresAt: trialEndsAt,
                    policyState: "ACTIVE",
                    trialInfo: {
                        isTrial: true,
                        daysRemaining,
                        trialEndsAt,
                    },
                };
            }
        }

        return {
            isPro: false,
            status: entitlement?.status ?? "NONE",
            source: entitlement?.source ?? null,
            expiresAt: entitlement?.expiresAt ?? null,
            policyState: "PAUSED",
            trialInfo: null,
        };
    }

    // 2. Evaluate Activity Policy & Funding for ACTIVE / GRACE accounts
    const isEligibleBrokerAccount = isVipEligibleBroker(account.broker);

    // Calculate rolling 30-day lots from verified sources (EA_SYNC, EA_HISTORY, SUPPORT_SYNC)
    const period30dStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [volumeAgg, latestTrade] = await Promise.all([
        prisma.journalEntry.aggregate({
            where: {
                accountId: tradingAccountId,
                status: "CLOSED",
                syncSource: { in: VALID_SYNC_SOURCES },
                OR: [
                    { exitDate: { gte: period30dStart } },
                    { exitDate: null, entryDate: { gte: period30dStart } },
                ],
            },
            _sum: { lotSize: true },
        }),
        prisma.journalEntry.findFirst({
            where: {
                accountId: tradingAccountId,
                status: "CLOSED",
                syncSource: { in: VALID_SYNC_SOURCES },
            },
            orderBy: { exitDate: "desc" },
            select: { exitDate: true, entryDate: true },
        }),
    ]);

    const rolling30dLots = isEligibleBrokerAccount ? (volumeAgg._sum.lotSize ?? 0) : 0;
    const lastTradeAt = latestTrade?.exitDate ?? latestTrade?.entryDate ?? null;
    const daysSinceLastTrade = lastTradeAt
        ? countTradingDaysBetween(lastTradeAt, now)
        : null;

    // Funding verification state
    const fundingVerified = !!account.fundingVerifiedAt;
    const fundingGraceUntil = account.fundingGraceUntil;
    const fundingInGrace = !!fundingGraceUntil && now <= fundingGraceUntil;
    const fundingExpired = !!fundingGraceUntil && now > fundingGraceUntil;

    // Determine Activity Policy
    let policyState: PolicyState = "ACTIVE";
    let policyReason: string | undefined;

    if (!isEligibleBrokerAccount) {
        policyState = "PAUSED";
        policyReason = "Broker is not in the list of supported partner brokers.";
    } else if (fundingExpired) {
        policyState = "PAUSED";
        policyReason = "Funding verification has expired. Please top up $300 to maintain VIP.";
    } else if (daysSinceLastTrade !== null && daysSinceLastTrade > INACTIVITY_PAUSE_DAYS) {
        policyState = "PAUSED";
        policyReason = `No trades recorded for ${daysSinceLastTrade} trading days (limit is ${INACTIVITY_PAUSE_DAYS} trading days).`;
    } else if (rolling30dLots < MIN_MONTHLY_LOTS) {
        policyState = "PAUSED";
        policyReason = `30-day trading volume is ${rolling30dLots.toFixed(2)} / ${MIN_MONTHLY_LOTS} lots required.`;
    } else if (daysSinceLastTrade !== null && daysSinceLastTrade > INACTIVITY_WARN_DAYS) {
        policyState = "WARNED";
        policyReason = `No trades recorded for ${daysSinceLastTrade} trading days. Trade soon to maintain VIP.`;
    } else if (fundingInGrace) {
        policyState = "WARNED";
        policyReason = "Account balance check is in grace period.";
    }

    const effectiveIsPro = policyState !== "PAUSED";

    return {
        isPro: effectiveIsPro,
        status: entitlement!.status,
        source: entitlement!.source,
        expiresAt: entitlement!.expiresAt,
        policyState,
        trialInfo: null,
        activityInfo: {
            rolling30dLots,
            minLotsRequired: MIN_MONTHLY_LOTS,
            daysSinceLastTrade,
            lastTradeAt,
            policyState,
            reason: policyReason,
        },
        fundingInfo: {
            verified: fundingVerified,
            verifiedAt: account.fundingVerifiedAt,
            lastVerifiedAt: account.fundingLastVerifiedAt,
            graceUntil: account.fundingGraceUntil,
            amount: account.fundingAmount,
            inGrace: fundingInGrace,
            expired: fundingExpired,
        },
    };
}

// ============================================================================
// USER-LEVEL PRO ACCESS — aggregate across all accounts
// ============================================================================

/**
 * Check if a user has Pro access (aggregate across all accounts).
 * Evaluates 7-Day Trial and Two-Layer Activity Policy across all user accounts.
 */
export async function getUserProAccess(
    userId: string
): Promise<UserProAccessResult> {
    const now = new Date();

    const [user, entitlements, allTradingAccounts] = await Promise.all([
        prisma.user.findUnique({
            where: { id: userId },
            select: { createdAt: true },
        }),
        prisma.proEntitlement.findMany({
            where: { userId },
            include: {
                tradingAccount: {
                    select: {
                        id: true,
                        name: true,
                        broker: true,
                        balance: true,
                        fundingVerifiedAt: true,
                        fundingAmount: true,
                        fundingLastVerifiedAt: true,
                        fundingGraceUntil: true,
                    },
                },
            },
            orderBy: { createdAt: "desc" },
        }),
        prisma.tradingAccount.findMany({
            where: { userId },
            select: {
                id: true,
                name: true,
                broker: true,
                balance: true,
                fundingVerifiedAt: true,
                fundingAmount: true,
                fundingLastVerifiedAt: true,
                fundingGraceUntil: true,
            },
            orderBy: { createdAt: "asc" },
        }),
    ]);

    // Auto-expire any grace entitlements
    const expiredGraceIds = entitlements
        .filter((e) => e.status === "GRACE" && e.expiresAt && now > e.expiresAt)
        .map((e) => e.id);

    if (expiredGraceIds.length > 0) {
        await prisma.proEntitlement.updateMany({
            where: { id: { in: expiredGraceIds } },
            data: { status: "EXPIRED" },
        });
        for (const ent of entitlements) {
            if (expiredGraceIds.includes(ent.id)) {
                ent.status = "EXPIRED";
            }
        }
    }

    // Query 30-day closed verified volume across all eligible accounts
    const period30dStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const eligibleAccountIds = allTradingAccounts
        .filter((ta) => isVipEligibleBroker(ta.broker))
        .map((ta) => ta.id);

    const [volumeAgg, latestTrade] = await Promise.all([
        eligibleAccountIds.length > 0
            ? prisma.journalEntry.aggregate({
                  where: {
                      userId,
                      accountId: { in: eligibleAccountIds },
                      status: "CLOSED",
                      syncSource: { in: VALID_SYNC_SOURCES },
                      OR: [
                          { exitDate: { gte: period30dStart } },
                          { exitDate: null, entryDate: { gte: period30dStart } },
                      ],
                  },
                  _sum: { lotSize: true },
              })
            : { _sum: { lotSize: 0 } },
        eligibleAccountIds.length > 0
            ? prisma.journalEntry.findFirst({
                  where: {
                      userId,
                      accountId: { in: eligibleAccountIds },
                      status: "CLOSED",
                      syncSource: { in: VALID_SYNC_SOURCES },
                  },
                  orderBy: { exitDate: "desc" },
                  select: { exitDate: true, entryDate: true },
              })
            : null,
    ]);

    const totalRolling30dLots = volumeAgg._sum.lotSize ?? 0;
    const lastTradeAt = latestTrade?.exitDate ?? latestTrade?.entryDate ?? null;
    const daysSinceLastTrade = lastTradeAt
        ? countTradingDaysBetween(lastTradeAt, now)
        : null;

    // Check funding across accounts
    const fundedAccount = allTradingAccounts.find((ta) => ta.fundingVerifiedAt);
    const fundingVerified = !!fundedAccount;
    const fundingGraceUntil = fundedAccount?.fundingGraceUntil ?? null;
    const fundingInGrace = !!fundingGraceUntil && now <= fundingGraceUntil;
    const fundingExpired = !!fundingGraceUntil && now > fundingGraceUntil;

    // Build entitlement map
    const entitlementMap = new Map<string, AccountProStatus>();

    for (const e of entitlements) {
        if (e.tradingAccountId) {
            const isAccountPro = e.status === "ACTIVE" || e.status === "GRACE";
            entitlementMap.set(e.tradingAccountId, {
                tradingAccountId: e.tradingAccountId,
                accountName: e.tradingAccount?.name || "Unknown",
                broker: e.tradingAccount?.broker || e.broker || null,
                status: e.status,
                isPro: isAccountPro,
                source: e.source,
                expiresAt: e.expiresAt,
                fundingVerified: !!e.tradingAccount?.fundingVerifiedAt,
            });
        }
    }

    const accounts: AccountProStatus[] = allTradingAccounts.map((ta) => {
        const existing = entitlementMap.get(ta.id);
        if (existing) return existing;
        return {
            tradingAccountId: ta.id,
            accountName: ta.name,
            broker: ta.broker,
            status: "NONE" as const,
            isPro: false,
            source: null,
            expiresAt: null,
            fundingVerified: !!ta.fundingVerifiedAt,
        };
    });

    // Unlinked entitlements
    const unlinked = entitlements.filter((e) => !e.tradingAccountId);
    for (const e of unlinked) {
        accounts.push({
            tradingAccountId: "",
            accountName: e.broker ? `${e.broker} (unlinked)` : "Unlinked",
            broker: e.broker || null,
            status: e.status,
            isPro: e.status === "ACTIVE" || e.status === "GRACE",
            source: e.source,
            expiresAt: e.expiresAt,
        });
    }

    const hasAnyEntitlement = accounts.some(
        (a) => a.status === "ACTIVE" || a.status === "GRACE"
    );

    // 1. Handle 7-Day Free Trial if user has NO active entitlement
    if (!hasAnyEntitlement && user) {
        const trialDurationMs = TRIAL_DURATION_DAYS * 24 * 60 * 60 * 1000;
        const trialEndsAt = new Date(user.createdAt.getTime() + trialDurationMs);

        if (now < trialEndsAt) {
            const diffMs = trialEndsAt.getTime() - now.getTime();
            const daysRemaining = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));

            return {
                isPro: true,
                status: "TRIAL",
                source: "PROMO",
                expiresAt: trialEndsAt,
                policyState: "ACTIVE",
                trialInfo: {
                    isTrial: true,
                    daysRemaining,
                    trialEndsAt,
                },
                activityInfo: {
                    rolling30dLots: totalRolling30dLots,
                    minLotsRequired: MIN_MONTHLY_LOTS,
                    daysSinceLastTrade,
                    lastTradeAt,
                    policyState: "ACTIVE",
                },
                fundingInfo: {
                    verified: false,
                    verifiedAt: null,
                    lastVerifiedAt: null,
                    graceUntil: null,
                    amount: null,
                    inGrace: false,
                    expired: false,
                },
                activeAccountCount: accounts.length,
                accounts,
            };
        }
    }

    // 2. Evaluate Activity Policy for users with Entitlement
    let aggregatePolicyState: PolicyState = "ACTIVE";
    let policyReason: string | undefined;

    if (!hasAnyEntitlement) {
        aggregatePolicyState = "PAUSED";
        policyReason = "No active VIP entitlement or trial.";
    } else if (eligibleAccountIds.length === 0) {
        aggregatePolicyState = "PAUSED";
        policyReason = "No trading accounts linked to supported partner brokers.";
    } else if (fundingExpired) {
        aggregatePolicyState = "PAUSED";
        policyReason = "Funding verification has expired. Please top up $300 to maintain VIP.";
    } else if (daysSinceLastTrade !== null && daysSinceLastTrade > INACTIVITY_PAUSE_DAYS) {
        aggregatePolicyState = "PAUSED";
        policyReason = `No trades recorded for ${daysSinceLastTrade} trading days (limit is ${INACTIVITY_PAUSE_DAYS} trading days).`;
    } else if (totalRolling30dLots < MIN_MONTHLY_LOTS) {
        aggregatePolicyState = "PAUSED";
        policyReason = `30-day trading volume is ${totalRolling30dLots.toFixed(2)} / ${MIN_MONTHLY_LOTS} lots required.`;
    } else if (daysSinceLastTrade !== null && daysSinceLastTrade > INACTIVITY_WARN_DAYS) {
        aggregatePolicyState = "WARNED";
        policyReason = `No trades recorded for ${daysSinceLastTrade} trading days. Trade soon to maintain VIP.`;
    } else if (fundingInGrace) {
        aggregatePolicyState = "WARNED";
        policyReason = "Account balance check is in grace period.";
    }

    const effectiveIsPro = hasAnyEntitlement && aggregatePolicyState !== "PAUSED";

    // Determine aggregate DB status
    let aggregateStatus: ProStatus;
    const proStatuses = accounts.filter((a) => a.status !== "NONE");

    if (proStatuses.length === 0) {
        aggregateStatus = "NONE";
    } else if (hasAnyEntitlement) {
        aggregateStatus = "ACTIVE";
    } else if (proStatuses.some((a) => a.status === "EXPIRED")) {
        aggregateStatus = "EXPIRED";
    } else if (proStatuses.some((a) => a.status === "REVOKED")) {
        aggregateStatus = "REVOKED";
    } else {
        aggregateStatus = "NONE";
    }

    const bestEntitlement =
        entitlements.find((e) => e.status === "ACTIVE") ||
        entitlements.find((e) => e.status === "GRACE") ||
        entitlements[0];

    return {
        isPro: effectiveIsPro,
        status: aggregateStatus,
        source: bestEntitlement?.source ?? null,
        expiresAt: bestEntitlement?.expiresAt ?? null,
        policyState: aggregatePolicyState,
        trialInfo: null,
        activityInfo: {
            rolling30dLots: totalRolling30dLots,
            minLotsRequired: MIN_MONTHLY_LOTS,
            daysSinceLastTrade,
            lastTradeAt,
            policyState: aggregatePolicyState,
            reason: policyReason,
        },
        fundingInfo: {
            verified: fundingVerified,
            verifiedAt: fundedAccount?.fundingVerifiedAt ?? null,
            lastVerifiedAt: fundedAccount?.fundingLastVerifiedAt ?? null,
            graceUntil: fundedAccount?.fundingGraceUntil ?? null,
            amount: fundedAccount?.fundingAmount ?? null,
            inGrace: fundingInGrace,
            expired: fundingExpired,
        },
        activeAccountCount: effectiveIsPro ? accounts.filter((a) => a.isPro).length : 0,
        accounts,
    };
}

// ============================================================================
// UTILITY
// ============================================================================

/**
 * Mask account number for display: "12345678" → "****5678"
 */
export function maskAccountNumber(accountNumber: string): string {
    if (!accountNumber || accountNumber.length < 4) return "****";
    return "****" + accountNumber.slice(-4);
}

/**
 * Try to find a TradingAccount for a VIP request.
 * Matches by userId + accountNumber (primary key for a broker account).
 */
export async function findOrMatchTradingAccount(
    userId: string,
    broker: string,
    accountNumber: string
): Promise<string | null> {
    const exact = await prisma.tradingAccount.findFirst({
        where: {
            userId,
            broker: { equals: broker, mode: "insensitive" },
            accountNumber,
        },
        select: { id: true },
    });
    if (exact) return exact.id;

    const byAccount = await prisma.tradingAccount.findFirst({
        where: { userId, accountNumber },
        select: { id: true },
    });

    return byAccount?.id || null;
}

