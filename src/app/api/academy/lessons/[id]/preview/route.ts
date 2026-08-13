import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // Look up by slug (the "id" param is actually a slug for preview).
    // Only published lessons may ever be previewed — otherwise a draft slug
    // would leak full lesson HTML to anonymous visitors.
    const lesson = await prisma.lesson.findFirst({
        where: { slug: id, status: "published" },
        select: {
            id: true,
            title: true,
            slug: true,
            content: true,
            duration: true,
            module: {
                select: {
                    title: true,
                    level: { select: { title: true, order: true } },
                },
            },
        },
    });

    if (!lesson) {
        return NextResponse.json(
            { error: "Lesson not found" },
            { status: 404 }
        );
    }

    return NextResponse.json({
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        content: lesson.content,
        duration: lesson.duration,
        moduleTitle: lesson.module.title,
        levelTitle: lesson.module.level.title,
        levelOrder: lesson.module.level.order,
    });
}
