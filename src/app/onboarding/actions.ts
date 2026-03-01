"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

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
    const avatarFile = formData.get("avatar") as File;

    let avatarUrl = null;

    // 2. Handle Image Upload
    if (avatarFile && avatarFile.size > 0) {
        const fileExt = avatarFile.name.split(".").pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const filePath = `${user.id}/${fileName}`;

        const { error: uploadError } = await supabase.storage
            .from("avatars")
            .upload(filePath, avatarFile, {
                upsert: true,
            });

        if (uploadError) {
            console.error("Upload Error:", uploadError);
            // Continue without avatar update if upload fails? Or throw?
            // For now, log and continue, or we could return error.
        } else {
            // Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from("avatars")
                .getPublicUrl(filePath);

            avatarUrl = publicUrl;
        }
    }

    // 3. User Sync & Update (Avatar)
    // Ensure Prisma user exists before update (Defense in depth)
    // Using upsert by email to prevent "Unique constraint failed" if a seeded or previous record exists
    const dbUser = await prisma.user.upsert({
        where: { email: user.email! },
        update: {
            id: user.id, // Ensure ID matches auth
            name: user.user_metadata?.full_name || user.user_metadata?.first_name || '',
        },
        create: {
            id: user.id,
            email: user.email!,
            name: user.user_metadata?.full_name || '',
            image: user.user_metadata?.avatar_url || '',
        }
    });

    if (avatarUrl) {
        // Sync with Auth Metadata
        await supabase.auth.updateUser({
            data: { avatar_url: avatarUrl }
        });

        await prisma.user.update({
            where: { id: user.id },
            data: { image: avatarUrl }
        });
    }

    // 4. Update/Create Profile (Bio, Username)
    try {
        await prisma.profile.upsert({
            where: { userId: user.id },
            update: {
                username,
                bio,
            },
            create: {
                userId: user.id,
                username,
                bio,
            }
        });
    } catch (err: any) {
        console.error("Profile Upsert Error:", err);
        return { error: "Failed to update profile. Username might be taken." };
    }

    // 5. Revalidate
    revalidatePath("/", "layout");

    return { success: true };
}
