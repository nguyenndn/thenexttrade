"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// Type definition matching dynamic admin activation inbox items
export interface AdminActivationUser {
    id: string;
    name: string;
    email: string | null;
    image: string | null;
    createdAt: Date;
    level: number;
    xp: number;
}

export interface AdminActivationSignalItem {
    id: string;
    signalType: string;
    severity: string;
    title: string;
    summary: string;
    firstSeenAt: Date;
    lastSeenAt: Date;
    metadata: {
        adminNotes?: string;
        adminContactedAt?: string;
        adminDismissedUntil?: string;
        notificationSentAt?: string;
        [key: string]: any;
    };
    user: AdminActivationUser;
}

// 1. Helper function to check if the current user is an authorized admin
async function checkAdminAuth() {
    // Wrap so a thrown auth/session error degrades to null instead of an
    // unhandled server-action rejection (callers rely on the null → Unauthorized path).
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) return null;

        const { data: aal, error: aalError } =
            await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
        if (
            aalError ||
            (aal && aal.currentLevel === "aal1" && aal.nextLevel === "aal2")
        ) {
            return null;
        }

        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { role: true },
        });

        if (profile?.role !== "ADMIN") return null;

        return user;
    } catch (error) {
        console.error("Admin auth check failed:", error);
        return null;
    }
}

// severity is a plain VARCHAR — Prisma cannot order by it meaningfully
// (alphabetical), so rank HIGH → LOW in JS with recency as the tiebreak.
const SEVERITY_RANK: Record<string, number> = {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1,
    INFO: 0,
};

// 2. Fetch all active activation signals for stuck traders, filtering out dismissed items
export async function getAdminActivationSignals(): Promise<{
    success: boolean;
    data?: AdminActivationSignalItem[];
    error?: string;
}> {
    const admin = await checkAdminAuth();
    if (!admin) {
        return { success: false, error: "Unauthorized" };
    }

    try {
        const activationSignalTypes = [
            "NO_ACCOUNT",
            "ACCOUNT_NEVER_SYNCED",
            "SYNC_STALE",
            "NO_FIRST_TRADE",
            "NO_WEEKLY_REVIEW",
            "NO_LESSON_STARTED",
        ];

        // Fetch all active trader signals of activation type
        const signals = await prisma.traderSignal.findMany({
            where: {
                status: "ACTIVE",
                signalType: { in: activationSignalTypes },
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        image: true,
                        createdAt: true,
                        level: true,
                        xp: true,
                    },
                },
            },
            orderBy: {
                lastSeenAt: "desc",
            },
            take: 200,
        });

        // Parse and filter out dismissed signals
        const now = new Date();
        const filteredSignals = signals
            .map((sig) => {
                const metadata = (sig.metadata as Record<string, any>) || {};
                return {
                    id: sig.id,
                    signalType: sig.signalType,
                    severity: sig.severity,
                    title: sig.title,
                    summary: sig.summary,
                    firstSeenAt: sig.firstSeenAt,
                    lastSeenAt: sig.lastSeenAt,
                    metadata: metadata,
                    user: {
                        id: sig.user.id,
                        name: sig.user.name || "Trader",
                        email: sig.user.email,
                        image: sig.user.image,
                        createdAt: sig.user.createdAt,
                        level: sig.user.level,
                        xp: sig.user.xp,
                    },
                } as AdminActivationSignalItem;
            })
            .filter((sig) => {
                if (sig.metadata.adminDismissedUntil) {
                    const dismissUntil = new Date(
                        sig.metadata.adminDismissedUntil
                    );
                    if (dismissUntil > now) {
                        return false; // Skip as it is currently dismissed
                    }
                }
                return true;
            })
            .sort(
                (a, b) =>
                    (SEVERITY_RANK[b.severity] ?? 0) -
                        (SEVERITY_RANK[a.severity] ?? 0) ||
                    b.lastSeenAt.getTime() - a.lastSeenAt.getTime()
            );

        return { success: true, data: filteredSignals };
    } catch (error) {
        console.error("Failed to fetch admin activation signals:", error);
        return {
            success: false,
            error: "Failed to retrieve activation inbox data",
        };
    }
}

// 3. Mark a user signal as contacted by the administrator
export async function markUserContacted(
    signalId: string
): Promise<{ success: boolean; error?: string }> {
    const admin = await checkAdminAuth();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const signal = await prisma.traderSignal.findUnique({
            where: { id: signalId },
            select: { metadata: true },
        });

        if (!signal) return { success: false, error: "Signal not found" };

        const metadata = (signal.metadata as Record<string, any>) || {};
        const updatedMetadata = {
            ...metadata,
            adminContactedAt: new Date().toISOString(),
        };

        await prisma.traderSignal.update({
            where: { id: signalId },
            data: { metadata: updatedMetadata },
        });

        revalidatePath("/admin/reports");
        return { success: true };
    } catch (error) {
        console.error("Failed to mark signal as contacted:", error);
        return { success: false, error: "Operation failed" };
    }
}

// 4. Temporarily dismiss a signal from the admin inbox for a specified number of days
export async function dismissUserSignal(
    signalId: string,
    days: number
): Promise<{ success: boolean; error?: string }> {
    const admin = await checkAdminAuth();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const signal = await prisma.traderSignal.findUnique({
            where: { id: signalId },
            select: { metadata: true },
        });

        if (!signal) return { success: false, error: "Signal not found" };

        const metadata = (signal.metadata as Record<string, any>) || {};
        // Clamp to a sane [1, 365]-day window so a bad/negative/huge (or NaN)
        // value can neither expire the dismissal instantly nor hide a signal
        // from the inbox forever.
        const safeDays = Math.min(365, Math.max(1, Math.round(days) || 1));
        const dismissDate = new Date();
        dismissDate.setDate(dismissDate.getDate() + safeDays);

        const updatedMetadata = {
            ...metadata,
            adminDismissedUntil: dismissDate.toISOString(),
        };

        await prisma.traderSignal.update({
            where: { id: signalId },
            data: { metadata: updatedMetadata },
        });

        revalidatePath("/admin/reports");
        return { success: true };
    } catch (error) {
        console.error("Failed to dismiss signal:", error);
        return { success: false, error: "Operation failed" };
    }
}

// 5. Save a custom admin comment note on a trader's signal
export async function saveAdminSignalNote(
    signalId: string,
    note: string
): Promise<{ success: boolean; error?: string }> {
    const admin = await checkAdminAuth();
    if (!admin) return { success: false, error: "Unauthorized" };

    try {
        const signal = await prisma.traderSignal.findUnique({
            where: { id: signalId },
            select: { metadata: true },
        });

        if (!signal) return { success: false, error: "Signal not found" };

        const metadata = (signal.metadata as Record<string, any>) || {};
        const updatedMetadata = {
            ...metadata,
            adminNotes: note,
        };

        await prisma.traderSignal.update({
            where: { id: signalId },
            data: { metadata: updatedMetadata },
        });

        revalidatePath("/admin/reports");
        return { success: true };
    } catch (error) {
        console.error("Failed to save admin note:", error);
        return { success: false, error: "Operation failed" };
    }
}
