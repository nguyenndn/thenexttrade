"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function toggleCoachActionPlanItem(
    planId: string,
    itemId: string, // actually the id of the item
    completed: boolean
) {
    if (typeof completed !== "boolean") {
        return { success: false, error: "Invalid completion state." };
    }

    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return { success: false, error: "Unauthorized" };
        }

        const ownedPlan = await prisma.coachActionPlan.findFirst({
            where: { id: planId, userId: user.id },
            select: { id: true },
        });

        if (!ownedPlan) {
            return { success: false, error: "Action plan not found." };
        }

        await prisma.coachActionPlanItem.update({
            where: { id: itemId, planId },
            data: {
                status: completed ? "COMPLETED" : "PENDING",
                completedAt: completed ? new Date() : null,
            },
        });

        revalidatePath("/dashboard/reports");
        revalidatePath("/dashboard");
        return { success: true };
    } catch (error) {
        console.error("Failed to toggle coach action plan item", error);
        return { success: false, error: "Failed to update action plan item." };
    }
}
