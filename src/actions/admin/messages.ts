"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";

export type MessageStatus = "new" | "read" | "replied" | "archived";

export interface ContactMessageRecord {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  status: string;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AdminMessagesStats {
  total: number;
  newCount: number;
  readCount: number;
  repliedCount: number;
  archivedCount: number;
}

export interface FetchAdminMessagesParams {
  status?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}

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

export async function fetchAdminMessagesData(params?: FetchAdminMessagesParams): Promise<{
  success: boolean;
  data?: {
    messages: ContactMessageRecord[];
    stats: AdminMessagesStats;
    total: number;
  };
  error?: string;
}> {
  try {
    await requireAdmin();

    const page = Math.max(1, params?.page || 1);
    const pageSize = Math.max(1, Math.min(100, params?.pageSize || 20));
    const skip = (page - 1) * pageSize;

    const statusFilter =
      params?.status && params.status.toLowerCase() !== "all"
        ? params.status.toLowerCase()
        : undefined;

    const searchTerm = params?.search?.trim();

    const where: any = {};

    if (statusFilter) {
      where.status = statusFilter;
    }

    if (searchTerm) {
      where.OR = [
        { name: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
        { subject: { contains: searchTerm, mode: "insensitive" } },
        { message: { contains: searchTerm, mode: "insensitive" } },
      ];
    }

    const [rawMessages, total, totalAll, newCount, readCount, repliedCount, archivedCount] =
      await Promise.all([
        prisma.contactMessage.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take: pageSize,
        }),
        prisma.contactMessage.count({ where }),
        prisma.contactMessage.count(),
        prisma.contactMessage.count({ where: { status: "new" } }),
        prisma.contactMessage.count({ where: { status: "read" } }),
        prisma.contactMessage.count({ where: { status: "replied" } }),
        prisma.contactMessage.count({ where: { status: "archived" } }),
      ]);

    const messages: ContactMessageRecord[] = rawMessages.map((m) => ({
      id: m.id,
      name: m.name,
      email: m.email,
      subject: m.subject,
      message: m.message,
      status: m.status,
      notes: m.notes,
      createdAt: m.createdAt.toISOString(),
      updatedAt: m.updatedAt.toISOString(),
    }));

    const stats: AdminMessagesStats = {
      total: totalAll,
      newCount,
      readCount,
      repliedCount,
      archivedCount,
    };

    return {
      success: true,
      data: {
        messages,
        stats,
        total,
      },
    };
  } catch (error: any) {
    console.error("[ADMIN_MESSAGES] fetchAdminMessagesData error:", error);
    return {
      success: false,
      error: error?.message || "Failed to load messages",
    };
  }
}

export async function updateContactMessageStatus(
  id: string,
  status: MessageStatus,
  notes?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    const data: { status: string; notes?: string } = { status };
    if (typeof notes === "string") {
      data.notes = notes;
    }

    await prisma.contactMessage.update({
      where: { id },
      data,
    });

    revalidatePath("/admin/messages");
    return { success: true };
  } catch (error: any) {
    console.error("[ADMIN_MESSAGES] updateContactMessageStatus error:", error);
    return {
      success: false,
      error: error?.message || "Failed to update message status",
    };
  }
}

export async function deleteContactMessage(id: string): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdmin();

    await prisma.contactMessage.delete({
      where: { id },
    });

    revalidatePath("/admin/messages");
    return { success: true };
  } catch (error: any) {
    console.error("[ADMIN_MESSAGES] deleteContactMessage error:", error);
    return {
      success: false,
      error: error?.message || "Failed to delete message",
    };
  }
}
