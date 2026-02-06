
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const progressSchema = z.object({
    lessonId: z.string().min(1),
    isCompleted: z.boolean().default(true),
});

export async function GET(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const progress = await prisma.userProgress.findMany({
            where: { userId: user.id },
            select: { lessonId: true, isCompleted: true, completedAt: true }
        });

        return NextResponse.json(progress);
    } catch (error) {
        console.error("Failed to fetch progress:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { lessonId, isCompleted } = progressSchema.parse(body);

        const progress = await prisma.userProgress.upsert({
            where: {
                userId_lessonId: {
                    userId: user.id,
                    lessonId: lessonId
                }
            },
            update: {
                isCompleted,
                completedAt: isCompleted ? new Date() : null
            },
            create: {
                userId: user.id,
                lessonId,
                isCompleted,
                completedAt: isCompleted ? new Date() : null
            }
        });

        return NextResponse.json(progress);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: "Invalid data", details: (error as any).errors }, { status: 400 });
        }
        console.error("Failed to update progress:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
