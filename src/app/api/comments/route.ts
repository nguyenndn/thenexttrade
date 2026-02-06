
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

import DOMPurify from "isomorphic-dompurify";

const createCommentSchema = z.object({
    content: z.string().min(1, "Comment cannot be empty"),
    articleId: z.string().optional(),
    lessonId: z.string().optional(),
    parentId: z.string().optional(),
}).refine(data => data.articleId || data.lessonId, {
    message: "Either articleId or lessonId must be provided"
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const articleId = searchParams.get("articleId");
    const lessonId = searchParams.get("lessonId");

    if (!articleId && !lessonId) {
        return NextResponse.json({ error: "Missing articleId or lessonId" }, { status: 400 });
    }

    try {
        const comments = await prisma.comment.findMany({
            where: {
                articleId: articleId || undefined,
                lessonId: lessonId || undefined,
                parentId: null // Fetch top-level comments first
            },
            include: {
                user: { select: { name: true, image: true } },
                replies: {
                    include: {
                        user: { select: { name: true, image: true } }
                    },
                    orderBy: { createdAt: 'asc' }
                }
            },
            orderBy: { createdAt: "desc" }
        });

        return NextResponse.json(comments);
    } catch (error) {
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

        // Sanitize content
        if (body.content) {
            body.content = DOMPurify.sanitize(body.content);
        }

        const validatedData = createCommentSchema.parse(body);

        // Sync user if needed (reusing the logic from Journal for robustness)
        const userExists = await prisma.user.findUnique({ where: { id: user.id } });
        if (!userExists) {
            await prisma.user.create({
                data: {
                    id: user.id,
                    email: user.email,
                    name: user.user_metadata?.full_name || user.email?.split('@')[0],
                    image: user.user_metadata?.avatar_url
                }
            });
        }

        const comment = await prisma.comment.create({
            data: {
                userId: user.id,
                content: validatedData.content,
                articleId: validatedData.articleId,
                lessonId: validatedData.lessonId,
                parentId: validatedData.parentId
            },
            include: {
                user: { select: { name: true, image: true } }
            }
        });

        return NextResponse.json(comment);

    } catch (error: any) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("COMMENTPOST_ERROR", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
