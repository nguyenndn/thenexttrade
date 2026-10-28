// Pro Access Utility — used by server actions, API routes, and feature gates
// Implements 7-Day Free Trial & Two-Layer Active Trader Retention Policy (v1.4.0)

import { prisma } from "@/lib/prisma";
import type { ProStatus, ProSource } from "@prisma/client";
import {
    isCentAccount,
    normalizeLotSize,
} from "@/lib/utils/cent-account";
import { isLiveTradingAccount } from "@/lib/trading-account-classification";

// ============================================================================
// CONSTANTS (Official Parameters from docs/VIP-MEMBERSHIP-AND-TRIAL-SPEC.md)
// ============================================================================

export const TRIAL_DURATION_DAYS = 7;
export const MIN_MONTHLY_LOTS = 2.0;
export const MIN_30D_LOTS = MIN_MONTHLY_LOTS;
export const INACTIVITY_WARN_DAYS = 7;
export const INACTIVITY_WARNING_DAYS = INACTIVITY_WARN_DAYS;
export const INACTIVITY_PAUSE_DAYS = 14;
export const FUNDING_MIN_BALANCE = 200;
export const FUNDING_RECHECK_DAYS = 30;
export const FUNDING_GRACE_DAYS = 7;
export const VALID_SYNC_SOURCES = [
    "EA_SYNC",
    "EA_HISTORY",
    "SUPPORT_SYNC",
    "CLOUD_WORKER",
];
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

/**
 * Load VIP eligibility from the EABroker table. The database is the source of
 * truth so admins can add/remove partner brokers without a code deploy.
 */
export async function getVipEligibleBrokerKeys(): Promise<Set<string>> {
    const brokers = await prisma.eABroker.findMany({
        where: { isActive: true, isVipEligible: true },
        select: { name: true, slug: true },
    });

    const keys = new Set<string>();
    for (const broker of brokers) {
        const nameKey = normalizeBrokerKey(broker.name);
        const slugKey = normalizeBrokerKey(broker.slug);
        if (nameKey) keys.add(nameKey);
        if (slugKey) keys.add(slugKey);
    }
    return keys;
}

export function isVipEligibleBrokerKey(
    broker: string | null | undefined,
    eligibleBrokerKeys: ReadonlySet<string>
): boolean {
    const key = normalizeBrokerKey(broker);
    return !!key && eligibleBrokerKeys.has(key);
}

export async function isVipEligibleBrokerInDatabase(
    broker: string | null | undefined
): Promise<boolean> {
    const keys = await getVipEligibleBrokerKeys();
    return isVipEligibleBrokerKey(broker, keys);
}

interface ActivityPolicyInput {
    brokerEligible: boolean;
    rolling30dLots: number;
    daysSinceLastTrade: number | null;
    fundingInGrace: boolean;
    fundingExpired: boolean;
}

export function evaluateActivityPolicy(
    input: ActivityPolicyInput
): { policyState: PolicyState; reason?: string } {
    if (!input.brokerEligible) {
        return {
            policyState: "PAUSED",
            reason: "Broker is not eligible for Partner Pro.",
        };
    }

    if (input.fundingExpired) {
        return {
            policyState: "PAUSED",
            reason: `Funding verification has expired. Please top up $${FUNDING_MIN_BALANCE} to restore VIP.`,
        };
    }

    if (input.rolling30dLots < MIN_MONTHLY_LOTS) {
        return {
            policyState: "PAUSED",
            reason: `Only ${input.rolling30dLots.toFixed(2)} verified lots in the last 30 days. At least ${MIN_MONTHLY_LOTS.toFixed(1)} lots are required.`,
        };
    }

    if (input.daysSinceLastTrade === null) {
        return {
            policyState: "PAUSED",
            reason: "No verified closed trades have been synced yet.",
        };
    }

    if (input.daysSinceLastTrade > INACTIVITY_PAUSE_DAYS) {
        return {
            policyState: "PAUSED",
            reason: `No verified trades for ${input.daysSinceLastTrade} trading days. The limit is ${INACTIVITY_PAUSE_DAYS}.`,
        };
    }

    if (input.fundingInGrace) {
        return {
            policyState: "WARNED",
            reason: "Account balance check is in the 7-day grace period.",
        };
    }

    if (input.daysSinceLastTrade > INACTIVITY_WARN_DAYS) {
        return {
            policyState: "WARNED",
            reason: `No verified trades for ${input.daysSinceLastTrade} trading days.`,
        };
    }

    return { policyState: "ACTIVE" };
}

export {
    isCentAccount,
    isCentSymbol,
    normalizeLotSize,
    normalizeUsdBalance,
    CENT_LOT_DIVISOR,
} from "@/lib/utils/cent-account";

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
            accountNumber: true,
            balance: true,
            currency: true,
            server: true,
            accountType: true,
            status: true,
            fundingVerifiedAt: true,
            fundingAmount: true,
            fundingLastVerifiedAt: true,
            fundingGraceUntil: true,
        },
    });

    if (!account) {
        return { isPro: false, status: "NONE", source: null, expiresAt: null };
    }

    let entitlement = await prisma.proEntitlement.findUnique({
        where: { tradingAccountId },
        select: {
            id: true,
            status: true,
            source: true,
            expiresAt: true,
        },
    });

    // If no active/grace account-level entitlement, check for matching unlinked entitlement or global user-level entitlement
    if (
        !entitlement ||
        (entitlement.status !== "ACTIVE" && entitlement.status !== "GRACE")
    ) {
        let unlinkedMatch = null;
        if (account.accountNumber && account.broker) {
            const unlinkedCandidates =
                (await prisma.proEntitlement.findMany({
                    where: {
                        userId,
                        tradingAccountId: null,
                        accountNumber: account.accountNumber,
                        status: { in: ["ACTIVE", "GRACE"] },
                    },
                    orderBy: { createdAt: "desc" },
                    select: {
                        id: true,
                        broker: true,
                        status: true,
                        source: true,
                        expiresAt: true,
                    },
                })) || [];
            const accountBrokerKey = normalizeBrokerKey(account.broker);
            unlinkedMatch =
                unlinkedCandidates.find(
                    (candidate) =>
                        normalizeBrokerKey(candidate.broker) ===
                        accountBrokerKey
                ) ?? null;
            if (unlinkedMatch) {
                prisma.proEntitlement
                    .update({
                        where: { id: unlinkedMatch.id },
                        data: { tradingAccountId },
                    })
                    .catch(() => {});
                entitlement = unlinkedMatch;
            }
        }

        if (!unlinkedMatch) {
            const globalEntitlement = await prisma.proEntitlement.findFirst({
                where: {
                    userId,
                    tradingAccountId: null,
                    OR: [
                        { accountNumber: null, broker: null },
                        { source: "MANUAL_ADMIN" },
                    ],
                    status: { in: ["ACTIVE", "GRACE", "REVOKED"] },
                },
                select: {
                    id: true,
                    status: true,
                    source: true,
                    expiresAt: true,
                },
                orderBy: { createdAt: "desc" },
            });
            if (globalEntitlement && (!entitlement || globalEntitlement.status !== "REVOKED")) {
                entitlement = globalEntitlement;
            }
        }
    }

    // Auto-expire grace period in entitlement
    if (
        entitlement?.status === "GRACE" &&
        entitlement.expiresAt &&
        now > entitlement.expiresAt
    ) {
        await prisma.proEntitlement.update({
            where: { id: entitlement.id },
            data: { status: "EXPIRED" },
        });
        entitlement.status = "EXPIRED";
    }

    const hasEntitlement =
        entitlement?.status === "ACTIVE" || entitlement?.status === "GRACE";
    const isManualAdminGrant = entitlement?.source === "MANUAL_ADMIN";

    // 1. If no active entitlement, check if user is within 7-day trial (unless explicitly REVOKED by Admin)
    if (!hasEntitlement) {
        if (entitlement?.status !== "REVOKED") {
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
    const eligibleBrokerKeys = await getVipEligibleBrokerKeys();
    const isEligibleBrokerAccount = isVipEligibleBrokerKey(
        account.broker,
        eligibleBrokerKeys
    );

    // Calculate rolling 30-day lots from verified sources.
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

    const isLiveAccount = isLiveTradingAccount(account);
    const isCent = isCentAccount(account.currency, account.server, account.accountType);
    const rawLots = volumeAgg._sum.lotSize ?? 0;
    const rolling30dLots =
        isLiveAccount && isEligibleBrokerAccount
            ? normalizeLotSize(rawLots, isCent)
            : 0;
    const lastTradeAt = isLiveAccount
        ? latestTrade?.exitDate ?? latestTrade?.entryDate ?? null
        : null;
    const daysSinceLastTrade = lastTradeAt
        ? countTradingDaysBetween(lastTradeAt, now)
        : null;

    // Funding verification state
    const fundingVerified = isLiveAccount && !!account.fundingVerifiedAt;
    const fundingGraceUntil = account.fundingGraceUntil;
    const fundingInGrace =
        fundingVerified && !!fundingGraceUntil && now <= fundingGraceUntil;
    const fundingExpired =
        fundingVerified && !!fundingGraceUntil && now > fundingGraceUntil;

    const policy = isManualAdminGrant
        ? {
              policyState: "ACTIVE" as const,
              reason: "Manual administrator override.",
          }
        : isLiveAccount
          ? evaluateActivityPolicy({
                brokerEligible: isEligibleBrokerAccount,
                rolling30dLots,
                daysSinceLastTrade,
                fundingInGrace,
                fundingExpired,
            })
          : {
                policyState: "PAUSED" as const,
                reason:
                    "Demo, contest, evaluation, and trial accounts do not qualify for VIP business metrics.",
            };
    const { policyState, reason: policyReason } = policy;

    const effectiveIsPro = isManualAdminGrant || policyState !== "PAUSED";

    return {
        isPro: effectiveIsPro,
        status:
            entitlement?.status === "ACTIVE" || entitlement?.status === "GRACE"
                ? entitlement.status
                : "NONE",
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
                        currency: true,
                        server: true,
                        accountType: true,
                        status: true,
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
                accountNumber: true,
                balance: true,
                currency: true,
                server: true,
                accountType: true,
                status: true,
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
    const hasManualAdminOverride = entitlements.some(
        (e) =>
            (e.status === "ACTIVE" || e.status === "GRACE") &&
            e.source === "MANUAL_ADMIN"
    );

    // Query 30-day closed verified volume across all eligible accounts
    const period30dStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const eligibleBrokerKeys = await getVipEligibleBrokerKeys();
    const eligibleAccountIds = allTradingAccounts
        .filter(
            (ta) =>
                isLiveTradingAccount(ta) &&
                isVipEligibleBrokerKey(ta.broker, eligibleBrokerKeys)
        )
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

    let totalRolling30dLots = 0;
    if (eligibleAccountIds.length > 0) {
        const hasAnyCentAccount = allTradingAccounts.some((ta) =>
            isCentAccount(ta.currency, ta.server, ta.accountType)
        );

        if (!hasAnyCentAccount) {
            totalRolling30dLots = volumeAgg._sum.lotSize ?? 0;
        } else {
            const volumeByAccount = await prisma.journalEntry.groupBy({
                by: ["accountId"],
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
            });

            for (const item of volumeByAccount) {
                const acc = allTradingAccounts.find((a) => a.id === item.accountId);
                const isCent = isCentAccount(acc?.currency, acc?.server, acc?.accountType);
                totalRolling30dLots += normalizeLotSize(item._sum.lotSize ?? 0, isCent);
            }
        }
    }
    const lastTradeAt = latestTrade?.exitDate ?? latestTrade?.entryDate ?? null;
    const daysSinceLastTrade = lastTradeAt
        ? countTradingDaysBetween(lastTradeAt, now)
        : null;

    // Check funding across eligible accounts. One healthy funded account is
    // enough for the user-level result; a stale account must not pause another.
    const eligibleFundingAccounts = allTradingAccounts.filter((ta) =>
        isLiveTradingAccount(ta) &&
        isVipEligibleBrokerKey(ta.broker, eligibleBrokerKeys)
    );
    const healthyFundedAccount = eligibleFundingAccounts.find(
        (ta) =>
            ta.fundingVerifiedAt &&
            (!ta.fundingGraceUntil || now <= ta.fundingGraceUntil)
    );
    const fundedAccount =
        healthyFundedAccount ??
        eligibleFundingAccounts.find((ta) => ta.fundingVerifiedAt);
    const fundingVerified = !!fundedAccount;
    const fundingGraceUntil = fundedAccount?.fundingGraceUntil ?? null;
    const fundingInGrace =
        !healthyFundedAccount &&
        !!fundingGraceUntil &&
        now <= fundingGraceUntil;
    const fundingExpired =
        !healthyFundedAccount &&
        eligibleFundingAccounts.some(
            (ta) =>
                !!ta.fundingVerifiedAt &&
                !!ta.fundingGraceUntil &&
                now > ta.fundingGraceUntil
        );

    // Build entitlement map
    const entitlementMap = new Map<string, AccountProStatus>();

    for (const e of entitlements) {
        if (e.tradingAccountId) {
            const isAccountPro =
                e.status === "ACTIVE" || e.status === "GRACE";
            const isEligibleAccount =
                !!e.tradingAccount &&
                isLiveTradingAccount(e.tradingAccount) &&
                isVipEligibleBrokerKey(e.tradingAccount.broker, eligibleBrokerKeys);
            const hasAccess =
                isAccountPro &&
                (e.source === "MANUAL_ADMIN" || isEligibleAccount);
            entitlementMap.set(e.tradingAccountId, {
                tradingAccountId: e.tradingAccountId,
                accountName: e.tradingAccount?.name || "Unknown",
                broker: e.tradingAccount?.broker || e.broker || null,
                status: hasAccess ? e.status : ("NONE" as const),
                isPro: hasAccess,
                source: e.source,
                expiresAt: e.expiresAt,
                fundingVerified:
                    !!e.tradingAccount &&
                    isLiveTradingAccount(e.tradingAccount) &&
                    !!e.tradingAccount.fundingVerifiedAt,
            });
        }
    }

    // Match unlinked entitlements to existing trading accounts or global admin grants
    const unlinked = entitlements.filter((e) => !e.tradingAccountId);
    const globalUnlinkedAccounts: AccountProStatus[] = [];

    for (const e of unlinked) {
        const isAccountPro = e.status === "ACTIVE" || e.status === "GRACE";
        if (e.accountNumber && e.broker) {
            const matchedTa = allTradingAccounts.find(
                (ta) =>
                    ta.accountNumber === e.accountNumber &&
                    normalizeBrokerKey(ta.broker) ===
                        normalizeBrokerKey(e.broker)
            );
            if (matchedTa && !entitlementMap.has(matchedTa.id)) {
                const isEligibleAccount =
                    isLiveTradingAccount(matchedTa) &&
                    isVipEligibleBrokerKey(
                        matchedTa.broker,
                        eligibleBrokerKeys
                    );
                const hasAccess =
                    isAccountPro &&
                    (e.source === "MANUAL_ADMIN" || isEligibleAccount);
                entitlementMap.set(matchedTa.id, {
                    tradingAccountId: matchedTa.id,
                    accountName: matchedTa.name || "Unknown",
                    broker: matchedTa.broker || e.broker || null,
                    status: hasAccess ? e.status : ("NONE" as const),
                    isPro: hasAccess,
                    source: e.source,
                    expiresAt: e.expiresAt,
                    fundingVerified:
                        isLiveTradingAccount(matchedTa) &&
                        !!matchedTa.fundingVerifiedAt,
                });
                if (hasAccess) {
                    prisma.proEntitlement
                        .update({
                            where: { id: e.id },
                            data: { tradingAccountId: matchedTa.id },
                        })
                        .catch(() => {});
                }
                continue;
            }
        }

        // Only count unlinked entitlement if it is a genuine global user-level grant
        // (matching getAccountProAccess behavior). Ignore orphaned IB_VERIFIED rows
        // left behind from deleted trading accounts.
        const isGlobalGrant =
            (!e.accountNumber && !e.broker) || e.source === "MANUAL_ADMIN";
        if (isGlobalGrant) {
            globalUnlinkedAccounts.push({
                tradingAccountId: "",
                accountName: e.broker ? `${e.broker} (unlinked)` : "Unlinked",
                broker: e.broker || null,
                status: isAccountPro ? e.status : ("NONE" as const),
                isPro: isAccountPro,
                source: e.source,
                expiresAt: e.expiresAt,
            });
        }
    }

    const activeGlobalGrant = globalUnlinkedAccounts.find(
        (g) => g.status === "ACTIVE" || g.status === "GRACE"
    );

    const accounts: AccountProStatus[] = allTradingAccounts.map((ta) => {
        const existing = entitlementMap.get(ta.id);
        if (
            existing &&
            (existing.status === "ACTIVE" || existing.status === "GRACE")
        ) {
            return existing;
        }
        if (activeGlobalGrant) {
            const isEligibleAccount =
                isLiveTradingAccount(ta) &&
                isVipEligibleBrokerKey(ta.broker, eligibleBrokerKeys);
            const hasAccess =
                activeGlobalGrant.source === "MANUAL_ADMIN" ||
                isEligibleAccount;
            if (hasAccess) {
                return {
                    tradingAccountId: ta.id,
                    accountName: ta.name,
                    broker: ta.broker,
                    status: activeGlobalGrant.status,
                    isPro: true,
                    source: activeGlobalGrant.source,
                    expiresAt: activeGlobalGrant.expiresAt,
                    fundingVerified:
                        isLiveTradingAccount(ta) && !!ta.fundingVerifiedAt,
                };
            }
        }
        if (existing) return existing;
        return {
            tradingAccountId: ta.id,
            accountName: ta.name,
            broker: ta.broker,
            status: "NONE" as const,
            isPro: false,
            source: null,
            expiresAt: null,
            fundingVerified:
                isLiveTradingAccount(ta) && !!ta.fundingVerifiedAt,
        };
    });

    accounts.push(...globalUnlinkedAccounts);

    const hasAnyEntitlement = accounts.some(
        (a) => a.status === "ACTIVE" || a.status === "GRACE"
    );
    const hasRevokedEntitlement = entitlements.some(
        (e) => e.status === "REVOKED"
    );

    // 1. Handle 7-Day Free Trial if user has NO active entitlement and has NOT been explicitly revoked by Admin
    if (!hasAnyEntitlement && !hasRevokedEntitlement && user) {
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
    const policy = hasManualAdminOverride
        ? {
              policyState: "ACTIVE" as const,
              reason: "Manual administrator override.",
          }
        : evaluateActivityPolicy({
              brokerEligible: eligibleAccountIds.length > 0,
              rolling30dLots: totalRolling30dLots,
              daysSinceLastTrade,
              fundingInGrace,
              fundingExpired,
          });
    const aggregatePolicyState = policy.policyState;
    const policyReason = policy.reason;

    const effectiveIsPro =
        hasManualAdminOverride ||
        (hasAnyEntitlement &&
            eligibleAccountIds.length > 0 &&
            aggregatePolicyState !== "PAUSED");

    // Determine aggregate DB status
    let aggregateStatus: ProStatus;
    const proStatuses = accounts.filter((a) => a.status !== "NONE");

    if (proStatuses.some((a) => a.status === "ACTIVE")) {
        aggregateStatus = "ACTIVE";
    } else if (proStatuses.some((a) => a.status === "GRACE")) {
        aggregateStatus = "GRACE";
    } else if (
        proStatuses.some((a) => a.status === "EXPIRED") ||
        entitlements.some((e) => e.status === "EXPIRED")
    ) {
        aggregateStatus = "EXPIRED";
    } else if (
        proStatuses.some((a) => a.status === "REVOKED") ||
        entitlements.some((e) => e.status === "REVOKED")
    ) {
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

