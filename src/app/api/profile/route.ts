
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

export const dynamic = "force-dynamic";

const updateProfileSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    bio: z.string().optional(),
    image: z.string().optional(), // In MVP this might be a URL or handled separately
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

        return NextResponse.json({
            name: dbUser.name,
            email: dbUser.email,
            image: dbUser.image,
            bio: dbUser.profile?.bio || "",
            role: dbUser.profile?.role || "USER",
            streak: dbUser.streak || 0
        });

    } catch (error) {
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

import { sanitizeInput } from "@/lib/sanitize";

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
            update: { bio: validatedData.bio },
            create: {
                userId: user.id,
                bio: validatedData.bio
            }
        });

        return NextResponse.json({ message: "Profile updated successfully" });

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
