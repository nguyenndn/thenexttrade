"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma"; // Assuming you have a prisma client instance exported
import { revalidatePath } from "next/cache";

export async function saveCalendarSettings(settings: any) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        // We need to fetch current settings first to merge or just overwrite?
        // Let's assume we merge or overwrite the 'calendar' key in settings.

        // Since `settings` is Json, we need to handle it carefully.
        // First get current user to see existing settings
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { settings: true }
        });

        const currentSettings = (dbUser?.settings as Record<string, any>) || {};

        const newSettings = {
            ...currentSettings,
            calendar: settings // Store calendar specific settings under 'calendar' key
        };

        await prisma.user.update({
            where: { id: user.id },
            data: {
                settings: newSettings
            }
        });

        // revalidatePath("/economic-calendar"); // Optional: might not need revalidation if client updates state optimistic
        return { success: true };
    } catch (error) {
        console.error("Failed to save settings:", error);
        return { success: false, error: "Failed to save settings" };
    }
}

export async function getCalendarSettings() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return null;
    }

    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { settings: true }
        });

        const settings = dbUser?.settings as Record<string, any>;
        return settings?.calendar || null;
    } catch (error) {
        console.error("Failed to get settings:", error);
        return null;
    }
}
