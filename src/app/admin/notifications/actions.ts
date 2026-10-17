"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma"; // Adjust path if using different prisma client location
import { NotificationType, NotificationPriority } from "@prisma/client";
import { z } from "zod";
import { NOTIFICATION_ROUTES } from "@/lib/notification-routes";

// --- Validation Schemas ---
const createBroadcastSchema = z.object({
    title: z.string().trim().min(1, "Title is required").max(100),
    message: z.string().trim().min(1, "Message is required").max(1000),
    type: z.nativeEnum(NotificationType),
    priority: z.nativeEnum(NotificationPriority),
    link: z
        .string()
        .regex(
            /^(\/|https?:\/\/)/,
            "Link must start with / or http(s)://"
        )
        .optional(),
    targetUserIds: z.array(z.string()).optional(), // Optional list of user IDs for targeted messages
    sendAt: z.date().optional(), // Scheduling
});

export type CreateBroadcastInput = z.infer<typeof createBroadcastSchema>;

// --- Helper: Check Admin ---
async function checkAdmin() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { isAuthorized: false, user: null };

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });

    const isAuthorized = profile?.role === "ADMIN";
    return { isAuthorized, user };
}

// --- Action: Create Broadcast ---
export async function createBroadcast(data: CreateBroadcastInput) {
    try {
        const { isAuthorized, user } = await checkAdmin();
        if (!isAuthorized || !user)
            return { success: false, error: "Unauthorized" };

        const validated = createBroadcastSchema.safeParse(data);
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message };
        }

        const { title, message, type, priority, link, targetUserIds, sendAt } =
            validated.data;
        const notificationLink = link?.trim() || NOTIFICATION_ROUTES.DASHBOARD;

        // 1. Create Broadcast Record (admin_broadcasts)
        const broadcast = await prisma.adminBroadcast.create({
            data: {
                title,
                message,
                type,
                priority,
                link: notificationLink,
                createdBy: user.id,
                scheduledAt: sendAt,
                sentAt: !sendAt ? new Date() : null,
                targetAll: !targetUserIds || targetUserIds.length === 0,
                targetRoles: [],
                targetUserIds: targetUserIds || [],
            },
        });

        // 2. If sending immediately (!sendAt)
        if (!sendAt) {
            const whereClause =
                targetUserIds && targetUserIds.length > 0
                    ? { id: { in: targetUserIds } }
                    : {}; // All users if no targets specified

            const users = await prisma.user.findMany({
                select: { id: true },
                where: whereClause,
            });

            if (users.length > 0) {
                const CHUNK_SIZE = 1000;
                for (let i = 0; i < users.length; i += CHUNK_SIZE) {
                    await prisma.notification.createMany({
                        data: users.slice(i, i + CHUNK_SIZE).map((u) => ({
                            userId: u.id,
                            broadcastId: broadcast.id,
                            type,
                            title,
                            message,
                            priority,
                            link: notificationLink,
                            isRead: false,
                        })),
                    });
                }
            }

            await prisma.adminBroadcast.update({
                where: { id: broadcast.id },
                data: { totalRecipients: users.length },
            });
        }

        revalidatePath("/admin/notifications");
        return { success: true, data: broadcast };
    } catch (error) {
        console.error("createBroadcast Error:", error);
        return { success: false, error: "Internal Server Error" };
    }
}

// --- Action: Delete Broadcast ---
export async function deleteBroadcast(broadcastId: string) {
    try {
        const { isAuthorized } = await checkAdmin();
        if (!isAuthorized) return { success: false, error: "Unauthorized" };

        await prisma.$transaction([
            prisma.notification.updateMany({
                where: { broadcastId },
                data: { broadcastId: null },
            }),
            prisma.adminBroadcast.delete({
                where: { id: broadcastId },
            }),
        ]);

        revalidatePath("/admin/notifications");
        return { success: true };
    } catch {
        return { success: false, error: "Failed to delete" };
    }
}
