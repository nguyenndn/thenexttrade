"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import type {
  LoyaltyClaimRecord,
  LoyaltyClaimStatus,
  ProcessClaimInput,
  LoyaltyTierItem,
} from "@/lib/loyalty/loyalty.types";
import { DEFAULT_LOYALTY_TIERS } from "@/lib/loyalty/loyalty.server";

async function requireAdmin() {
  const user = await getAuthUser();
  if (!user) throw new Error("Unauthorized");

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
    select: { role: true },
  });

  if (!profile || profile.role !== "ADMIN") {
    throw new Error("Forbidden: Admin access required");
  }
  return user;
}

export interface AdminLoyaltyStats {
  pendingCount: number;
  pendingAmount: number;
  completedCount: number;
  completedAmount: number;
  totalVolumeLots: number;
  topTradersCount: number;
}

/**
 * Fetch all loyalty claims and aggregate KPIs for Admin Hub
 */
export async function fetchAdminLoyaltyData(filters?: {
  status?: LoyaltyClaimStatus | "ALL";
  level?: number;
  page?: number;
  pageSize?: number;
}): Promise<{
  success: boolean;
  data?: {
    claims: LoyaltyClaimRecord[];
    stats: AdminLoyaltyStats;
    total: number;
    tiers: LoyaltyTierItem[];
  };
  error?: string;
}> {
  try {
    await requireAdmin();

    const statusFilter =
      filters?.status && filters.status !== "ALL" ? filters.status : undefined;
    const levelFilter = filters?.level;
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;

    const whereClause: any = {};
    if (statusFilter) whereClause.status = statusFilter;
    if (levelFilter) whereClause.level = levelFilter;

    // Fetch claims with user profile, aggregates, and tiers
    const [claims, total, pendingAgg, completedAgg, topTraders, dbTiers] = await Promise.all([
      prisma.loyaltyClaim.findMany({
        where: whereClause,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              image: true,
            },
          },
        },
        orderBy: { claimedAt: "desc" },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
      prisma.loyaltyClaim.count({ where: whereClause }),
      prisma.loyaltyClaim.aggregate({
        where: { status: "PENDING" },
        _count: { id: true },
        _sum: { cashAmount: true },
      }),
      prisma.loyaltyClaim.aggregate({
        where: { status: "COMPLETED" },
        _count: { id: true },
        _sum: { cashAmount: true, requiredLots: true },
      }),
      prisma.loyaltyClaim.groupBy({
        by: ["userId"],
        where: { level: { gte: 5 } },
      }),
      prisma.loyaltyTier.findMany({
        orderBy: { level: "asc" },
      }),
    ]);

    const formattedClaims: LoyaltyClaimRecord[] = claims.map((c) => ({
      id: c.id,
      userId: c.userId,
      tierId: c.tierId,
      level: c.level,
      tierName: c.tierName,
      requiredLots: c.requiredLots,
      actualLots: c.actualLots,
      rewardType: c.rewardType,
      rewardTitle: c.rewardTitle,
      cashAmount: c.cashAmount,
      payoutMethod: c.payoutMethod,
      network: c.network,
      usdtAddress: c.usdtAddress,
      status: c.status,
      adminNotes: c.adminNotes,
      transactionRef: c.transactionRef,
      claimedAt: c.claimedAt.toISOString(),
      processedAt: c.processedAt ? c.processedAt.toISOString() : null,
      processedBy: c.processedBy,
      user: c.user,
    }));

    const stats: AdminLoyaltyStats = {
      pendingCount: pendingAgg._count.id || 0,
      pendingAmount: pendingAgg._sum.cashAmount || 0,
      completedCount: completedAgg._count.id || 0,
      completedAmount: completedAgg._sum.cashAmount || 0,
      totalVolumeLots: completedAgg._sum.requiredLots || 0,
      topTradersCount: topTraders.length,
    };

    const tiers: LoyaltyTierItem[] =
      dbTiers.length > 0
        ? dbTiers.map((t) => ({
            id: t.id,
            level: t.level,
            name: t.name,
            requiredLots: t.requiredLots,
            rewardType: t.rewardType,
            rewardTitle: t.rewardTitle,
            cashAmount: t.cashAmount ?? 0,
            perkDescription: t.perkDescription ?? "",
            icon: t.icon,
            badgeColor: t.badgeColor,
            order: t.order,
            isActive: t.isActive,
          }))
        : DEFAULT_LOYALTY_TIERS;

    return {
      success: true,
      data: {
        claims: formattedClaims,
        stats,
        total,
        tiers,
      },
    };
  } catch (error) {
    console.error("[Admin Loyalty] fetchAdminLoyaltyData error:", error);
    return { success: false, error: (error as Error).message || "Failed to fetch admin claims" };
  }
}

/**
 * Process a loyalty claim (APPROVE, COMPLETE with TxID, or REJECT with reason)
 */
export async function processAdminClaim(input: ProcessClaimInput): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const adminUser = await requireAdmin();
    const { claimId, action, transactionRef, adminNotes } = input;

    const existing = await prisma.loyaltyClaim.findUnique({
      where: { id: claimId },
      include: { user: true },
    });

    if (!existing) {
      return { success: false, error: "Loyalty claim record not found." };
    }

    let newStatus: LoyaltyClaimStatus = "PENDING";
    if (action === "APPROVE") newStatus = "APPROVED";
    if (action === "COMPLETE") newStatus = "COMPLETED";
    if (action === "REJECT") newStatus = "REJECTED";

    const updated = await prisma.loyaltyClaim.update({
      where: { id: claimId },
      data: {
        status: newStatus,
        transactionRef: transactionRef ? transactionRef.trim() : existing.transactionRef,
        adminNotes: adminNotes ? adminNotes.trim() : existing.adminNotes,
        processedAt: new Date(),
        processedBy: adminUser.id,
      },
    });

    // Notify user of payout disposition
    try {
      let notifyTitle = `Reward Claim Updated: Level ${updated.level}`;
      let notifyMsg = `Your milestone claim has been updated to ${newStatus}.`;

      if (action === "COMPLETE") {
        notifyTitle = `USDT Dispatched! Milestone Level ${updated.level} (${updated.tierName})`;
        notifyMsg = `Congratulations! Your reward of ${updated.rewardTitle} has been transferred. Transaction Ref: ${updated.transactionRef || "Confirmed by Admin"}.`;
      } else if (action === "REJECT") {
        notifyTitle = `Milestone Claim Rejected: Level ${updated.level}`;
        notifyMsg = `Your claim was rejected. Note: ${adminNotes || "Verification criteria not met."}`;
      }

      await prisma.notification.create({
        data: {
          userId: updated.userId,
          title: notifyTitle,
          message: notifyMsg,
          type: "FEATURE_UPDATE",
        },
      });
    } catch {
      // Non-critical notification failure
    }

    revalidatePath("/admin/loyalty");
    revalidatePath("/dashboard/loyalty");

    return {
      success: true,
      message: `Claim successfully marked as ${newStatus}.`,
    };
  } catch (error) {
    console.error("[Admin Loyalty] processAdminClaim error:", error);
    return { success: false, error: (error as Error).message || "Failed to process claim" };
  }
}
