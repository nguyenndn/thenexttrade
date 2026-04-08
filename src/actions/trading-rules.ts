"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const tradingRulesSchema = z.object({
    maxDailyLoss: z.number().min(0).nullable(),
    maxDailyTrades: z.number().int().min(0).nullable(),
    maxRiskPercent: z.number().min(0).max(100).nullable(),
    cooldownAfterLosses: z.number().int().min(0).nullable(),
});

export type TradingRulesInput = z.infer<typeof tradingRulesSchema>;

export async function updateTradingRules(accountId: string, data: TradingRulesInput) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const validation = tradingRulesSchema.safeParse(data);
    if (!validation.success) return { error: "Invalid data" };

    try {
        await prisma.tradingAccount.update({
            where: { id: accountId, userId: user.id },
            data: {
                maxDailyLoss: validation.data.maxDailyLoss,
                maxDailyTrades: validation.data.maxDailyTrades,
                maxRiskPercent: validation.data.maxRiskPercent,
                cooldownAfterLosses: validation.data.cooldownAfterLosses,
            },
        });

        revalidatePath("/dashboard");
        revalidatePath("/dashboard/accounts");
        return { success: true };
    } catch (error) {
        console.error("Update trading rules error:", error);
        return { error: "Failed to update trading rules" };
    }
}

export async function getTradingRules(accountId: string) {
    const user = await getAuthUser();
    if (!user) return null;

    const account = await prisma.tradingAccount.findUnique({
        where: { id: accountId, userId: user.id },
        select: {
            maxDailyLoss: true,
            maxDailyTrades: true,
            maxRiskPercent: true,
            cooldownAfterLosses: true,
        },
    });

    return account;
}
