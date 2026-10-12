import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { normalizeCountryCode } from "@/lib/country-utils";
import { sanitizeInput } from "@/lib/sanitize";
import {
    getOnboardingState,
    updateOnboardingSettings,
} from "@/lib/onboarding/onboarding.server";

export const dynamic = "force-dynamic";

const updateProfileSchema = z
    .object({
        name: z.string().min(2, "Name must be at least 2 characters"),
        username: z
            .string()
            .trim()
            .min(3, "Username must be at least 3 characters")
            .max(30, "Username must be at most 30 characters")
            .regex(
                /^[a-zA-Z0-9_]+$/,
                "Username can only contain letters, numbers, and underscores"
            )
            .optional()
            .or(z.literal("")),
        bio: z.string().optional(),
        telegramId: z.string().optional(),
        country: z
            .union([
                z
                    .string()
                    .trim()
                    .regex(
                        /^[A-Za-z]{2}$/,
                        "Country must be a two-letter country code"
                    ),
                z.literal(""),
            ])
            .optional(),
        image: z
            .union([
                z.string().url().startsWith("https://"),
                z.literal(""),
            ])
            .optional(),
        tradingGoal: z.string().optional(),
    })
    .strict();

export async function GET() {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ user: null }, { status: 200 });
    }

    try {
        const dbUser = await prisma.user.findUnique({
            where: { id: user.id },
            include: { profile: true },
        });

        if (!dbUser) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
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
            username: dbUser.profile?.username || "",
            tradingGoal: onboarding?.tradingGoal || "",
        });
    } catch {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function PUT(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Sanitize bio
        if (body.bio) {
            body.bio = sanitizeInput(body.bio);
        }

        // Normalize country BEFORE validation: schema accepts ISO-2 codes.
        // Ensures backwards-compatibility for clients sending full country names ("Vietnam" -> "VN").
        if (typeof body.country === "string" && body.country.trim() !== "") {
            body.country = normalizeCountryCode(body.country) ?? body.country;
        }

        const validatedData = updateProfileSchema.parse(body);
        const hasCountry = Object.prototype.hasOwnProperty.call(
            validatedData,
            "country"
        );
        const normalizedCountry = normalizeCountryCode(validatedData.country);

        const hasUsername = Object.prototype.hasOwnProperty.call(
            validatedData,
            "username"
        );
        const cleanUsername = hasUsername && validatedData.username
            ? validatedData.username.trim().toLowerCase()
            : validatedData.username === ""
                ? null
                : undefined;

        if (cleanUsername) {
            const existingProfile = await prisma.profile.findFirst({
                where: {
                    username: cleanUsername,
                    userId: { not: user.id },
                },
                select: { userId: true },
            });
            if (existingProfile) {
                return NextResponse.json(
                    { error: "Username is already taken by another trader." },
                    { status: 400 }
                );
            }
        }

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
                image: validatedData.image,
            },
        });

        // Sync with Supabase Auth metadata so OAuth metadata does not drift
        try {
            await supabase.auth.updateUser({
                data: {
                    ...(validatedData.image !== undefined ? { avatar_url: validatedData.image } : {}),
                    ...(validatedData.name !== undefined ? { full_name: validatedData.name } : {}),
                },
            });
        } catch {
            // Non-blocking: Prisma User model is the primary source of truth
        }

        // Country is immutable once registered — cannot be changed after registration
        const currentProfile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { country: true },
        });
        const targetCountry = currentProfile?.country
            ? currentProfile.country
            : (hasCountry ? normalizedCountry : undefined);

        // Update or Create Profile
        await prisma.profile.upsert({
            where: { userId: user.id },
            update: {
                bio: validatedData.bio,
                telegramId: validatedData.telegramId,
                country: targetCountry,
                ...(hasUsername ? { username: cleanUsername } : {}),
            },
            create: {
                userId: user.id,
                bio: validatedData.bio,
                telegramId: validatedData.telegramId,
                country: normalizedCountry,
                username: cleanUsername ?? null,
            },
        });

        revalidatePath("/dashboard/settings");
        revalidatePath("/dashboard/settings/profile");
        revalidatePath("/dashboard", "layout");

        return NextResponse.json({ message: "Profile updated successfully" });
    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json(
            { error: error?.message || "Internal Server Error" },
            { status: 500 }
        );
    }
}
