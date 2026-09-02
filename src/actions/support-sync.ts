"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { revalidatePath } from "next/cache";
import { isVipEligibleBroker } from "@/lib/pro-access";

/**
 * Calculate the next upcoming Saturday at 10:00:00 UTC
 */
function getNextSaturdayBatch(): Date {
    const now = new Date();
    const result = new Date(now);
    const dayOfWeek = result.getUTCDay(); // 0 = Sun, 6 = Sat
    const daysUntilSaturday = (6 - dayOfWeek + 7) % 7 || 7;
    result.setUTCDate(result.getUTCDate() + daysUntilSaturday);
    result.setUTCHours(10, 0, 0, 0);
    return result;
}

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

    if (!isVipEligibleBroker(input.broker)) {
        return {
            success: false,
            error: "Selected broker is not currently eligible for VIP Partner Sync (Vantage, Exness, VTMarkets, Ultima Markets).",
        };
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

    const scheduledFor = getNextSaturdayBatch();

    const ticket = await prisma.supportSyncTicket.create({
        data: {
            userId: user.id,
            tradingAccountId: input.tradingAccountId || null,
            broker: input.broker.trim(),
            accountNumber: input.accountNumber.trim(),
            server: input.server?.trim() || null,
            notes: input.notes?.trim() || null,
            scheduledFor,
            status: "PENDING",
        },
    });

    revalidatePath("/dashboard/accounts");
    return { success: true, ticket };
}

export async function getUserSupportSyncTickets() {
    const user = await getAuthUser();
    if (!user) return [];

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
        where: { id: ticketId, userId: user.id, status: "PENDING" },
    });

    if (!ticket) {
        return { success: false, error: "Ticket not found or already processed." };
    }

    await prisma.supportSyncTicket.update({
        where: { id: ticketId },
        data: { status: "CANCELLED" },
    });

    revalidatePath("/dashboard/accounts");
    return { success: true };
}
