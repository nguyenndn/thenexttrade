"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import {
  getUserLoyaltyProgress,
  getLoyaltyTiers,
  calculateUserCumulativeLots,
  isLoyaltyEnabled,
} from "@/lib/loyalty/loyalty.server";
import type { ClaimRewardInput, UserLoyaltyProgress, UsdtNetwork } from "@/lib/loyalty/loyalty.types";

/**
 * Fetch loyalty data for current authenticated user
 */
export async function fetchUserLoyaltyDashboard(): Promise<{
  success: boolean;
  data?: UserLoyaltyProgress;
  error?: string;
}> {
  try {
    const user = await getAuthUser();
    if (!user) {
      return { success: false, error: "Please log in to view Loyalty Program." };
    }

    const progress = await getUserLoyaltyProgress(user.id);
    return { success: true, data: progress };
  } catch (error) {
    console.error("[Loyalty Action] fetchUserLoyaltyDashboard error:", error);
    return { success: false, error: "Failed to load loyalty telemetry." };
  }
}

/**
 * Submit a claim request for an achieved milestone tier
 */
export async function submitClaimReward(input: ClaimRewardInput): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const [user, loyaltyEnabled] = await Promise.all([
      getAuthUser(),
      isLoyaltyEnabled(),
    ]);
    if (!user) {
      return { success: false, error: "Unauthorized. Please log in." };
    }
    if (!loyaltyEnabled) {
      return {
        success: false,
        error: "The Partner Loyalty & Rewards program is currently disabled.",
      };
    }

    const { level, note } = input;

    // 1. Resolve payout wallet (from input or from user.settings)
    let finalNetwork = input.network;
    let finalAddress = input.usdtAddress?.trim();

    if (!finalAddress) {
      const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { settings: true },
      });
      const userSettings = (dbUser?.settings as Record<string, any>) || {};
      const saved = userSettings?.payoutWallet as { network?: UsdtNetwork; address?: string } | undefined;

      if (saved?.address) {
        finalNetwork = saved.network || "BEP20";
        finalAddress = saved.address.trim();
      }
    }

    if (!finalAddress || finalAddress.length < 24) {
      return {
        success: false,
        error: "No payout wallet found. Please configure your USDT destination wallet in Settings.",
      };
    }

    const network = finalNetwork || "BEP20";
    const cleanAddress = finalAddress;

    if (network === "TRC20" && !cleanAddress.startsWith("T")) {
      return { success: false, error: "TRC-20 address must begin with 'T'." };
    }
    if ((network === "BEP20" || network === "ERC20") && !cleanAddress.startsWith("0x")) {
      return { success: false, error: `${network} address must begin with '0x'.` };
    }

    // 2. Fetch tier specification
    const tiers = await getLoyaltyTiers();
    const targetTier = tiers.find((t) => t.level === level);
    if (!targetTier) {
      return { success: false, error: `Invalid loyalty milestone tier level: ${level}.` };
    }

    // 3. Verify user's actual cumulative XAUUSD/GOLD lots on the selected REAL IB account
    const lotData = await calculateUserCumulativeLots(user.id, input.accountId);
    if (!lotData.accountId) {
      return {
        success: false,
        error: "Only verified Partner IB REAL accounts qualify for Loyalty rewards.",
      };
    }

    const { totalLots } = lotData;
    if (totalLots < targetTier.requiredLots) {
      return {
        success: false,
        error: `Insufficient XAUUSD/GOLD volume on account #${lotData.accountNumber}. This account has ${totalLots} lots, but Level ${level} requires ${targetTier.requiredLots} lots.`,
      };
    }

    // 4. Check if already claimed or pending
    const existing = await prisma.loyaltyClaim.findUnique({
      where: {
        userId_level: {
          userId: user.id,
          level,
        },
      },
    });

    if (existing) {
      if (existing.status === "PENDING") {
        return {
          success: false,
          error: `Your claim for Level ${level} is currently pending admin review.`,
        };
      }
      if (existing.status === "COMPLETED" || existing.status === "APPROVED") {
        return {
          success: false,
          error: `You have already claimed the Level ${level} milestone reward.`,
        };
      }
    }

    // 5. Create or Re-Submit Claim Record with IB Account & XAUUSD/GOLD metadata
    const claimPayload = {
      tierId: targetTier.id || null,
      tierName: targetTier.name,
      requiredLots: targetTier.requiredLots,
      actualLots: totalLots,
      rewardType: targetTier.rewardType,
      rewardTitle: targetTier.rewardTitle,
      cashAmount: targetTier.cashAmount,
      payoutMethod: "USDT",
      network,
      usdtAddress: cleanAddress,
      payoutDetails: {
        accountId: lotData.accountId,
        accountNumber: lotData.accountNumber,
        broker: lotData.broker,
        accountName: lotData.accountName,
        symbolScope: "XAUUSD/GOLD",
        ...(note ? { note } : {}),
      },
      status: "PENDING" as const,
      adminNotes: null,
      transactionRef: null,
      processedBy: null,
      processedAt: null,
    };

    await prisma.loyaltyClaim.upsert({
      where: {
        userId_level: {
          userId: user.id,
          level: targetTier.level,
        },
      },
      create: {
        userId: user.id,
        level: targetTier.level,
        ...claimPayload,
      },
      update: claimPayload,
    });

    // 6. Notify user of claim receipt
    try {
      await prisma.notification.create({
        data: {
          userId: user.id,
          title: `Milestone Claim Submitted: Level ${targetTier.level} (${targetTier.name})`,
          message: `Your reward request for ${targetTier.rewardTitle} has been submitted for USDT dispatch verification.`,
          type: "FEATURE_UPDATE",
        },
      });
    } catch {
      // Non-critical notification failure
    }

    revalidatePath("/dashboard/loyalty");
    revalidatePath("/admin/loyalty");

    return {
      success: true,
      message: `Successfully requested Level ${targetTier.level} reward (${targetTier.rewardTitle}). Admin will process USDT dispatch shortly!`,
    };
  } catch (error) {
    console.error("[Loyalty Action] submitClaimReward error:", error);
    return { success: false, error: "Failed to submit claim request. Please try again." };
  }
}
