"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

/**
 * Set a trading account as the user's main account.
 * The main account is used for dashboard default redirect and widget status.
 * Pass null to clear the main account.
 */
export async function setMainAccount(accountId: string | null) {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    // If setting an account, verify it belongs to this user
    if (accountId) {
        const account = await prisma.tradingAccount.findFirst({
            where: { id: accountId, userId: user.id },
            select: { id: true },
        });
        if (!account) return { error: "Account not found" };
    }

    await prisma.$transaction([
        prisma.profile.upsert({
            where: { userId: user.id },
            create: {
                userId: user.id,
                mainTradingAccountId: accountId,
            },
            update: {
                mainTradingAccountId: accountId,
            },
        }),
        prisma.tradingAccount.updateMany({
            where: { userId: user.id, isDefault: true },
            data: { isDefault: false },
        }),
        ...(accountId
            ? [
                  prisma.tradingAccount.update({
                      where: { id: accountId, userId: user.id },
                      data: { isDefault: true },
                  }),
              ]
            : []),
    ]);

    try {
        const cookieStore = await cookies();
        if (accountId) {
            cookieStore.set("last_account_id", accountId, {
                path: "/",
                maxAge: 31536000,
                sameSite: "lax",
            });
        } else {
            cookieStore.delete("last_account_id");
        }
    } catch {
        // Ignore cookie write errors if called outside action context
    }

    revalidatePath("/dashboard/accounts");
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/journal");
    revalidatePath("/dashboard/analytics");
    revalidatePath("/dashboard/sessions");
    revalidatePath("/dashboard/intelligence");
    return { success: true };
}

/**
 * Get the user's main trading account ID.
 */
export async function getMainAccountId(): Promise<string | null> {
    const user = await getAuthUser();
    if (!user) return null;

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { mainTradingAccountId: true },
    });

    return profile?.mainTradingAccountId ?? null;
}

/**
 * Unified default account resolution across all User Dashboard pages:
 * Priority 1: User's Main Account set in /dashboard/accounts (profile.mainTradingAccountId)
 * Priority 2: Account marked isDefault = true
 * Priority 3: Valid last_account_id cookie
 * Priority 4: Most recently created account
 */
export async function resolveDefaultAccountId(
    userId: string,
    cookieAccountId?: string
): Promise<string | undefined> {
    const [profileMain, userAccounts] = await Promise.all([
        prisma.profile.findUnique({
            where: { userId },
            select: { mainTradingAccountId: true },
        }),
        prisma.tradingAccount.findMany({
            where: { userId },
            select: { id: true, isDefault: true },
            orderBy: [{ isDefault: "desc" }, { createdAt: "desc" }],
        }),
    ]);

    if (userAccounts.length === 0) return undefined;

    // Priority 1: Profile Main Account (set in /dashboard/accounts)
    if (
        profileMain?.mainTradingAccountId &&
        userAccounts.some((a) => a.id === profileMain.mainTradingAccountId)
    ) {
        return profileMain.mainTradingAccountId;
    }

    // Priority 2: Account with isDefault = true
    const defaultAcc = userAccounts.find((a) => a.isDefault);
    if (defaultAcc) {
        return defaultAcc.id;
    }

    // Priority 3: Cookie last_account_id
    if (
        cookieAccountId &&
        cookieAccountId !== "all" &&
        userAccounts.some((a) => a.id === cookieAccountId)
    ) {
        return cookieAccountId;
    }

    // Priority 4: Most recent account
    return userAccounts[0].id;
}
