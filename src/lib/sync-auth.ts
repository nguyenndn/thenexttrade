import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

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
    };
    authMode: "USER_SYNC_KEY" | "LEGACY_ACCOUNT_KEY";
};

type ResolveSyncAuthOptions = {
    /** The incoming request (reads X-Sync-Key / X-API-Key headers) */
    request: NextRequest;
    /** Account number from body/query to resolve the specific account */
    accountNumber?: string | null;
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
): Promise<{ success: true; data: SyncAuthResult } | { success: false; error: string; status: number }> {
    const { request, accountNumber, accountId, allowLegacyAccountKey = true, requireAccount = false } = options;

    // 1. Extract key from headers (prefer X-Sync-Key)
    const syncKey = request.headers.get("X-Sync-Key");
    const apiKey = request.headers.get("X-API-Key");
    const key = syncKey || apiKey;

    if (!key) {
        return { success: false, error: "Missing API key", status: 401 };
    }

    // 2. Try user-level sync key first
    const user = await prisma.user.findUnique({
        where: { syncApiKey: key },
        select: {
            id: true,
            email: true,
            name: true,
        },
    });

    if (user) {
        // User-level key found — resolve account if identity provided
        let account: SyncAuthResult["account"] | undefined;

        if (accountId || accountNumber) {
            const where = accountId
                ? { id: accountId, userId: user.id }
                : { userId: user.id, accountNumber: String(accountNumber) };

            const found = await prisma.tradingAccount.findFirst({
                where,
                select: {
                    id: true,
                    userId: true,
                    accountNumber: true,
                    platform: true,
                    autoSync: true,
                    syncOpenTrades: true,
                },
            });

            if (found) {
                account = found;
            } else if (requireAccount) {
                return {
                    success: false,
                    error: `No trading account found for ${accountId ? `id ${accountId}` : `account #${accountNumber}`}`,
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
                    },
                    authMode: "LEGACY_ACCOUNT_KEY",
                },
            };
        }
    }

    return { success: false, error: "Invalid API key", status: 401 };
}
