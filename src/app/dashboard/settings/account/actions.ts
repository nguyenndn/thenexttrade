"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateSettings(formData: FormData) {
    const supabase = await createClient();

    // 1. Check Auth
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return { error: "Unauthorized" };
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
            return { error: "Failed to upload avatar" };
        }

        // Get Public URL
        const { data: { publicUrl } } = supabase.storage
            .from("avatars")
            .getPublicUrl(filePath);

        avatarUrl = publicUrl;
    }

    // 3. Update User Table (Avatar)
    if (avatarUrl) {
        // Sync with Auth Metadata (Important for Header/Session)
        await supabase.auth.updateUser({
            data: { avatar_url: avatarUrl }
        });

        const { error: userUpdateError } = await supabase
            .from("User")
            .update({ image: avatarUrl })
            .eq("id", user.id);

        if (userUpdateError) {
            console.error("User Update Error:", userUpdateError);
            return { error: "Failed to update user avatar" };
        }
    }

    // 4. Update Profile Table (Bio, Username)
    // Check if profile exists to determine if we need to generate an ID
    const { data: existingProfile } = await supabase
        .from("Profile")
        .select("id")
        .eq("userId", user.id)
        .single();

    let profileError;

    if (existingProfile) {
        // Update existing
        const { error } = await supabase
            .from("Profile")
            .update({
                username: username,
                bio: bio,
                updatedAt: new Date().toISOString(),
            })
            .eq("userId", user.id);
        profileError = error;
    } else {
        // Insert new (Generate ID manually since DB default might be missing)
        const { error } = await supabase
            .from("Profile")
            .insert({
                id: crypto.randomUUID(),
                userId: user.id,
                username: username,
                bio: bio,
                updatedAt: new Date().toISOString(),
            });
        profileError = error;
    }

    if (profileError) {
        console.error("Profile Update Error:", profileError);
        return { error: "Failed to update profile details" };
    }

    // 5. Revalidate
    revalidatePath("/dashboard/settings");
    revalidatePath("/dashboard/settings/account");
    revalidatePath("/dashboard", "layout"); // Update header everywhere

    return { success: true, message: "Profile updated successfully!" };
}

export async function updatePassword(formData: FormData) {
    const supabase = await createClient();

    // 1. Check Auth
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.email) {
        return { error: "Unauthorized" };
    }

    const currentPassword = formData.get("currentPassword") as string;
    const newPassword = formData.get("newPassword") as string;
    const confirmPassword = formData.get("confirmPassword") as string;

    if (!currentPassword || !newPassword || !confirmPassword) {
        return { error: "All fields are required" };
    }

    if (newPassword !== confirmPassword) {
        return { error: "New passwords do not match" };
    }

    if (newPassword.length < 6) {
        return { error: "Password must be at least 6 characters" };
    }

    // 2. Verify Current Password
    const { error: signInError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: currentPassword,
    });

    if (signInError) {
        return { error: "Current password is incorrect" };
    }

    // 3. Update Password
    const { error: updateError } = await supabase.auth.updateUser({
        password: newPassword,
    });

    if (updateError) {
        return { error: updateError.message };
    }

    return { success: true, message: "Password updated successfully!" };
}

// ==========================================
// SESSION MANAGEMENT
// ==========================================

import { getActiveSessions, revokeSession } from "@/lib/session";

export async function fetchUserSessions() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return [];

    return await getActiveSessions(user.id);
}

export async function deleteSession(sessionId: string) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { error: "Unauthorized" };

    await revokeSession(sessionId, user.id);
    revalidatePath("/dashboard/settings");
    return { success: true, message: "Session revoked" };
}

// ==========================================
// 2FA MANAGEMENT
// ==========================================

export async function getTwoFactorStatus() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { isEnabled: false };

    const factors = user.factors || [];
    const totp = factors.find(f => f.factor_type === 'totp' && f.status === 'verified');

    return { isEnabled: !!totp };
}

export async function startTwoFactorSetup() {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp'
    });

    if (error) return { error: error.message };

    return {
        success: true,
        data: {
            id: data.id,
            secret: data.totp.secret,
            qr: data.totp.qr_code
        }
    };
}

export async function verifyTwoFactorSetup(factorId: string, code: string) {
    const supabase = await createClient();

    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId });
    if (challengeErr) return { error: challengeErr.message };

    const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId: challenge.id,
        code
    });

    if (error) return { error: error.message };

    revalidatePath("/dashboard/settings");
    return { success: true };
}

export async function disableTwoFactor(code?: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: "Unauthorized" };

    const factors = user.factors || [];
    const totpFactor = factors.find(f => f.factor_type === 'totp' && f.status === 'verified');

    if (!totpFactor) return { error: "2FA is not enabled" };

    if (!code) return { error: "Verification code required" };

    // Verify code before disabling
    const { data: challenge, error: challengeErr } = await supabase.auth.mfa.challenge({ factorId: totpFactor.id });
    if (challengeErr) return { error: challengeErr.message };

    const { error: verifyErr } = await supabase.auth.mfa.verify({
        factorId: totpFactor.id,
        challengeId: challenge.id,
        code
    });

    if (verifyErr) return { error: "Invalid code" };

    await supabase.auth.mfa.unenroll({ factorId: totpFactor.id });

    revalidatePath("/dashboard/settings");
    return { success: true };
}
