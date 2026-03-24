
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const updateArticleSchema = z.object({
    title: z.string().min(3).optional(),
    slug: z.string().min(3).optional(),
    content: z.string().min(10).optional(),
    excerpt: z.string().optional(),
    categoryId: z.string().optional(),
    status: z.enum(["DRAFT", "PUBLISHED", "PENDING", "ARCHIVED"]).optional(),
    thumbnail: z.string().optional(),
    isFeatured: z.boolean().optional(),
});


export async function GET(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    try {
        const article = await prisma.article.findUnique({
            where: { id: params.id },
            include: {
                category: true,
                author: { select: { name: true, image: true } },
            },
        });

        if (!article) {
            return NextResponse.json({ error: "Article not found" }, { status: 404 });
        }

        return NextResponse.json(article);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch article" }, { status: 500 });
    }
}

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        // Skip restrictive Zod validation to allow new fields easily
        const { title, content, excerpt, thumbnail, status, categoryId, isFeatured, metaTitle, metaDescription, publishedAt, slug, tags, focusKeyword } = body;

        const data: any = {};
        if (title) data.title = title;
        if (slug) data.slug = slug;
        if (content) data.content = content;
        if (excerpt !== undefined) data.excerpt = excerpt;
        if (thumbnail !== undefined) data.thumbnail = thumbnail;
        if (status) data.status = status;
        if (categoryId) data.categoryId = categoryId;
        if (isFeatured !== undefined) data.isFeatured = isFeatured;

        // Handle author change (assuming current user is admin)
        // In real app, check user role before allowing this.
        if (body.authorId) {
            data.authorId = body.authorId;
        }

        // New fields
        if (metaTitle !== undefined) data.metaTitle = metaTitle;
        if (metaDescription !== undefined) data.metaDescription = metaDescription;
        if (focusKeyword !== undefined) data.focusKeyword = focusKeyword;
        if (publishedAt !== undefined) data.publishedAt = publishedAt ? new Date(publishedAt) : null;
        if (body.schemaType !== undefined) data.schemaType = body.schemaType;
        if (body.estimatedTime !== undefined) data.estimatedTime = body.estimatedTime ? parseInt(body.estimatedTime) : null;

        if (tags && Array.isArray(tags)) {
            data.tags = {
                deleteMany: {}, // Clear existing
                create: tags.map((tagId: string) => ({
                    tag: { connect: { id: tagId } }
                }))
            };
        }

        const article = await prisma.article.update({
            where: { id: params.id },
            data,
        });

        return NextResponse.json(article);
    } catch (error: any) {
        console.error(error);
        if (error.code === 'P2002') { // Unique constraint
            return NextResponse.json({ error: "Slug already exists" }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to update article" }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    try {
        await prisma.article.delete({
            where: { id: params.id },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete article" }, { status: 500 });
    }
}

