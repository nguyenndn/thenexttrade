import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

function sanitizeCommentPlainText(raw: string): string {
    if (!raw) return "";
    return raw
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<[^>]*>/g, "")
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
        .trim();
}

const createCommentSchema = z
    .object({
        content: z
            .string()
            .trim()
            .min(1, "Comment cannot be empty")
            .max(2000, "Comment cannot exceed 2000 characters"),
        articleId: z.string().optional(),
        lessonId: z.string().optional(),
        parentId: z.string().optional().nullable(),
    })
    .refine((data) => data.articleId || data.lessonId, {
        message: "Either articleId or lessonId must be provided",
    });

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get("articleId");
    const lessonId = searchParams.get("lessonId");

    if (!articleId && !lessonId) {
        return NextResponse.json(
            { error: "Missing articleId or lessonId" },
            { status: 400 }
        );
    }

    try {
        const comments = await prisma.comment.findMany({
            where: {
                articleId: articleId || undefined,
                lessonId: lessonId || undefined,
                parentId: null, // Fetch top-level comments first
            },
            include: {
                user: { select: { name: true, image: true } },
                replies: {
                    include: {
                        user: { select: { name: true, image: true } },
                    },
                    orderBy: { createdAt: "asc" },
                },
            },
            orderBy: { createdAt: "desc" },
        });

        return NextResponse.json(comments);
    } catch (error) {
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();

        // Sanitize plain text without corrupting quotes/apostrophes into HTML entities
        if (typeof body.content === "string") {
            body.content = sanitizeCommentPlainText(body.content);
        }

        const validatedData = createCommentSchema.parse(body);

        // Flatten depth-2+ replies onto the root parent comment so nested replies never vanish
        let effectiveParentId: string | null = validatedData.parentId || null;
        if (effectiveParentId) {
            const parentComment = await prisma.comment.findUnique({
                where: { id: effectiveParentId },
                select: { id: true, parentId: true },
            });
            if (!parentComment) {
                return NextResponse.json(
                    { error: "Parent comment not found" },
                    { status: 404 }
                );
            }
            effectiveParentId = parentComment.parentId || parentComment.id;
        }

        // Sync user if needed (reusing the logic from Journal for robustness)
        const userExists = await prisma.user.findUnique({
            where: { id: user.id },
        });
        if (!userExists) {
            await prisma.user.create({
                data: {
                    id: user.id,
                    email: user.email,
                    name:
                        user.user_metadata?.full_name ||
                        user.email?.split("@")[0],
                    image: user.user_metadata?.avatar_url,
                },
            });
        }

        const comment = await prisma.comment.create({
            data: {
                userId: user.id,
                content: validatedData.content,
                articleId: validatedData.articleId,
                lessonId: validatedData.lessonId,
                parentId: effectiveParentId,
            },
            include: {
                user: { select: { id: true, name: true, image: true } },
            },
        });

        return NextResponse.json(comment);
    } catch (error: unknown) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("COMMENTPOST_ERROR", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
