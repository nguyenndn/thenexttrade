import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { normalizeSyncApiKey } from "@/lib/utils/api-key";
import {
    normalizeAccountNumber,
    normalizeBrokerKey,
} from "@/lib/trading-account-identity";

const ACCOUNT_SELECT = {
    id: true,
    userId: true,
    accountNumber: true,
    platform: true,
    autoSync: true,
    syncOpenTrades: true,
    currency: true,
    server: true,
    accountType: true,
    broker: true,
} as const;

// ─── Types ──────────────────────────────────────────────────────────────────────

export type SyncAuthResult = {
    user: {
        id: string;
        email: string | null;
        name: string | null;
    };
    account?: {
        id: string;
        userId: string;
        accountNumber: string | null;
        platform: string | null;
        autoSync: boolean;
        syncOpenTrades: boolean;
        currency?: string | null;
        server?: string | null;
        accountType?: string | null;
        broker?: string | null;
    };
    authMode: "USER_SYNC_KEY" | "LEGACY_ACCOUNT_KEY";
};

type ResolveSyncAuthOptions = {
    /** The incoming request (reads X-Sync-Key / X-API-Key headers) */
    request: NextRequest;
    /** Account number from body/query to resolve the specific account */
    accountNumber?: string | null;
    /** Broker/company from the EA payload, used to disambiguate logins */
    broker?: string | null;
    /** Account DB id from body/query to resolve the specific account */
    accountId?: string | null;
    /** Whether to allow legacy TradingAccount.apiKey fallback (default: true) */
    allowLegacyAccountKey?: boolean;
    /** If true, require an account to be resolved (returns error if not found) */
    requireAccount?: boolean;
};

// ─── Helper ─────────────────────────────────────────────────────────────────────

/**
 * Unified sync authentication resolver.
 *
 * Priority:
 * 1. `X-Sync-Key` header → lookup `User.syncApiKey`
 * 2. `X-API-Key` header → try `User.syncApiKey` first, then legacy `TradingAccount.apiKey`
 *
 * If a user-level key is found and `accountNumber` / `accountId` is provided,
 * the specific TradingAccount is resolved and returned.
 */
export async function resolveSyncAuth(
    options: ResolveSyncAuthOptions
): Promise<
    | { success: true; data: SyncAuthResult }
    | { success: false; error: string; status: number }
> {
    const {
        request,
        accountNumber,
        broker,
        accountId,
        allowLegacyAccountKey = true,
        requireAccount = false,
    } = options;

    // 1. Extract key from headers (prefer X-Sync-Key)
    const syncKey = request.headers.get("X-Sync-Key");
    const apiKey = request.headers.get("X-API-Key");
    const rawKey = syncKey || apiKey;
    const key = normalizeSyncApiKey(rawKey);

    if (!key) {
        return { success: false, error: "Missing API key", status: 401 };
    }

    // 2. Try user-level sync key first
    let user = await prisma.user.findUnique({
        where: { syncApiKey: key },
        select: {
            id: true,
            email: true,
            name: true,
        },
    });

    // Fallback if DB key was stored with different whitespace or case
    if (!user && rawKey && rawKey.trim() !== key) {
        user = await prisma.user.findUnique({
            where: { syncApiKey: rawKey.trim() },
            select: {
                id: true,
                email: true,
                name: true,
            },
        });
    }

    if (user) {
        // User-level key found — resolve account if identity provided
        let account: SyncAuthResult["account"] | undefined;

        if (accountId) {
            const found = await prisma.tradingAccount.findFirst({
                where: { id: accountId, userId: user.id },
                select: ACCOUNT_SELECT,
            });

            if (found) {
                account = found;
            } else if (requireAccount) {
                return {
                    success: false,
                    error: `No trading account found for id ${accountId}`,
                    status: 404,
                };
            }
        } else if (accountNumber) {
            const cleanAccountNumber = normalizeAccountNumber(
                String(accountNumber)
            );
            const cleanBroker = normalizeBrokerKey(broker);

            // Fetch the login's candidates, then compare broker keys in JS.
            // Broker columns are free-text display names (`IC Markets` vs
            // `ICMARKETS`), so an exact DB equality would miss real matches.
            const candidates = await prisma.tradingAccount.findMany({
                where: {
                    userId: user.id,
                    accountNumber: cleanAccountNumber,
                },
                select: ACCOUNT_SELECT,
                take: 25,
            });

            if (cleanBroker) {
                const brokerMatches = candidates.filter(
                    (candidate) =>
                        normalizeBrokerKey(candidate.broker) === cleanBroker
                );

                if (brokerMatches.length === 1) {
                    account = brokerMatches[0];
                } else if (brokerMatches.length > 1) {
                    return {
                        success: false,
                        error: `Account #${cleanAccountNumber} is ambiguous at broker ${cleanBroker}. Contact support to remove the duplicate.`,
                        status: 409,
                    };
                } else {
                    // A legacy row may predate broker capture. Adopt it only
                    // when it is the sole candidate and its broker is empty.
                    const unknownBrokerCandidates = candidates.filter(
                        (candidate) => !normalizeBrokerKey(candidate.broker)
                    );
                    if (
                        candidates.length === 1 &&
                        unknownBrokerCandidates.length === 1
                    ) {
                        account = unknownBrokerCandidates[0];
                    } else if (requireAccount) {
                        return {
                            success: false,
                            error: `No trading account found for account #${cleanAccountNumber} at broker ${cleanBroker}`,
                            status: 404,
                        };
                    }
                }
            } else if (candidates.length > 1) {
                // Legacy clients do not send a broker. Only resolve when the
                // login is unambiguous inside this user's account list.
                return {
                    success: false,
                    error: `Account #${cleanAccountNumber} exists at multiple brokers. Include broker in the request.`,
                    status: 400,
                };
            } else if (candidates.length === 1) {
                account = candidates[0];
            } else if (requireAccount) {
                return {
                    success: false,
                    error: `No trading account found for account #${cleanAccountNumber}`,
                    status: 404,
                };
            }
        } else if (requireAccount) {
            return {
                success: false,
                error: "Missing accountNumber or accountId in request",
                status: 400,
            };
        }

        return {
            success: true,
            data: { user, account, authMode: "USER_SYNC_KEY" },
        };
    }

    // 3. Legacy fallback: try TradingAccount.apiKey
    if (allowLegacyAccountKey) {
        const legacyAccount = await prisma.tradingAccount.findUnique({
            where: { apiKey: key },
            select: {
                id: true,
                userId: true,
                accountNumber: true,
                platform: true,
                autoSync: true,
                syncOpenTrades: true,
                currency: true,
                server: true,
                accountType: true,
                broker: true,
                user: {
                    select: {
                        id: true,
                        email: true,
                        name: true,
                    },
                },
            },
        });

        if (legacyAccount) {
            return {
                success: true,
                data: {
                    user: legacyAccount.user,
                    account: {
                        id: legacyAccount.id,
                        userId: legacyAccount.userId,
                        accountNumber: legacyAccount.accountNumber,
                        platform: legacyAccount.platform,
                        autoSync: legacyAccount.autoSync,
                        syncOpenTrades: legacyAccount.syncOpenTrades,
                        currency: legacyAccount.currency,
                        server: legacyAccount.server,
                        accountType: legacyAccount.accountType,
                        broker: legacyAccount.broker,
                    },
                    authMode: "LEGACY_ACCOUNT_KEY",
                },
            };
        }
    }

    return { success: false, error: "Invalid API key", status: 401 };
}
