"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
    updateOnboardingSettings,
    completeOnboarding,
    skipOnboarding,
} from "@/lib/onboarding/onboarding.server";
import { normalizeCountryCode } from "@/lib/country-utils";

const MAX_AVATAR_BYTES = 2 * 1024 * 1024; // 2 MB

const MIME_TO_AVATAR_EXT: Record<string, "jpg" | "png" | "webp" | "gif"> = {
    "image/jpeg": "jpg",
    "image/png": "png",
    "image/webp": "webp",
    "image/gif": "gif",
};

function validateImageBuffer(buffer: Buffer): {
    valid: boolean;
    mime?: string;
    ext?: "jpg" | "png" | "webp" | "gif";
    error?: string;
} {
    if (buffer.length === 0) {
        return { valid: false, error: "Avatar file is empty." };
    }
    if (buffer.length > MAX_AVATAR_BYTES) {
        return {
            valid: false,
            error: "Avatar image must be 2MB or smaller.",
        };
    }
    if (buffer.length < 6) {
        return {
            valid: false,
            error: "Invalid image format. Accepted: JPG, PNG, WebP, GIF.",
        };
    }

    let detectedMime: string | null = null;

    // JPEG: FF D8 FF
    if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
        detectedMime = "image/jpeg";
    }
    // PNG: 89 50 4E 47 0D 0A 1A 0A
    else if (
        buffer.length >= 8 &&
        buffer[0] === 0x89 &&
        buffer[1] === 0x50 &&
        buffer[2] === 0x4e &&
        buffer[3] === 0x47 &&
        buffer[4] === 0x0d &&
        buffer[5] === 0x0a &&
        buffer[6] === 0x1a &&
        buffer[7] === 0x0a
    ) {
        detectedMime = "image/png";
    }
    // WebP: RIFF....WEBP
    else if (
        buffer.length >= 12 &&
        buffer[0] === 0x52 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x46 &&
        buffer[8] === 0x57 &&
        buffer[9] === 0x45 &&
        buffer[10] === 0x42 &&
        buffer[11] === 0x50
    ) {
        detectedMime = "image/webp";
    }
    // GIF: GIF87a or GIF89a
    else if (
        buffer[0] === 0x47 &&
        buffer[1] === 0x49 &&
        buffer[2] === 0x46 &&
        buffer[3] === 0x38 &&
        (buffer[4] === 0x37 || buffer[4] === 0x39) &&
        buffer[5] === 0x61
    ) {
        detectedMime = "image/gif";
    }

    if (!detectedMime || !MIME_TO_AVATAR_EXT[detectedMime]) {
        return {
            valid: false,
            error: "Invalid image format. Only JPG, PNG, WebP, and GIF images are allowed.",
        };
    }

    return {
        valid: true,
        mime: detectedMime,
        ext: MIME_TO_AVATAR_EXT[detectedMime],
    };
}

// ============================================================================
// STEP 1: IDENTITY (username + avatar + bio)
// ============================================================================

export async function updateProfile(formData: FormData) {
    const supabase = await createClient();

    // 1. Check Auth
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return redirect("/auth/login");
    }

    const username = formData.get("username") as string;
    const bio = formData.get("bio") as string;
    const country = normalizeCountryCode(formData.get("country") as string);
    const avatarFile = formData.get("avatar") as File | null;

    let avatarUrl: string | null = null;

    // 2. Handle Image Upload
    if (avatarFile && avatarFile.size > 0) {
        if (avatarFile.size > MAX_AVATAR_BYTES) {
            return { error: "Avatar image must be 2MB or smaller." };
        }

        const buffer = Buffer.from(await avatarFile.arrayBuffer());
        const validation = validateImageBuffer(buffer);
        if (!validation.valid || !validation.ext || !validation.mime) {
            return {
                error:
                    validation.error ||
                    "Invalid image format. Only JPG, PNG, WebP, and GIF images are allowed.",
            };
        }

        const fileName = `${Date.now()}.${validation.ext}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(filePath, buffer, {
                upsert: true,
                contentType: validation.mime,
            });

        if (uploadError) {
            console.error("Upload Error:", uploadError);
            return {
                error: "Failed to upload avatar image. Please try again.",
            };
        }

        // Get Public URL
        const {
            data: { publicUrl },
        } = supabase.storage.from("avatars").getPublicUrl(filePath);

        avatarUrl = publicUrl;
    }

    // 3. User Sync & Update (Avatar)
    const existingUser = await prisma.user.findUnique({
        where: { id: user.id },
        select: { name: true },
    });
    const metaName = (
        user.user_metadata?.full_name ||
        user.user_metadata?.first_name ||
        ""
    ).trim();

    await prisma.user.upsert({
        where: { id: user.id },
        update: {
            ...(!existingUser?.name && metaName ? { name: metaName } : {}),
        },
        create: {
            id: user.id,
            email: user.email!,
            name: metaName,
            image: user.user_metadata?.avatar_url || "",
        },
    });

    if (avatarUrl) {
        // Sync with Auth Metadata
        await supabase.auth.updateUser({
            data: { avatar_url: avatarUrl },
        });

        await prisma.user.update({
            where: { id: user.id },
            data: { image: avatarUrl },
        });
    }

    // 4. Update/Create Profile (Bio, Username, Country)
    try {
        await prisma.profile.upsert({
            where: { userId: user.id },
            update: {
                username,
                bio,
                country,
            },
            create: {
                userId: user.id,
                username,
                bio,
                country,
            },
        });
    } catch (err: any) {
        console.error("Profile Upsert Error:", err);
        return { error: "Failed to update profile. Username might be taken." };
    }

    // 5. Mark step 1 complete
    await updateOnboardingSettings(user.id, { lastCompletedStep: 1 });

    // 6. Revalidate
    revalidatePath("/", "layout");

    return { success: true };
}

// ============================================================================
// STEP 2: TRADING GOAL
// ============================================================================

export async function saveTradingGoalStep(goal: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    await updateOnboardingSettings(user.id, {
        tradingGoal: goal,
        lastCompletedStep: 2,
    });

    return { success: true };
}

// ============================================================================
// STEP 3: SYNC PREFERENCE
// ============================================================================

export async function saveSyncPreferenceStep(method: "EA_SYNC" | "MANUAL") {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    await updateOnboardingSettings(user.id, {
        preferredSyncMethod: method,
        lastCompletedStep: 3,
    });

    return { success: true };
}

// ============================================================================
// COMPLETE / SKIP
// ============================================================================

export async function completeOnboardingAction() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    await completeOnboarding(user.id);
    revalidatePath("/", "layout");
    return { success: true };
}

export async function skipOnboardingAction() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    await skipOnboarding(user.id);
    revalidatePath("/", "layout");
    return { success: true };
}
