"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";

export interface CreateSupportSyncInput {
    broker: string;
    accountNumber: string;
    server?: string;
    notes?: string;
    tradingAccountId?: string;
}

export async function createSupportSyncTicket(input: CreateSupportSyncInput) {
    const user = await getAuthUser();
    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    if (!input.broker || !input.accountNumber) {
        return { success: false, error: "Broker and Account Number are required." };
    }

    // Check if there is already an active pending ticket for this account
    const existing = await prisma.supportSyncTicket.findFirst({
        where: {
            userId: user.id,
            accountNumber: input.accountNumber.trim(),
            status: "PENDING",
        },
    });

    if (existing) {
        return {
            success: false,
            error: "A sync request for this account is already pending review.",
        };
    }

    const ticket = await prisma.supportSyncTicket.create({
        data: {
            userId: user.id,
            tradingAccountId: input.tradingAccountId || null,
            broker: input.broker.trim(),
            accountNumber: input.accountNumber.trim(),
            server: input.server?.trim() || null,
            notes: input.notes?.trim() || null,
            scheduledFor: null,
            status: "PENDING",
        },
    });

    revalidatePath("/dashboard/accounts");
    revalidatePath("/admin/ib/sync-requests");
    return { success: true, ticket };
}

export async function getUserSupportSyncTickets() {
    const user = await getAuthUser();
    if (!user) return [];

    // Cancelled tickets are hard-deleted by cancelSupportSyncTicket(), so there is
    // nothing to sweep here. This function stays read-only — never write from a
    // read path (a write here would fire on every page load).
    return prisma.supportSyncTicket.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: "desc" },
        include: {
            tradingAccount: {
                select: { id: true, name: true, broker: true },
            },
        },
    });
}

export async function cancelSupportSyncTicket(ticketId: string) {
    const user = await getAuthUser();
    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    const ticket = await prisma.supportSyncTicket.findFirst({
        where: { id: ticketId, userId: user.id },
    });

    if (!ticket) {
        return { success: false, error: "Ticket not found or already deleted." };
    }

    // Hard delete the record directly from database
    await prisma.supportSyncTicket.delete({
        where: { id: ticketId },
    });

    revalidatePath("/dashboard/accounts");
    revalidatePath("/admin/ib/sync-requests");
    return { success: true };
}
