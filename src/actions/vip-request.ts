"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import { vipRequestSchema } from "@/lib/validations/vip-request";
import { verifyTurnstile } from "@/lib/turnstile";
import type { VipRequestStatus } from "@prisma/client";
import { NotificationType, NotificationPriority } from "@prisma/client";
import { maskAccountNumber, findOrMatchTradingAccount } from "@/lib/pro-access";

// ============================================================================
// USER ACTIONS
// ============================================================================

export async function submitVipRequest(formData: FormData) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  // Verify Turnstile
  const turnstileToken = formData.get('cf-turnstile-response') as string;
  const turnstileResult = await verifyTurnstile(turnstileToken);
  if (!turnstileResult.success) {
    return { error: turnstileResult.error || 'Verification failed' };
  }

  // Parse form data
  const raw = {
    broker: formData.get("broker") as string,
    accountNumber: formData.get("accountNumber") as string,
    balance: formData.get("balance") as string,
    email: formData.get("email") as string,
    telegramId: formData.get("telegramId") as string,
    fullName: (formData.get("fullName") as string) || undefined,
    country: (formData.get("country") as string) || undefined,
    screenshotUrl: (formData.get("screenshotUrl") as string) || undefined,
  };

  // Validate
  const parsed = vipRequestSchema.safeParse(raw);
  if (!parsed.success) {
    const firstError = parsed.error.issues[0];
    return { error: firstError?.message || "Invalid input" };
  }

  // Try to match a TradingAccount for account-scoped linking
  const tradingAccountId = await findOrMatchTradingAccount(
    user.id,
    parsed.data.broker,
    parsed.data.accountNumber
  );

  // Check for existing pending request for same account
  const existingRequest = await prisma.vipRequest.findFirst({
    where: {
      userId: user.id,
      status: "PENDING",
      ...(tradingAccountId ? { tradingAccountId } : {
        broker: parsed.data.broker,
        accountNumber: parsed.data.accountNumber,
      }),
    },
  });

  if (existingRequest) {
    return { error: "You already have a pending VIP request for this account. Please wait for review." };
  }

  // Create request
  await prisma.vipRequest.create({
    data: {
      userId: user.id,
      tradingAccountId,
      broker: parsed.data.broker,
      accountNumber: parsed.data.accountNumber,
      balance: parsed.data.balance,
      email: parsed.data.email,
      telegramId: parsed.data.telegramId,
      fullName: parsed.data.fullName || null,
      country: parsed.data.country || null,
      screenshotUrl: parsed.data.screenshotUrl || null,
    },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getMyVipRequest(tradingAccountId?: string) {
  const user = await getAuthUser();
  if (!user) return null;

  const request = await prisma.vipRequest.findFirst({
    where: {
      userId: user.id,
      // Scope to specific account if provided, otherwise get latest non-orphaned
      ...(tradingAccountId
        ? { tradingAccountId }
        : { tradingAccountId: { not: null } }),
    },
    orderBy: { createdAt: "desc" },
  });

  return request;
}

// VIP Telegram group invite link (hardcoded)
const VIP_TELEGRAM_URL = "https://t.me/+YourVipGroupLink"; // TODO: Replace with actual VIP group invite link

export async function getVipLink() {
  const user = await getAuthUser();
  if (!user) return null;

  // Check if user has an approved VIP request
  const approvedRequest = await prisma.vipRequest.findFirst({
    where: {
      userId: user.id,
      status: "APPROVED",
    },
  });

  if (!approvedRequest) return null;

  return VIP_TELEGRAM_URL;
}

// ============================================================================
// ADMIN ACTIONS
// ============================================================================

export async function getVipRequests(filter?: {
  status?: VipRequestStatus;
  broker?: string;
  page?: number;
  limit?: number;
}) {
  const user = await getAuthUser();
  if (!user) return { requests: [], total: 0 };

  // Check admin role
  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });
  if (profile?.role !== "ADMIN") return { requests: [], total: 0 };

  const page = filter?.page || 1;
  const limit = filter?.limit || 20;
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = {};
  if (filter?.status) where.status = filter.status;
  if (filter?.broker) where.broker = filter.broker;

  const [requests, total] = await Promise.all([
    prisma.vipRequest.findMany({
      where,
      include: {
        user: {
          select: { name: true, email: true, image: true },
        },
        tradingAccount: {
          select: { id: true, name: true, broker: true, accountNumber: true, status: true },
        },
      },
      orderBy: { createdAt: "desc" },
      skip,
      take: limit,
    }),
    prisma.vipRequest.count({ where }),
  ]);

  return { requests, total };
}

export async function getVipRequestStats() {
  const user = await getAuthUser();
  if (!user) return null;

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });
  if (profile?.role !== "ADMIN") return null;

  const [total, pending, approved, rejected] = await Promise.all([
    prisma.vipRequest.count(),
    prisma.vipRequest.count({ where: { status: "PENDING" } }),
    prisma.vipRequest.count({ where: { status: "APPROVED" } }),
    prisma.vipRequest.count({ where: { status: "REJECTED" } }),
  ]);

  return { total, pending, approved, rejected };
}

/**
 * Approve a VIP request — creates account-scoped ProEntitlement.
 */
export async function approveVipRequest(requestId: string) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });
  if (profile?.role !== "ADMIN") return { error: "Forbidden" };

  const vipRequest = await prisma.vipRequest.update({
    where: { id: requestId },
    data: {
      status: "APPROVED",
      reviewedBy: user.id,
      reviewedAt: new Date(),
    },
  });

  // If no tradingAccountId on the request, try to match now
  let accountId = vipRequest.tradingAccountId;
  if (!accountId) {
    accountId = await findOrMatchTradingAccount(
      vipRequest.userId,
      vipRequest.broker,
      vipRequest.accountNumber
    );
    // Update VipRequest with linked account
    if (accountId) {
      await prisma.vipRequest.update({
        where: { id: requestId },
        data: { tradingAccountId: accountId },
      });
    }
  }

  // Create or update ProEntitlement (account-scoped)
  if (accountId) {
    await prisma.proEntitlement.upsert({
      where: { tradingAccountId: accountId },
      create: {
        userId: vipRequest.userId,
        tradingAccountId: accountId,
        status: "ACTIVE",
        source: "IB_VERIFIED",
        vipRequestId: requestId,
        broker: vipRequest.broker,
        accountNumber: vipRequest.accountNumber,
        accountNumberMasked: maskAccountNumber(vipRequest.accountNumber),
        startsAt: new Date(),
        lastReviewedAt: new Date(),
        reviewedBy: user.id,
      },
      update: {
        status: "ACTIVE",
        source: "IB_VERIFIED",
        vipRequestId: requestId,
        broker: vipRequest.broker,
        accountNumber: vipRequest.accountNumber,
        accountNumberMasked: maskAccountNumber(vipRequest.accountNumber),
        startsAt: new Date(),
        expiresAt: null,
        lastReviewedAt: new Date(),
        reviewedBy: user.id,
      },
    });
  } else {
    // Fallback: create user-level entitlement (legacy, no account linked)
    await prisma.proEntitlement.create({
      data: {
        userId: vipRequest.userId,
        status: "ACTIVE",
        source: "IB_VERIFIED",
        vipRequestId: requestId,
        broker: vipRequest.broker,
        accountNumber: vipRequest.accountNumber,
        accountNumberMasked: maskAccountNumber(vipRequest.accountNumber),
        startsAt: new Date(),
        lastReviewedAt: new Date(),
        reviewedBy: user.id,
      },
    });
  }

  // Notify user
  await prisma.notification.create({
    data: {
      userId: vipRequest.userId,
      type: NotificationType.VIP_APPROVED,
      title: "🎉 Pro Access Activated!",
      message: "Your VIP request has been approved. You now have full Pro access to all premium features!",
      priority: NotificationPriority.HIGH,
      link: "/dashboard",
    },
  });

  revalidatePath("/admin/ib/pipeline");
  revalidatePath("/admin/community");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function rejectVipRequest(requestId: string, reason: string) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });
  if (profile?.role !== "ADMIN") return { error: "Forbidden" };

  if (!reason?.trim()) return { error: "Reject reason is required" };

  const vipRequest = await prisma.vipRequest.update({
    where: { id: requestId },
    data: {
      status: "REJECTED",
      rejectReason: reason.trim(),
      reviewedBy: user.id,
      reviewedAt: new Date(),
    },
  });

  // Notify user
  await prisma.notification.create({
    data: {
      userId: vipRequest.userId,
      type: NotificationType.VIP_REJECTED,
      title: "VIP Request Rejected",
      message: `Your VIP request was rejected. Reason: ${reason.trim()}`,
      priority: NotificationPriority.NORMAL,
      link: "/dashboard/accounts?intent=unlock-pro",
    },
  });

  revalidatePath("/admin/community");
  revalidatePath("/dashboard");
  return { success: true };
}

export async function deleteVipRequest(requestId: string) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });
  if (profile?.role !== "ADMIN") return { error: "Forbidden" };

  const existingRequest = await prisma.vipRequest.findUnique({
    where: { id: requestId },
  });

  if (!existingRequest) return { error: "Not found" };

  await prisma.vipRequest.delete({
    where: { id: requestId },
  });

  revalidatePath("/admin/ib/pipeline");
  revalidatePath("/admin/ib/traders");
  revalidatePath("/admin/community");
  revalidatePath("/dashboard");
  return { success: true };
}

// ============================================================================
// PRO ENTITLEMENT ADMIN ACTIONS (Account-Scoped)
// ============================================================================

/**
 * Grant grace period for a specific trading account.
 * If no tradingAccountId, grants user-level grace (legacy).
 */
export async function grantGracePeriod(
  userId: string,
  days: number = 14,
  tradingAccountId?: string
) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });
  if (profile?.role !== "ADMIN") return { error: "Forbidden" };

  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + days);

  if (tradingAccountId) {
    await prisma.proEntitlement.upsert({
      where: { tradingAccountId },
      create: {
        userId,
        tradingAccountId,
        status: "GRACE",
        source: "MANUAL_ADMIN",
        startsAt: new Date(),
        expiresAt,
        lastReviewedAt: new Date(),
        reviewedBy: user.id,
      },
      update: {
        status: "GRACE",
        startsAt: new Date(),
        expiresAt,
        lastReviewedAt: new Date(),
        reviewedBy: user.id,
      },
    });
  } else {
    // Legacy user-level grace
    await prisma.proEntitlement.create({
      data: {
        userId,
        status: "GRACE",
        source: "MANUAL_ADMIN",
        startsAt: new Date(),
        expiresAt,
        lastReviewedAt: new Date(),
        reviewedBy: user.id,
      },
    });
  }

  await prisma.notification.create({
    data: {
      userId,
      type: NotificationType.VIP_APPROVED,
      title: "⏳ Temporary Pro Access Granted",
      message: `You have been granted ${days}-day temporary Pro access. Complete your VIP verification to keep access permanently.`,
      priority: NotificationPriority.NORMAL,
      link: "/dashboard/accounts?intent=unlock-pro",
    },
  });

  revalidatePath("/admin/ib/pipeline");
  revalidatePath("/admin/community");
  return { success: true };
}

/**
 * Revoke Pro access for a specific trading account.
 * If no tradingAccountId, revokes all entitlements for the user.
 */
export async function revokeProAccess(
  userId: string,
  reason?: string,
  tradingAccountId?: string
) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });
  if (profile?.role !== "ADMIN") return { error: "Forbidden" };

  if (tradingAccountId) {
    // Revoke specific account
    await prisma.proEntitlement.upsert({
      where: { tradingAccountId },
      create: {
        userId,
        tradingAccountId,
        status: "REVOKED",
        lastReviewedAt: new Date(),
        reviewedBy: user.id,
        adminNote: reason || null,
      },
      update: {
        status: "REVOKED",
        expiresAt: null,
        lastReviewedAt: new Date(),
        reviewedBy: user.id,
        adminNote: reason || null,
      },
    });
  } else {
    // Revoke all user entitlements (legacy)
    await prisma.proEntitlement.updateMany({
      where: { userId },
      data: {
        status: "REVOKED",
        expiresAt: null,
        lastReviewedAt: new Date(),
        reviewedBy: user.id,
        adminNote: reason || null,
      },
    });
  }

  await prisma.notification.create({
    data: {
      userId,
      type: NotificationType.VIP_REJECTED,
      title: "Pro Access Revoked",
      message: reason
        ? `Your Pro access has been revoked. Reason: ${reason}`
        : "Your Pro access has been revoked. Contact support for details.",
      priority: NotificationPriority.HIGH,
      link: "/dashboard/accounts?intent=unlock-pro",
    },
  });

  revalidatePath("/admin/ib/pipeline");
  revalidatePath("/admin/community");
  return { success: true };
}

/**
 * Grant manual Pro for a specific trading account.
 */
export async function grantManualPro(
  userId: string,
  note?: string,
  tradingAccountId?: string
) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  const profile = await prisma.profile.findUnique({
    where: { userId: user.id },
  });
  if (profile?.role !== "ADMIN") return { error: "Forbidden" };

  if (tradingAccountId) {
    await prisma.proEntitlement.upsert({
      where: { tradingAccountId },
      create: {
        userId,
        tradingAccountId,
        status: "ACTIVE",
        source: "MANUAL_ADMIN",
        startsAt: new Date(),
        lastReviewedAt: new Date(),
        reviewedBy: user.id,
        adminNote: note || null,
      },
      update: {
        status: "ACTIVE",
        source: "MANUAL_ADMIN",
        startsAt: new Date(),
        expiresAt: null,
        lastReviewedAt: new Date(),
        reviewedBy: user.id,
        adminNote: note || null,
      },
    });
  } else {
    // Legacy user-level grant
    await prisma.proEntitlement.create({
      data: {
        userId,
        status: "ACTIVE",
        source: "MANUAL_ADMIN",
        startsAt: new Date(),
        lastReviewedAt: new Date(),
        reviewedBy: user.id,
        adminNote: note || null,
      },
    });
  }

  revalidatePath("/admin/ib/pipeline");
  revalidatePath("/admin/community");
  return { success: true };
}
