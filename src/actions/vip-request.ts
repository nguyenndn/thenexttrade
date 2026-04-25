"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import { vipRequestSchema } from "@/lib/validations/vip-request";
import type { VipRequestStatus } from "@prisma/client";
import { NotificationType, NotificationPriority } from "@prisma/client";

// ============================================================================
// USER ACTIONS
// ============================================================================

export async function submitVipRequest(formData: FormData) {
  const user = await getAuthUser();
  if (!user) return { error: "Unauthorized" };

  // Check for existing pending request
  const existingRequest = await prisma.vipRequest.findFirst({
    where: {
      userId: user.id,
      status: "PENDING",
    },
  });

  if (existingRequest) {
    return { error: "You already have a pending VIP request. Please wait for review." };
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

  // Create request
  await prisma.vipRequest.create({
    data: {
      userId: user.id,
      broker: parsed.data.broker,
      accountNumber: parsed.data.accountNumber,
      balance: parsed.data.balance,
      email: parsed.data.email,
      telegramId: parsed.data.telegramId,
      fullName: parsed.data.fullName || null,
      country: parsed.data.country || null,
    },
  });

  revalidatePath("/dashboard");
  return { success: true };
}

export async function getMyVipRequest() {
  const user = await getAuthUser();
  if (!user) return null;

  const request = await prisma.vipRequest.findFirst({
    where: { userId: user.id },
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

  // Notify user
  await prisma.notification.create({
    data: {
      userId: vipRequest.userId,
      type: NotificationType.VIP_APPROVED,
      title: "VIP Access Approved!",
      message: "Your VIP request has been approved. Welcome to the VIP group!",
      priority: NotificationPriority.HIGH,
      link: "/dashboard/trading-systems?tab=VIP",
    },
  });

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
      link: "/dashboard/trading-systems?tab=VIP",
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

  revalidatePath("/admin/community");
  return { success: true };
}
