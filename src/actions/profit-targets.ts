"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import { ActionResponse, TargetType, UpdateProfitTargetsInput, profitTargetsInputSchema } from "@/lib/profit-target/types";
import { aggregateAccountTargets } from "@/lib/profit-target/target-calculator";
import { normalizeCurrencyCode } from "@/lib/utils/cent-account";

export async function updateAccountProfitTargets(
  accountId: string,
  input: UpdateProfitTargetsInput
): Promise<ActionResponse<{ id: string; weeklyTarget: number | null; monthlyTarget: number | null }>> {
  const user = await getAuthUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!accountId || typeof accountId !== "string") {
    return { success: false, error: "Account ID is required" };
  }

  const parsed = profitTargetsInputSchema.safeParse(input);
  if (!parsed.success) {
    const errorMsg = parsed.error.issues[0]?.message || "Invalid target parameters";
    return { success: false, error: errorMsg };
  }

  try {
    const account = await prisma.tradingAccount.findFirst({
      where: { id: accountId, userId: user.id },
      select: { id: true },
    });

    if (!account) {
      return { success: false, error: "Account not found or access denied" };
    }

    const updated = await prisma.tradingAccount.update({
      where: { id: accountId },
      data: {
        weeklyTarget: parsed.data.weeklyTarget !== undefined ? parsed.data.weeklyTarget : null,
        weeklyTargetType: parsed.data.weeklyTargetType,
        monthlyTarget: parsed.data.monthlyTarget !== undefined ? parsed.data.monthlyTarget : null,
        monthlyTargetType: parsed.data.monthlyTargetType,
        ...(parsed.data.initialBalance !== undefined
          ? { initialBalance: parsed.data.initialBalance }
          : {}),
      },
      select: {
        id: true,
        weeklyTarget: true,
        monthlyTarget: true,
      },
    });

    revalidatePath("/dashboard");
    revalidatePath("/dashboard/analytics");
    revalidatePath("/dashboard/reports/weekly");
    revalidatePath("/dashboard/reports/monthly");
    revalidatePath("/dashboard/accounts");

    return {
      success: true,
      data: {
        id: updated.id,
        weeklyTarget: updated.weeklyTarget,
        monthlyTarget: updated.monthlyTarget,
      },
    };
  } catch (error) {
    console.error("updateAccountProfitTargets error:", error);
    return { success: false, error: "Failed to update profit targets" };
  }
}

export async function getAccountProfitTargets(
  accountId: string
): Promise<
  ActionResponse<{
    weeklyTarget: number | null;
    weeklyTargetType: TargetType;
    monthlyTarget: number | null;
    monthlyTargetType: TargetType;
    initialBalance: number | null;
    balance: number;
    currency: string;
  }>
> {
  const user = await getAuthUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  if (!accountId || typeof accountId !== "string") {
    return { success: false, error: "Account ID is required" };
  }

  try {
    const account = await prisma.tradingAccount.findFirst({
      where: { id: accountId, userId: user.id },
      select: {
        weeklyTarget: true,
        weeklyTargetType: true,
        monthlyTarget: true,
        monthlyTargetType: true,
        initialBalance: true,
        balance: true,
        currency: true,
        server: true,
      },
    });

    if (!account) {
      return { success: false, error: "Account not found or access denied" };
    }

    return {
      success: true,
      data: {
        weeklyTarget: account.weeklyTarget,
        weeklyTargetType: (account.weeklyTargetType as TargetType) || "USD",
        monthlyTarget: account.monthlyTarget,
        monthlyTargetType: (account.monthlyTargetType as TargetType) || "USD",
        initialBalance: account.initialBalance,
        balance: account.balance,
        currency: normalizeCurrencyCode(account.currency, account.server),
      },
    };
  } catch (error) {
    console.error("getAccountProfitTargets error:", error);
    return { success: false, error: "Failed to fetch profit targets" };
  }
}

export async function getAllAccountsProfitTargets(): Promise<
  ActionResponse<{
    weeklyTargetUsd: number;
    monthlyTargetUsd: number;
    accounts: Array<{
      id: string;
      name: string;
      weeklyTarget: number | null;
      weeklyTargetType: TargetType;
      monthlyTarget: number | null;
      monthlyTargetType: TargetType;
      initialBalance: number | null;
      balance: number;
      currency: string;
    }>;
  }>
> {
  const user = await getAuthUser();
  if (!user) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const accounts = await prisma.tradingAccount.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        status: true,
        weeklyTarget: true,
        weeklyTargetType: true,
        monthlyTarget: true,
        monthlyTargetType: true,
        initialBalance: true,
        balance: true,
        currency: true,
        server: true,
      },
      orderBy: [{ isDefault: "desc" }, { createdAt: "asc" }],
    });

    const { weeklyTargetUsd, monthlyTargetUsd } = aggregateAccountTargets(
      accounts.map((a) => ({
        balance: a.balance,
        initialBalance: a.initialBalance,
        weeklyTarget: a.weeklyTarget,
        weeklyTargetType: (a.weeklyTargetType as TargetType) || "USD",
        monthlyTarget: a.monthlyTarget,
        monthlyTargetType: (a.monthlyTargetType as TargetType) || "USD",
        status: a.status,
      }))
    );

    return {
      success: true,
      data: {
        weeklyTargetUsd,
        monthlyTargetUsd,
        accounts: accounts.map((a) => ({
          id: a.id,
          name: a.name,
          weeklyTarget: a.weeklyTarget,
          weeklyTargetType: (a.weeklyTargetType as TargetType) || "USD",
          monthlyTarget: a.monthlyTarget,
          monthlyTargetType: (a.monthlyTargetType as TargetType) || "USD",
          initialBalance: a.initialBalance,
          balance: a.balance,
          currency: normalizeCurrencyCode(a.currency, a.server),
        })),
      },
    };
  } catch (error) {
    console.error("getAllAccountsProfitTargets error:", error);
    return { success: false, error: "Failed to fetch aggregated profit targets" };
  }
}
