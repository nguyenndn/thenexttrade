import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { createClient } from "@/lib/supabase/server";
import { z } from "zod";

function sanitizeCommentPlainText(raw: string): string {
    if (!raw) return "";
    return raw
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
        .replace(/<[^>]*>/g, "")
        .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
        .trim();
}

// Schema for creating a comment - enhanced for security and anti-spam
const createCommentSchema = z.object({
    content: z
        .string()
        .transform((val) => sanitizeCommentPlainText(val))
        .pipe(
            z
                .string()
                .min(2, "Comment must be at least 2 characters long")
                .max(2000, "Comment cannot exceed 2000 characters")
        ),
    parentId: z.string().optional().nullable(),
});

// GET: List comments for an article
export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const params = await props.params;
        const articleId = params.id;

        const comments = await prisma.comment.findMany({
            where: {
                articleId: articleId,
                parentId: null, // Only fetch top-level comments first
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
                replies: {
                    // Fetch one level of replies deeply if needed, or just fetches
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                image: true,
                            },
                        },
                    },
                    orderBy: { createdAt: "asc" },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(comments);
    } catch (error) {
        console.error("Error fetching comments:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}

// POST: Create a new comment
export async function POST(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const supabase = await createClient();
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            return NextResponse.json(
                { error: "Unauthorized" },
                { status: 401 }
            );
        }

        const body = await request.json();
        const validation = createCommentSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { content, parentId } = validation.data;
        const params = await props.params;
        const articleId = params.id;

        // Flatten depth-2+ replies onto the root parent comment so nested replies never disappear
        let effectiveParentId: string | null = parentId || null;
        if (effectiveParentId) {
            const parentComment = await prisma.comment.findUnique({
                where: { id: effectiveParentId },
                select: { id: true, parentId: true, articleId: true },
            });
            if (!parentComment || parentComment.articleId !== articleId) {
                return NextResponse.json(
                    { error: "Parent comment not found" },
                    { status: 404 }
                );
            }
            effectiveParentId = parentComment.parentId || parentComment.id;
        }

        const comment = await prisma.comment.create({
            data: {
                content,
                userId: user.id,
                articleId,
                parentId: effectiveParentId,
            },
            include: {
                user: {
                    select: {
                        id: true,
                        name: true,
                        image: true,
                    },
                },
            },
        });

        return NextResponse.json(comment, { status: 201 });
    } catch (error) {
        console.error("Error creating comment:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
