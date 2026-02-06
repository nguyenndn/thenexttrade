import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateWithFallback } from "@/lib/ai/provider";
import { generateLessonPrompt } from "@/lib/ai/prompts";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 500,
});

const generateLessonSchema = z.object({
    title: z.string().min(1),
    topic: z.string().min(1),
    level: z.enum(["beginner", "intermediate", "advanced"]),
    length: z.enum(["short", "medium", "long"]),
    includeExamples: z.boolean().default(true),
});

export async function POST(request: Request) {
    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { role: true },
        });

        if (profile?.role !== "ADMIN") {
            return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
        }

        try {
            await limiter.check(10, user.id); // 10 requests per minute per user
        } catch {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        const body = await request.json();
        const validation = generateLessonSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: "Invalid input", details: validation.error }, { status: 400 });
        }

        const { title, topic, level, length, includeExamples } = validation.data;
        const prompt = generateLessonPrompt({ title, topic, level, length, includeExamples });

        const generationResult = await generateWithFallback(prompt);
        const content = generationResult.content;

        // Simple estimation: 200 words per minute reading speed
        const wordCount = content.split(/\s+/).length;
        const duration = Math.ceil(wordCount / 200);

        return NextResponse.json({
            success: true,
            data: {
                title,
                content,
                duration,
                summary: "AI Generated Lesson", // Placeholder, could generate separate summary if needed
                keyTakeaways: [], // Placeholder
            },
            usage: {
                // Token usage not returned by simple text method, would need fuller response object
                estimatedCost: 0,
            },
        });

    } catch (error: any) {
        console.error("Generate Lesson Error:", error);
        return NextResponse.json({
            success: false,
            error: {
                code: "GENERATION_ERROR",
                message: error.message || "Failed to generate lesson"
            }
        }, { status: 500 });
    }
}
