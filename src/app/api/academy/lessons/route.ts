
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const lessonSchema = z.object({
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    slug: z.string().min(1, "Slug is required"), // TODO: Auto-generate slug if not provided
    videoUrl: z.string().optional(),
    duration: z.number().int().optional(),
    moduleId: z.string().min(1, "Module ID is required"),
    order: z.number().int().optional(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = lessonSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { title, content, slug, videoUrl, duration, moduleId, order } = validation.data;

        let newOrder = order;
        if (newOrder === undefined) {
            const lastLesson = await prisma.lesson.findFirst({
                where: { moduleId },
                orderBy: { order: "desc" },
            });
            newOrder = (lastLesson?.order || 0) + 1;
        }

        const lesson = await prisma.lesson.create({
            data: {
                title,
                content,
                slug,
                videoUrl,
                duration,
                moduleId,
                order: newOrder,
            },
        });

        return NextResponse.json(lesson);
    } catch (error) {
        console.error("[LESSON_POST]", error);
        // Check for unique slug violation
        if ((error as any).code === 'P2002') {
            return NextResponse.json({ error: "Slug already exists" }, { status: 409 });
        }
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
