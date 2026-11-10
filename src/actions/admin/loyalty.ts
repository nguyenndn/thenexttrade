"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import type {
  LoyaltyClaimRecord,
  LoyaltyClaimStatus,
  LoyaltyRewardType,
  ProcessClaimInput,
  LoyaltyTierItem,
} from "@/lib/loyalty/loyalty.types";
import {
  DEFAULT_LOYALTY_TIERS,
  ensureDefaultLoyaltyTiersSeeded,
  isLoyaltyEnabled,
} from "@/lib/loyalty/loyalty.server";
import {
  sendEmailWithDetails,
  buildUnifiedEmailHtml,
  EMAIL_GOLD_COLORS,
  GOLD_CTA_BUTTON_STYLE,
} from "@/lib/services/email.service";

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
    loyaltyEnabled: boolean;
  };
  error?: string;
}> {
  try {
    await requireAdmin();
    await ensureDefaultLoyaltyTiersSeeded();

    const statusFilter =
      filters?.status && filters.status !== "ALL" ? filters.status : undefined;
    const levelFilter = filters?.level;
    const page = filters?.page || 1;
    const pageSize = filters?.pageSize || 20;

    const whereClause: Record<string, unknown> = {};
    if (statusFilter) whereClause.status = statusFilter;
    if (levelFilter) whereClause.level = levelFilter;

    // Fetch claims with user profile, aggregates, and tiers
    const [claims, total, pendingAgg, completedAgg, topTraders, dbTiers, loyaltyEnabled] = await Promise.all([
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
        orderBy: [{ level: "asc" }],
      }),
      isLoyaltyEnabled(),
    ]);

    const formattedClaims: LoyaltyClaimRecord[] = claims.map((c) => {
      const details = (c.payoutDetails as Record<string, unknown> | null) || {};
      return {
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
        accountId: typeof details.accountId === "string" ? details.accountId : null,
        accountNumber: typeof details.accountNumber === "string" ? details.accountNumber : null,
        broker: typeof details.broker === "string" ? details.broker : null,
        accountName: typeof details.accountName === "string" ? details.accountName : null,
        status: c.status,
        adminNotes: c.adminNotes,
        transactionRef: c.transactionRef,
        claimedAt: c.claimedAt.toISOString(),
        processedAt: c.processedAt ? c.processedAt.toISOString() : null,
        processedBy: c.processedBy,
        user: c.user,
      };
    });

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
        loyaltyEnabled,
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
          priority: "HIGH",
          link: "/dashboard/loyalty",
        },
      });
    } catch {
      // Non-critical notification failure
    }

    // Dispatch email notification to the trader (non-blocking)
    if (existing.user?.email) {
      try {
        const appUrl =
          process.env.NEXT_PUBLIC_APP_URL || "https://thenexttrade.vercel.app";
        const userName = existing.user.name || "Trader";
        const isCompleted = action === "COMPLETE";
        const isRejected = action === "REJECT";
        const emailSubject = isCompleted
          ? `USDT Dispatched! Milestone Level ${updated.level} (${updated.tierName})`
          : isRejected
            ? `Update on your Loyalty Claim: Level ${updated.level}`
            : `Loyalty Claim Approved: Level ${updated.level} (${updated.tierName})`;

        const statusBadgeColor = isCompleted
          ? EMAIL_GOLD_COLORS.primaryGreen
          : isRejected
            ? EMAIL_GOLD_COLORS.dangerRed
            : EMAIL_GOLD_COLORS.brandGoldDark;

        const bodyHtml = `
          <div style="padding: 6px 0;">
            <div style="text-align: center; margin-bottom: 20px;">
              <h2 style="margin: 0 0 6px 0; font-size: 22px; font-weight: 800; color: #111827;">${emailSubject}</h2>
              <p style="margin: 0; font-size: 14px; color: #6B7280;">Partner Loyalty &amp; Rewards Program</p>
            </div>
            <p style="font-size: 15px; color: #374151; line-height: 1.6; margin-bottom: 20px;">
              Hi <strong>${userName}</strong>, your milestone reward request for <strong>Level ${updated.level} — ${updated.tierName}</strong> (${updated.rewardTitle}) has been updated to <strong style="color: ${statusBadgeColor};">${newStatus}</strong>.
            </p>
            <div style="background-color: #F9FAFB; border: 1px solid #E5E7EB; border-radius: 12px; padding: 18px 20px; margin: 20px 0;">
              <table role="presentation" width="100%" border="0" cellspacing="0" cellpadding="0" style="font-size: 13px; color: #374151;">
                <tr>
                  <td style="padding: 6px 0; color: #6B7280;">Reward:</td>
                  <td align="right" style="padding: 6px 0; font-weight: 700; color: #111827;">${updated.rewardTitle}</td>
                </tr>
                <tr>
                  <td style="padding: 6px 0; color: #6B7280;">Destination Wallet (${updated.network || "USDT"}):</td>
                  <td align="right" style="padding: 6px 0; font-family: monospace; color: #111827;">${updated.usdtAddress || "N/A"}</td>
                </tr>
                ${
                  updated.transactionRef
                    ? `<tr>
                        <td style="padding: 6px 0; color: #6B7280;">Transaction Ref (TxID):</td>
                        <td align="right" style="padding: 6px 0; font-family: monospace; font-weight: 700; color: ${EMAIL_GOLD_COLORS.primaryGreen};">${updated.transactionRef}</td>
                      </tr>`
                    : ""
                }
                ${
                  updated.adminNotes
                    ? `<tr>
                        <td style="padding: 6px 0; color: #6B7280;">Admin Note:</td>
                        <td align="right" style="padding: 6px 0; color: #111827;">${updated.adminNotes}</td>
                      </tr>`
                    : ""
                }
              </table>
            </div>
            <div style="text-align: center; margin: 28px 0 12px 0;">
              <a href="${appUrl}/dashboard/loyalty" style="${GOLD_CTA_BUTTON_STYLE}">
                View Loyalty Dashboard →
              </a>
            </div>
          </div>
        `;

        await sendEmailWithDetails({
          to: existing.user.email,
          subject: emailSubject,
          html: buildUnifiedEmailHtml({
            subject: emailSubject,
            preheader: `Your Level ${updated.level} Loyalty claim status is now ${newStatus}.`,
            bodyHtml,
            appUrl,
          }),
        });
      } catch (emailErr) {
        console.warn("[Admin Loyalty] Email notification failed:", emailErr);
      }
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

/**
 * Toggle Loyalty & Rewards Program ON/OFF (shows/hides sidebar menu + guards /dashboard/loyalty)
 */
export async function toggleLoyaltyFeature(enabled: boolean): Promise<{
  success: boolean;
  enabled?: boolean;
  error?: string;
}> {
  try {
    await requireAdmin();

    await prisma.systemSetting.upsert({
      where: { key: "feature_loyalty" },
      create: { key: "feature_loyalty", value: { enabled } },
      update: { value: { enabled } },
    });

    revalidatePath("/dashboard", "layout");
    revalidatePath("/dashboard/loyalty");
    revalidatePath("/admin/loyalty");

    return { success: true, enabled };
  } catch (error) {
    console.error("[Admin Loyalty] toggleLoyaltyFeature error:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to toggle Loyalty feature",
    };
  }
}

export interface UpsertLoyaltyTierInput {
  id?: string;
  level: number;
  name: string;
  requiredLots: number;
  rewardType: LoyaltyRewardType;
  rewardTitle: string;
  cashAmount: number;
  perkDescription: string;
  icon: string;
  badgeColor: string;
  order?: number;
  isActive: boolean;
}

/**
 * Create or Update a Loyalty Milestone Tier (Level)
 */
export async function upsertLoyaltyTier(input: UpsertLoyaltyTierInput): Promise<{
  success: boolean;
  tiers?: LoyaltyTierItem[];
  error?: string;
}> {
  try {
    await requireAdmin();
    await ensureDefaultLoyaltyTiersSeeded();

    const level = Math.floor(Number(input.level));
    const name = input.name?.trim();
    const requiredLots = Number(input.requiredLots);
    const rewardTitle = input.rewardTitle?.trim();
    const cashAmount = Math.max(0, Number(input.cashAmount) || 0);
    const perkDescription = input.perkDescription?.trim() || "";
    const icon = input.icon?.trim() || "Shield";
    const badgeColor = input.badgeColor?.trim() || "#EAB308";
    const order = input.order ? Math.floor(Number(input.order)) : level;
    const isActive = Boolean(input.isActive);

    if (!level || level < 1) {
      return { success: false, error: "Level must be a positive integer (1 or higher)." };
    }
    if (!name) {
      return { success: false, error: "Level name is required." };
    }
    if (isNaN(requiredLots) || requiredLots <= 0) {
      return { success: false, error: "Required XAUUSD/GOLD lots must be greater than 0." };
    }
    if (!rewardTitle) {
      return { success: false, error: "Reward headline is required." };
    }

    // Check duplicate level if creating or changing level
    const existingByLevel = await prisma.loyaltyTier.findUnique({
      where: { level },
    });

    if (input.id) {
      if (existingByLevel && existingByLevel.id !== input.id) {
        return {
          success: false,
          error: `Level ${level} already exists (${existingByLevel.name}). Choose another level number.`,
        };
      }
      await prisma.loyaltyTier.update({
        where: { id: input.id },
        data: {
          level,
          name,
          requiredLots,
          rewardType: input.rewardType,
          rewardTitle,
          cashAmount,
          perkDescription,
          icon,
          badgeColor,
          order,
          isActive,
        },
      });
    } else if (existingByLevel) {
      return {
        success: false,
        error: `Level ${level} already exists (${existingByLevel.name}). Edit that level or choose a new level number.`,
      };
    } else {
      await prisma.loyaltyTier.create({
        data: {
          level,
          name,
          requiredLots,
          rewardType: input.rewardType,
          rewardTitle,
          cashAmount,
          perkDescription,
          icon,
          badgeColor,
          order,
          isActive,
        },
      });
    }

    const dbTiers = await prisma.loyaltyTier.findMany({
      orderBy: [{ level: "asc" }],
    });

    const tiers: LoyaltyTierItem[] = dbTiers.map((t) => ({
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
    }));

    revalidatePath("/admin/loyalty");
    revalidatePath("/dashboard/loyalty");

    return { success: true, tiers };
  } catch (error) {
    console.error("[Admin Loyalty] upsertLoyaltyTier error:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to save loyalty tier",
    };
  }
}

/**
 * Toggle an individual Loyalty Tier ON/OFF (isActive)
 */
export async function toggleLoyaltyTierActive(
  level: number,
  isActive: boolean,
  id?: string
): Promise<{
  success: boolean;
  tiers?: LoyaltyTierItem[];
  error?: string;
}> {
  try {
    await requireAdmin();
    await ensureDefaultLoyaltyTiersSeeded();

    if (id) {
      await prisma.loyaltyTier.update({
        where: { id },
        data: { isActive },
      });
    } else {
      await prisma.loyaltyTier.update({
        where: { level },
        data: { isActive },
      });
    }

    const dbTiers = await prisma.loyaltyTier.findMany({
      orderBy: [{ level: "asc" }],
    });

    const tiers: LoyaltyTierItem[] = dbTiers.map((t) => ({
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
    }));

    revalidatePath("/admin/loyalty");
    revalidatePath("/dashboard/loyalty");

    return { success: true, tiers };
  } catch (error) {
    console.error("[Admin Loyalty] toggleLoyaltyTierActive error:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to toggle tier status",
    };
  }
}

/**
 * Delete a Loyalty Milestone Tier
 */
export async function deleteLoyaltyTier(
  level: number,
  id?: string
): Promise<{
  success: boolean;
  tiers?: LoyaltyTierItem[];
  error?: string;
}> {
  try {
    await requireAdmin();
    await ensureDefaultLoyaltyTiersSeeded();

    if (id) {
      await prisma.loyaltyTier.delete({ where: { id } });
    } else {
      await prisma.loyaltyTier.delete({ where: { level } });
    }

    const dbTiers = await prisma.loyaltyTier.findMany({
      orderBy: [{ level: "asc" }],
    });

    const tiers: LoyaltyTierItem[] = dbTiers.map((t) => ({
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
    }));

    revalidatePath("/admin/loyalty");
    revalidatePath("/dashboard/loyalty");

    return { success: true, tiers };
  } catch (error) {
    console.error("[Admin Loyalty] deleteLoyaltyTier error:", error);
    return {
      success: false,
      error: (error as Error).message || "Failed to delete loyalty tier",
    };
  }
}
