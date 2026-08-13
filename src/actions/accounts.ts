"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { generateApiKey } from "@/lib/utils/api-key";
import crypto from "crypto";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAccountsProEligibility } from "@/lib/pro-eligibility";

const accountSchema = z.object({
    name: z.string().min(1).max(50),
    broker: z.string().optional(),
    accountNumber: z.string().max(20).optional(),
    balance: z.number().min(0),
    currency: z.string().length(3),
    platform: z.string().optional(),
    isDefault: z.boolean().optional(),
    color: z.string().optional(),
});

export async function getTradingAccounts(page = 1, limit = 12) {
    const user = await getAuthUser();
    if (!user)
        return { accounts: [], meta: { total: 0, page, limit, totalPages: 0 } };

    const safePage = Number.isInteger(page) && page > 0 ? page : 1;
    const safeLimit = Number.isInteger(limit) && limit > 0 ? limit : 12;
    const skip = (safePage - 1) * safeLimit;

    const [accounts, total] = await Promise.all([
        prisma.tradingAccount.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "asc" },
            select: {
                id: true,
                name: true,
                color: true,
                platform: true,
                broker: true,
                accountNumber: true,
                status: true,
                lastHeartbeat: true,
                lastSync: true,
                totalTrades: true,
                autoSync: true,
                createdAt: true,
                server: true,
                balance: true,
                equity: true,
                accountType: true,
                useForLeaderboard: true,
                apiKey: false,
                syncSource: true,
                appLastHeartbeat: true,
                eaVersion: true,
                currency: true,
                isDefault: true,
                maxDailyLoss: true,
                maxDailyTrades: true,
                maxRiskPercent: true,
                cooldownAfterLosses: true,
                _count: {
                    select: { journalEntries: true },
                },
                // Pro/VIP status joins
                proEntitlement: {
                    select: { status: true, source: true, expiresAt: true },
                },
                vipRequests: {
                    select: { status: true },
                    orderBy: { createdAt: "desc" as const },
                    take: 1,
                },
            },
            skip,
            take: limit,
        }),
        prisma.tradingAccount.count({ where: { userId: user.id } }),
    ]);

    // Fetch eligibility for all accounts
    const eligibilityMap = await getAccountsProEligibility(user.id);

    // Enrich with connection + Pro/EA/VIP status + eligibility
    const accountsWithStatus = accounts.map((acc) => {
        const proEntitlement = acc.proEntitlement;
        const proStatus = proEntitlement?.status || "NONE";
        const proSource = proEntitlement?.source || null;
        const proExpiresAt = proEntitlement?.expiresAt?.toISOString() || null;
        const vipStatus = acc.vipRequests?.[0]?.status || null;
        const isPro = proStatus === "ACTIVE" || proStatus === "GRACE";
        const eaAccess: "INCLUDED" | "NOT_INCLUDED" = isPro
            ? "INCLUDED"
            : "NOT_INCLUDED";
        const eligibility = eligibilityMap[acc.id] || null;
        const effectiveTotalTrades = Math.max(
            acc.totalTrades || 0,
            acc._count?.journalEntries || 0
        );

        return {
            ...acc,
            totalTrades: effectiveTotalTrades,
            platform: acc.platform || "MetaTrader 4",
            lastHeartbeat: acc.lastHeartbeat
                ? acc.lastHeartbeat.toISOString()
                : null,
            lastSync: acc.lastSync ? acc.lastSync.toISOString() : null,
            appLastHeartbeat: acc.appLastHeartbeat
                ? acc.appLastHeartbeat.toISOString()
                : null,
            createdAt: acc.createdAt.toISOString(),
            isConnected: acc.lastHeartbeat
                ? Date.now() - new Date(acc.lastHeartbeat).getTime() <
                  10 * 60 * 1000
                : false,
            // Pro/VIP/EA enrichment
            proStatus,
            proSource,
            proExpiresAt,
            vipStatus,
            eaAccess,
            eligibility,
            // Remove raw relations from serialized output
            proEntitlement: undefined,
            vipRequests: undefined,
            _count: undefined,
        };
    });

    return {
        accounts: accountsWithStatus,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        },
    };
}

export async function createTradingAccount(
    data: z.infer<typeof accountSchema>
) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const validation = accountSchema.safeParse(data);
    if (!validation.success) return { error: "Invalid data" };

    const {
        name,
        broker,
        accountNumber,
        balance,
        currency,
        platform,
        isDefault,
        color,
    } = validation.data;

    try {
        // Handle Default Account Logic
        if (isDefault) {
            await prisma.tradingAccount.updateMany({
                where: { userId: user.id, isDefault: true },
                data: { isDefault: false },
            });
        }

        // Auto-generate user-level syncApiKey if not yet created
        const existingUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { syncApiKey: true },
        });

        let syncApiKey = existingUser?.syncApiKey ?? null;

        if (!syncApiKey) {
            const randomPart = crypto.randomBytes(24).toString("hex");
            syncApiKey = `tnt_${randomPart}`;
            await prisma.user.update({
                where: { id: user.id },
                data: {
                    syncApiKey,
                    syncApiKeyCreatedAt: new Date(),
                },
            });
        }

        // Legacy: still generate per-account key for backward compatibility
        // but it is no longer shown in the UI setup flow
        const legacyApiKey = generateApiKey();

        const account = await prisma.tradingAccount.create({
            data: {
                userId: user.id,
                name,
                broker,
                accountNumber: accountNumber || null,
                balance,
                currency,
                platform: platform || "MT4",
                isDefault: isDefault || false,
                apiKey: legacyApiKey,
                color: color || "hsl(var(--primary))",
            },
        });

        revalidatePath("/dashboard/accounts");
        return {
            success: true,
            account: {
                id: account.id,
                name: account.name,
                platform: account.platform,
                apiKey: syncApiKey, // Return user-level sync key for setup instructions
            },
        };
    } catch (error) {
        console.error("Create account error:", error);
        return { error: "Failed to create account" };
    }
}

export async function regenerateAccountKey(id: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    try {
        const apiKey = generateApiKey();

        await prisma.tradingAccount.update({
            where: { id, userId: user.id },
            data: { apiKey },
        });

        // No need to revalidate list for key, but maybe for status if it changes?
        return { success: true, apiKey };
    } catch (error) {
        return { error: "Failed to regenerate key" };
    }
}

export async function updateTradingAccount(
    id: string,
    data: z.infer<typeof accountSchema>
) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const validation = accountSchema.safeParse(data);
    if (!validation.success) return { error: "Invalid data" };

    try {
        if (data.isDefault) {
            await prisma.tradingAccount.updateMany({
                where: { userId: user.id, isDefault: true, id: { not: id } },
                data: { isDefault: false },
            });
        }

        await prisma.tradingAccount.update({
            where: { id, userId: user.id },
            data: validation.data,
        });

        revalidatePath("/dashboard/accounts");
        return { success: true };
    } catch (error) {
        return { error: "Failed to update account" };
    }
}

export async function deleteTradingAccount(id: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    try {
        await prisma.tradingAccount.delete({
            where: { id, userId: user.id },
        });

        revalidatePath("/dashboard/accounts");
        return { success: true };
    } catch (error) {
        return { error: "Failed to delete account" };
    }
}
// ... deleteTradingAccount ...

export async function revealApiKey(id: string) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    try {
        const account = await prisma.tradingAccount.findUnique({
            where: { id, userId: user.id },
            select: { apiKey: true },
        });

        if (!account) return { error: "Account not found" };

        return { success: true, apiKey: account.apiKey };
    } catch (error) {
        return { error: "Failed to reveal key" };
    }
}

export async function requestAccountSync(
    accountId: string,
    range: "TODAY" | "3D" | "1W" | "1M" = "3D"
) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    try {
        await prisma.tradingAccount.update({
            where: { id: accountId, userId: user.id },
            data: { resyncRequest: range },
        });
        return { success: true };
    } catch (error) {
        console.error("Sync request error:", error);
        return { error: "Failed to request sync" };
    }
}
