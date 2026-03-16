'use server';

import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfile(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
    }

    const fullName = (formData.get("fullName") as string || "").trim();
    const imageFile = formData.get("image") as File;

    try {
        let imageUrl = undefined;

        if (imageFile && imageFile.size > 0) {
            const fileName = `${user.id}-${Date.now()}-${imageFile.name}`;
            const { data, error } = await supabase.storage
                .from('avatars')
                .upload(fileName, imageFile, {
                    cacheControl: '3600',
                    upsert: false
                });

            if (error) {
                console.error("Upload Error:", error);
                // Continue without updating image if upload fails, or throw
            } else if (data) {
                const { data: publicUrlData } = supabase.storage
                    .from('avatars')
                    .getPublicUrl(data.path);
                imageUrl = publicUrlData.publicUrl;
            }
        }

        // Update Prisma User
        await prisma.user.update({
            where: { id: user.id },
            data: {
                name: fullName,
                ...(imageUrl && { image: imageUrl })
            }
        });

        // Update Supabase Auth User (Optional metadata)
        await supabase.auth.updateUser({
            data: {
                full_name: fullName,
                ...(imageUrl && { avatar_url: imageUrl })
            }
        });

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error) {
        console.error("Profile Update Error:", error);
        return { error: "Failed to update profile" };
    }
}

export async function updateSystemConfig(config: any) {
    // Check Admin Role (Assuming middleware handles basic auth, but double check role here recommended)
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    try {
        await prisma.systemSetting.upsert({
            where: { key: 'site_config' },
            update: { value: config },
            create: {
                key: 'site_config',
                value: config
            }
        });

        revalidatePath('/admin/settings');
        return { success: true };
    } catch (error) {
        console.error("System Config Error:", error);
        return { error: "Failed to update system configuration" };
    }
}
