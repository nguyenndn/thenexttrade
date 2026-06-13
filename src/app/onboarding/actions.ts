"use server";

import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { updateOnboardingSettings, completeOnboarding, skipOnboarding } from "@/lib/onboarding/onboarding.server";
import { normalizeCountryCode } from "@/lib/country-utils";

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
 } else {
 // Get Public URL
 const { data: { publicUrl } } = supabase.storage
 .from("avatars")
 .getPublicUrl(filePath);

 avatarUrl = publicUrl;
 }
 }

 // 3. User Sync & Update (Avatar)
 const dbUser = await prisma.user.upsert({
 where: { email: user.email! },
 update: {
 id: user.id,
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
 }
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
 const { data: { user } } = await supabase.auth.getUser();
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

export async function saveSyncPreferenceStep(method: "TNT_CONNECT" | "EA_SYNC" | "MANUAL") {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
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
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return { error: "Unauthorized" };

 await completeOnboarding(user.id);
 revalidatePath("/", "layout");
 return { success: true };
}

export async function skipOnboardingAction() {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) return { error: "Unauthorized" };

 await skipOnboarding(user.id);
 revalidatePath("/", "layout");
 return { success: true };
}
