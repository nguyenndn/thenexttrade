
"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma"; // Adjust path if using different prisma client location
import { NotificationType, NotificationPriority } from "@prisma/client";
import { z } from "zod";

// --- Validation Schemas ---
const createBroadcastSchema = z.object({
    title: z.string().min(1, "Title is required").max(100),
    message: z.string().min(1, "Message is required").max(1000),
    type: z.nativeEnum(NotificationType),
    priority: z.nativeEnum(NotificationPriority),
    link: z.string().optional(),
    targetUserIds: z.array(z.string()).optional(), // Optional list of user IDs for targeted messages
    sendAt: z.date().optional(), // Scheduling
});

export type CreateBroadcastInput = z.infer<typeof createBroadcastSchema>;

// --- Helper: Check Admin ---
async function checkAdmin() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { isAuthorized: false, user: null };

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });

    const isAuthorized = profile?.role === "ADMIN" || profile?.role === "EDITOR";
    return { isAuthorized, user };
}

// --- Action: Create Broadcast ---
export async function createBroadcast(data: CreateBroadcastInput) {
    try {
        const { isAuthorized, user } = await checkAdmin();
        if (!isAuthorized || !user) return { success: false, error: "Unauthorized" };

        const validated = createBroadcastSchema.safeParse(data);
        if (!validated.success) {
            return { success: false, error: validated.error.issues[0].message };
        }

        const { title, message, type, priority, link, targetUserIds, sendAt } = data;

        // 1. Create Broadcast Record (admin_broadcasts)
        const broadcast = await prisma.adminBroadcast.create({
            data: {
                title,
                message,
                type,
                priority,
                link,
                createdBy: user.id,
                scheduledAt: sendAt,
                // isSent removed as it is not in schema. Logic relies on sentAt being not null.
                sentAt: !sendAt ? new Date() : null,
                targetRoles: [], // TODO: Add role filtering if needed
            },
        });

        // 2. If sending immediately (!sendAt)
        if (!sendAt) {
            // Logic to distribute notifications to users
            // This can be heavy if many users. Ideally use a background job/cron for distribution.
            // But for < few thousand users, direct insert might be okay or chunked.
            // Specification says: "Scheduled Cron: Every 5 min checks for pending broadcasts".
            // But here we are saying "isSent: true" if immediate.
            // We should probably Insert into Notification table right now if immediate.

            const whereClause = targetUserIds && targetUserIds.length > 0
                ? { id: { in: targetUserIds } }
                : {}; // All users if no targets specified

            const users = await prisma.user.findMany({ select: { id: true }, where: whereClause });

            if (users.length > 0) {
                await prisma.notification.createMany({
                    data: users.map(u => ({
                        userId: u.id,
                        type,
                        title,
                        message,
                        priority,
                        link,
                        isRead: false,
                    }))
                });
            }
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

        await prisma.adminBroadcast.delete({
            where: { id: broadcastId }
        });

        revalidatePath("/admin/notifications");
        return { success: true };
    } catch (error) {
        return { success: false, error: "Failed to delete" };
    }
}
