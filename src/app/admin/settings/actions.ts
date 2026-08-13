"use server";

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const fullName = ((formData.get("fullName") as string) || "").trim();
    const imageFile = formData.get("image") as File;

    try {
        let imageUrl = undefined;

        if (imageFile && imageFile.size > 0) {
            // Server-side validation — the client-side checks are not a trust
            // boundary. Reject oversized uploads and any type we can't serve
            // safely (SVG is excluded: it can carry scripts when opened
            // directly from the public bucket).
            const MAX_SIZE = 2 * 1024 * 1024; // 2 MB
            if (imageFile.size > MAX_SIZE) {
                return { error: "Image too large (max 2 MB)" };
            }

            const allowedTypes: Record<string, string> = {
                "image/jpeg": "jpg",
                "image/png": "png",
                "image/webp": "webp",
                "image/gif": "gif",
            };
            const ext = allowedTypes[imageFile.type];
            if (!ext) {
                return {
                    error: "Unsupported file type (use JPG, PNG, WebP or GIF)",
                };
            }

            // Never trust the client filename — derive a clean key from the
            // verified MIME type so traversal characters or weird names can't
            // leak into the storage path.
            const fileName = `${user.id}-${Date.now()}.${ext}`;
            const { data, error } = await supabase.storage
                .from("avatars")
                .upload(fileName, imageFile, {
                    cacheControl: "3600",
                    upsert: false,
                });

            if (error) {
                console.error("Upload Error:", error);
                // Continue without updating image if upload fails, or throw
            } else if (data) {
                const { data: publicUrlData } = supabase.storage
                    .from("avatars")
                    .getPublicUrl(data.path);
                imageUrl = publicUrlData.publicUrl;
            }
        }

        // Update Prisma User
        await prisma.user.update({
            where: { id: user.id },
            data: {
                name: fullName,
                ...(imageUrl && { image: imageUrl }),
            },
        });

        // Update Supabase Auth User (Optional metadata)
        await supabase.auth.updateUser({
            data: {
                full_name: fullName,
                ...(imageUrl && { avatar_url: imageUrl }),
            },
        });

        revalidatePath("/admin/settings");
        return { success: true };
    } catch (error) {
        console.error("Profile Update Error:", error);
        return { error: "Failed to update profile" };
    }
}

export async function updateSystemConfig(config: any) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    // DB-backed ADMIN role check
    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });
    const role = profile?.role || "USER";
    if (role !== "ADMIN") {
        return { error: "Forbidden — admin access required" };
    }

    try {
        await prisma.systemSetting.upsert({
            where: { key: "site_config" },
            update: { value: config },
            create: {
                key: "site_config",
                value: config,
            },
        });

        revalidatePath("/admin/settings");
        return { success: true };
    } catch (error) {
        console.error("System Config Error:", error);
        return { error: "Failed to update system configuration" };
    }
}
