"use server";

import { z } from "zod";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import {
    sendEmailWithDetails,
    buildContactReplyEmailHtml,
} from "@/lib/services/email.service";

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

const replyMessageSchema = z.object({
    id: z.string().trim().min(1, "Message ID is required"),
    subject: z
        .string()
        .trim()
        .min(1, "Subject is required")
        .max(255, "Subject cannot exceed 255 characters"),
    replyMessage: z
        .string()
        .trim()
        .min(1, "Reply body is required")
        .max(10000, "Reply body cannot exceed 10,000 characters"),
});

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

function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error && error.message ? error.message : fallback;
}

export async function fetchAdminMessagesData(
    params?: FetchAdminMessagesParams
): Promise<{
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

        const where: Prisma.ContactMessageWhereInput = {};

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

        const [
            rawMessages,
            total,
            totalAll,
            newCount,
            readCount,
            repliedCount,
            archivedCount,
        ] = await Promise.all([
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
    } catch (error: unknown) {
        return {
            success: false,
            error: getErrorMessage(error, "Failed to load messages"),
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
    } catch (error: unknown) {
        return {
            success: false,
            error: getErrorMessage(error, "Failed to update message status"),
        };
    }
}

export async function saveContactMessageNotes(
    id: string,
    notes: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await requireAdmin();

        await prisma.contactMessage.update({
            where: { id },
            data: { notes },
        });

        revalidatePath("/admin/messages");
        return { success: true };
    } catch (error: unknown) {
        return {
            success: false,
            error: getErrorMessage(error, "Failed to save admin notes"),
        };
    }
}

export async function replyToContactMessage(input: {
    id: string;
    subject: string;
    replyMessage: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        await requireAdmin();

        const parsed = replyMessageSchema.safeParse(input);
        if (!parsed.success) {
            return {
                success: false,
                error:
                    parsed.error.issues[0]?.message ||
                    "Invalid reply parameters",
            };
        }

        const existing = await prisma.contactMessage.findUnique({
            where: { id: parsed.data.id },
        });

        if (!existing) {
            return { success: false, error: "Message not found" };
        }

        const html = buildContactReplyEmailHtml({
            recipientName: existing.name,
            replySubject: parsed.data.subject,
            replyBody: parsed.data.replyMessage,
            originalSubject: existing.subject,
            originalMessage: existing.message,
        });

        const textFallback = `Hi ${existing.name},\n\n${parsed.data.replyMessage}\n\nBest regards,\nTheNextTrade Support Desk\n\n---\nYour Original Message (${existing.subject}):\n${existing.message}`;

        const delivery = await sendEmailWithDetails({
            to: existing.email,
            subject: parsed.data.subject,
            html,
            text: textFallback,
        });

        if (!delivery.success) {
            return {
                success: false,
                error: delivery.error || "Failed to send email via mail server",
            };
        }

        await prisma.contactMessage.update({
            where: { id: existing.id },
            data: { status: "replied" },
        });

        revalidatePath("/admin/messages");
        return { success: true };
    } catch (error: unknown) {
        return {
            success: false,
            error: getErrorMessage(error, "Failed to send email reply"),
        };
    }
}

export async function deleteContactMessage(
    id: string
): Promise<{ success: boolean; error?: string }> {
    try {
        await requireAdmin();

        await prisma.contactMessage.delete({
            where: { id },
        });

        revalidatePath("/admin/messages");
        return { success: true };
    } catch (error: unknown) {
        return {
            success: false,
            error: getErrorMessage(error, "Failed to delete message"),
        };
    }
}
