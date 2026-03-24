"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { generateApiKey } from "@/lib/utils/api-key";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const accountSchema = z.object({
    name: z.string().min(1).max(50),
    broker: z.string().optional(),
    balance: z.number().min(0),
    currency: z.string().length(3),
    platform: z.string().optional(),
    isDefault: z.boolean().optional(),
    color: z.string().optional(),
});

export async function getTradingAccounts(page = 1, limit = 12) {
    const user = await getAuthUser();
    if (!user) return { accounts: [], meta: { total: 0, page, limit, totalPages: 0 } };

    const skip = (page - 1) * limit;

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
                // Don't expose full API key
                apiKey: false,
                currency: true,
                isDefault: true,
            },
            skip,
            take: limit,
        }),
        prisma.tradingAccount.count({ where: { userId: user.id } })
    ]);

    // Calculate connection status based on heartbeat
    const accountsWithStatus = accounts.map((acc) => ({
        ...acc,
        platform: acc.platform || "MetaTrader 4",
        // Convert dates to strings for serialization
        lastHeartbeat: acc.lastHeartbeat ? acc.lastHeartbeat.toISOString() : null,
        lastSync: acc.lastSync ? acc.lastSync.toISOString() : null,
        createdAt: acc.createdAt.toISOString(),
        isConnected: acc.lastHeartbeat
            ? Date.now() - new Date(acc.lastHeartbeat).getTime() < 10 * 60 * 1000 // 10 min
            : false,
    }));

    return {
        accounts: accountsWithStatus,
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit)
        }
    };
}

export async function createTradingAccount(data: z.infer<typeof accountSchema>) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const validation = accountSchema.safeParse(data);
    if (!validation.success) return { error: "Invalid data" };

    const { name, broker, balance, currency, platform, isDefault, color } = validation.data;

    try {
        // Handle Default Account Logic
        if (isDefault) {
            await prisma.tradingAccount.updateMany({
                where: { userId: user.id, isDefault: true },
                data: { isDefault: false }
            });
        }

        const apiKey = generateApiKey();

        const account = await prisma.tradingAccount.create({
            data: {
                userId: user.id,
                name,
                broker,
                balance,
                currency,
                platform: platform || "MT4",
                isDefault: isDefault || false,
                apiKey,
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
                apiKey: account.apiKey,
            }
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
            data: { apiKey }
        });

        // No need to revalidate list for key, but maybe for status if it changes?
        return { success: true, apiKey };
    } catch (error) {
        return { error: "Failed to regenerate key" };
    }
}

export async function updateTradingAccount(id: string, data: z.infer<typeof accountSchema>) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const validation = accountSchema.safeParse(data);
    if (!validation.success) return { error: "Invalid data" };

    try {
        if (data.isDefault) {
            await prisma.tradingAccount.updateMany({
                where: { userId: user.id, isDefault: true, id: { not: id } },
                data: { isDefault: false }
            });
        }

        await prisma.tradingAccount.update({
            where: { id, userId: user.id },
            data: validation.data
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
            where: { id, userId: user.id }
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
            select: { apiKey: true }
        });

        if (!account) return { error: "Account not found" };

        return { success: true, apiKey: account.apiKey };
    } catch (error) {
        return { error: "Failed to reveal key" };
    }
}
