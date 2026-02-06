import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { generateWithFallback } from "@/lib/ai/provider";
import { generateStructurePrompt } from "@/lib/ai/prompts";
import { rateLimit } from "@/lib/rate-limit";

const limiter = rateLimit({
    interval: 60 * 1000,
    uniqueTokenPerInterval: 500,
});

const generateStructureSchema = z.object({
    type: z.enum(["level", "module"]),
    topic: z.string().min(1),
    targetAudience: z.enum(["beginner", "intermediate", "advanced"]),
    numItems: z.number().optional(),
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
            await limiter.check(10, user.id);
        } catch {
            return NextResponse.json({ error: "Too many requests" }, { status: 429 });
        }

        const body = await request.json();
        const validation = generateStructureSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json({ error: "Invalid input", details: validation.error }, { status: 400 });
        }

        const prompt = generateStructurePrompt(validation.data);
        const generationResult = await generateWithFallback(prompt);
        const textResponse = generationResult.content;

        const cleanJson = textResponse.replace(/^```json\s*/, "").replace(/\s*```$/, "");

        let data;
        try {
            data = JSON.parse(cleanJson);
        } catch (e) {
            return NextResponse.json({
                success: false,
                error: {
                    code: "PARSE_ERROR",
                    message: "Failed to parse AI response as JSON",
                    raw: textResponse
                }
            }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            data,
        });

    } catch (error: any) {
        console.error("Generate Structure Error:", error);
        return NextResponse.json({
            success: false,
            error: {
                code: "GENERATION_ERROR",
                message: error.message || "Failed to generate structure"
            }
        }, { status: 500 });
    }
}
