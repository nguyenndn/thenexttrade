"use server";

import { z } from "zod";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { submitAccountSchema } from "@/lib/validations/ea-license";
import { AccountStatus } from "@prisma/client";

export async function submitAccountRequest(data: z.infer<typeof submitAccountSchema>) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const validation = submitAccountSchema.safeParse(data);
    if (!validation.success) {
        return { error: validation.error.message };
    }

    try {
        const { broker, accountNumber } = validation.data;

        // Check for duplicate account
        const existing = await prisma.eALicense.findFirst({
            where: {
                accountNumber,
                broker,
                // userId: user.id // Should we allow same account for diff users? Probably not.
            }
        });

        if (existing) {
            return { error: "This trading account is already registered." };
        }

        await prisma.eALicense.create({
            data: {
                userId: user.id,
                broker,
                accountNumber,
                status: AccountStatus.PENDING,
            },
        });

        revalidatePath("/dashboard/trading-systems");
        revalidatePath("/dashboard/my-accounts"); // Keep for legacy cache clearing if needed
        return { success: true };
    } catch (error) {
        console.error("Submit Account Error:", error);
        return { error: "Failed to submit account request." };
    }
}

export async function cancelAccountRequest(licenseId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    try {
        const existing = await prisma.eALicense.findUnique({
            where: { id: licenseId },
        });

        if (!existing || existing.userId !== user.id) {
            return { error: "License not found" };
        }

        if (existing.status !== AccountStatus.PENDING) {
            return { error: "Cannot cancel a processed request." };
        }

        await prisma.eALicense.delete({
            where: { id: licenseId },
        });

        revalidatePath("/dashboard/trading-systems");
        return { success: true };
    } catch (error) {
        console.error("Cancel Request Error:", error);
        return { error: "Failed to cancel request." };
    }
}

export async function removeAccount(licenseId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    try {
        const existing = await prisma.eALicense.findUnique({
            where: { id: licenseId },
        });

        if (!existing || existing.userId !== user.id) {
            return { error: "License not found" };
        }

        await prisma.eALicense.delete({
            where: { id: licenseId },
        });

        revalidatePath("/dashboard/trading-systems");
        return { success: true };
    } catch (error) {
        console.error("Remove Account Error:", error);
        return { error: "Failed to remove account." };
    }
}
