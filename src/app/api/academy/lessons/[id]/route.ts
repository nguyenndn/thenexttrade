
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const lessonUpdateSchema = z.object({
    title: z.string().min(1).optional(),
    content: z.string().min(1).optional(),
    slug: z.string().min(1).optional(),
    videoUrl: z.string().optional().nullable(),
    duration: z.number().int().optional(),
    order: z.number().int().optional(),
    moduleId: z.string().optional(), // In case of moving lesson
});

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const lesson = await prisma.lesson.findUnique({
            where: { id },
        });

        if (!lesson) {
            return NextResponse.json({ error: "Lesson not found" }, { status: 404 });
        }

        return NextResponse.json(lesson);
    } catch (error) {
        console.error("[LESSON_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const validation = lessonUpdateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const lesson = await prisma.lesson.update({
            where: { id },
            data: validation.data,
        });

        return NextResponse.json(lesson);
    } catch (error) {
        console.error("[LESSON_PUT]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.lesson.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Lesson deleted" });
    } catch (error) {
        console.error("[LESSON_DELETE]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
