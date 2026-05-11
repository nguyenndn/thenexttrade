"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";

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

  await prisma.profile.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      mainTradingAccountId: accountId,
    },
    update: {
      mainTradingAccountId: accountId,
    },
  });

  revalidatePath("/dashboard/accounts");
  revalidatePath("/dashboard");
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
