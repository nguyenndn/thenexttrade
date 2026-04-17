"use server";

import { prisma } from "@/lib/prisma";
import { getAuthUser } from "@/lib/auth-cache";
import { z } from "zod";

// ── Types ──
export interface NotificationPreferences {
    ea_trading: { inApp: boolean; email: boolean };
    copy_trading: { inApp: boolean; email: boolean };
    trading_reports: { inApp: boolean; email: boolean };
    platform_updates: { inApp: boolean; email: boolean };
    security: { inApp: boolean; email: boolean }; // Always true, enforced server-side
}

const DEFAULT_PREFERENCES: NotificationPreferences = {
    ea_trading: { inApp: true, email: true },
    copy_trading: { inApp: true, email: true },
    trading_reports: { inApp: true, email: true },
    platform_updates: { inApp: true, email: false },
    security: { inApp: true, email: true },
};

// ── Validation ──
const preferencesSchema = z.object({
    ea_trading: z.object({ inApp: z.boolean(), email: z.boolean() }),
    copy_trading: z.object({ inApp: z.boolean(), email: z.boolean() }),
    trading_reports: z.object({ inApp: z.boolean(), email: z.boolean() }),
    platform_updates: z.object({ inApp: z.boolean(), email: z.boolean() }),
    security: z.object({ inApp: z.boolean(), email: z.boolean() }),
});

// ── Load Preferences ──
export async function getNotificationPreferences(): Promise<NotificationPreferences> {
    const user = await getAuthUser();
    if (!user) return DEFAULT_PREFERENCES;

    const dbUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { settings: true },
    });

    const settings = dbUser?.settings as Record<string, unknown> | null;
    const saved = settings?.notificationPreferences as NotificationPreferences | undefined;

    if (!saved) return DEFAULT_PREFERENCES;

    // Merge with defaults to handle new categories added later
    return {
        ...DEFAULT_PREFERENCES,
        ...saved,
        // Security is always enforced
        security: { inApp: true, email: true },
    };
}

// ── Save Preferences ──
export async function saveNotificationPreferences(
    preferences: NotificationPreferences
): Promise<{ success?: boolean; error?: string }> {
    const user = await getAuthUser();
    if (!user) return { error: "Unauthorized" };

    const validation = preferencesSchema.safeParse(preferences);
    if (!validation.success) return { error: "Invalid preferences" };

    // Enforce security always on
    const safePreferences: NotificationPreferences = {
        ...validation.data,
        security: { inApp: true, email: true },
    };

    try {
        // Get existing settings to merge
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            select: { settings: true },
        });

        const existingSettings = (dbUser?.settings as Record<string, unknown>) || {};

        const mergedSettings = {
            ...existingSettings,
            notificationPreferences: safePreferences,
        };

        await prisma.user.update({
            where: { id: user.id },
            data: {
                settings: JSON.parse(JSON.stringify(mergedSettings)),
            },
        });

        return { success: true };
    } catch {
        return { error: "Failed to save preferences" };
    }
}
