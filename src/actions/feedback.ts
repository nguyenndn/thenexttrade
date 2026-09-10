"use server";

import { getAuthUser } from "@/lib/auth-cache";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

/**
 * Delete a single feedback item owned by the authenticated user.
 */
export async function deleteUserFeedbackAction(feedbackId: string) {
    const user = await getAuthUser();
    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const result = await prisma.feedback.deleteMany({
            where: {
                id: feedbackId,
                userId: user.id,
            },
        });

        if (result.count === 0) {
            return {
                success: false,
                error: "Feedback not found or access denied",
            };
        }

        revalidatePath("/dashboard/settings/feedback");
        return { success: true };
    } catch (error) {
        console.error("Failed to delete feedback:", error);
        return { success: false, error: "Failed to delete feedback" };
    }
}

/**
 * Delete selected or all feedback items owned by the authenticated user.
 */
export async function deleteUserBulkFeedbackAction({
    ids,
    all,
}: {
    ids?: string[];
    all?: boolean;
}) {
    const user = await getAuthUser();
    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        if (all) {
            const result = await prisma.feedback.deleteMany({
                where: {
                    userId: user.id,
                },
            });

            revalidatePath("/dashboard/settings/feedback");
            return { success: true, count: result.count };
        }

        if (ids && ids.length > 0) {
            const result = await prisma.feedback.deleteMany({
                where: {
                    id: { in: ids },
                    userId: user.id,
                },
            });

            revalidatePath("/dashboard/settings/feedback");
            return { success: true, count: result.count };
        }

        return { success: false, error: "No feedback items specified" };
    } catch (error) {
        console.error("Failed to bulk delete user feedback:", error);
        return { success: false, error: "Failed to delete feedback items" };
    }
}
