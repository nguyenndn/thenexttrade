import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { normalizeCountryCode } from "@/lib/country-utils";
import { sanitizeInput } from "@/lib/sanitize";
import { getOnboardingState, updateOnboardingSettings } from "@/lib/onboarding/onboarding.server";

export const dynamic = "force-dynamic";

const updateProfileSchema = z.object({
 name: z.string().min(2, "Name must be at least 2 characters"),
 bio: z.string().optional(),
 telegramId: z.string().optional(),
 country: z.union([
 z.string().trim().regex(/^[A-Za-z]{2}$/, "Country must be a two-letter country code"),
 z.literal(""),
 ]).optional(),
 image: z.string().optional(), // In MVP this might be a URL or handled separately
 tradingGoal: z.string().optional(),
}).strict();

export async function GET() {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();

 if (!user) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 try {
 const dbUser = await prisma.user.findUnique({
 where: { id: user.id },
 include: { profile: true }
 });

 if (!dbUser) {
 return NextResponse.json({ error: "User not found" }, { status: 404 });
 }

 const onboarding = await getOnboardingState(user.id);

 return NextResponse.json({
 id: dbUser.id,
 name: dbUser.name,
 email: dbUser.email,
 image: dbUser.image,
 bio: dbUser.profile?.bio || "",
 telegramId: dbUser.profile?.telegramId || "",
 country: dbUser.profile?.country || "",
 role: dbUser.profile?.role || "USER",
 streak: dbUser.streak || 0,
 level: dbUser.level || 1,
 xp: dbUser.xp || 0,
 username: dbUser.profile?.username || dbUser.name || "",
 tradingGoal: onboarding?.tradingGoal || ""
 });

 } catch {
 return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
 }
}

export async function PUT(request: Request) {
 const supabase = await createClient();
 const { data: { user } } = await supabase.auth.getUser();
 if (!user) {
 return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
 }

 try {
 const body = await request.json();

 // Sanitize bio
 if (body.bio) {
 body.bio = sanitizeInput(body.bio);
 }

 const validatedData = updateProfileSchema.parse(body);
 const hasCountry = Object.prototype.hasOwnProperty.call(validatedData, "country");
 const normalizedCountry = normalizeCountryCode(validatedData.country);

 if (validatedData.tradingGoal) {
 await updateOnboardingSettings(user.id, {
 tradingGoal: validatedData.tradingGoal,
 });
 }

 // Update User table
 await prisma.user.update({
 where: { id: user.id },
 data: {
 name: validatedData.name,
 image: validatedData.image
 }
 });

 // Update or Create Profile
 await prisma.profile.upsert({
 where: { userId: user.id },
 update: { 
 bio: validatedData.bio,
 telegramId: validatedData.telegramId,
 country: hasCountry ? normalizedCountry : undefined
 },
 create: {
 userId: user.id,
 bio: validatedData.bio,
 telegramId: validatedData.telegramId,
 country: normalizedCountry
 }
 });

 return NextResponse.json({ message: "Profile updated successfully" });

 } catch (error: any) {
 console.error("Profile update error:", error);
 if (error instanceof z.ZodError) {
 return NextResponse.json({ error: error.issues }, { status: 400 });
 }
 return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
 }
}
