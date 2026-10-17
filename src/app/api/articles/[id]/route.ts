import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
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
            return NextResponse.json(
                { error: "Article not found" },
                { status: 404 }
            );
        }

        // Draft/PENDING/ARCHIVED content is admin-only tooling — never leak it
        // (or its existence) to public callers.
        if (article.status !== "PUBLISHED") {
            const auth = await requireAdmin();
            if (auth instanceof NextResponse) return auth;
        }

        return NextResponse.json(article);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch article" },
            { status: 500 }
        );
    }
}

export async function PUT(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    try {
        const body = await request.json();
        // Skip restrictive Zod validation to allow new fields easily
        const {
            title,
            content,
            excerpt,
            thumbnail,
            status,
            categoryId,
            isFeatured,
            metaTitle,
            metaDescription,
            publishedAt,
            slug,
            tags,
            focusKeyword,
        } = body;

        const VALID_STATUSES = ["DRAFT", "PUBLISHED", "PENDING", "ARCHIVED"];
        if (status !== undefined && !VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { error: "Invalid status" },
                { status: 400 }
            );
        }

        const data: any = {};
        if (title) data.title = title;
        if (slug !== undefined) {
            const normalizedSlug = String(slug)
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");
            if (!normalizedSlug) {
                return NextResponse.json(
                    { error: "Invalid slug" },
                    { status: 400 }
                );
            }
            data.slug = normalizedSlug;
        }
        if (content) data.content = content;
        if (excerpt !== undefined) data.excerpt = excerpt;
        if (thumbnail !== undefined) data.thumbnail = thumbnail;
        if (status) data.status = status;
        if (categoryId) data.categoryId = categoryId;
        if (isFeatured !== undefined) data.isFeatured = isFeatured;

        // Handle author change
        if (body.authorId) {
            data.authorId = body.authorId;
        }

        // New fields
        if (metaTitle !== undefined) data.metaTitle = metaTitle;
        if (metaDescription !== undefined)
            data.metaDescription = metaDescription;
        if (focusKeyword !== undefined) data.focusKeyword = focusKeyword;
        if (publishedAt !== undefined) {
            if (publishedAt) {
                const parsedDate = new Date(publishedAt);
                if (Number.isNaN(parsedDate.getTime())) {
                    return NextResponse.json(
                        { error: "publishedAt must be a valid date" },
                        { status: 400 }
                    );
                }
                data.publishedAt = parsedDate;
            } else {
                data.publishedAt = null;
            }
        } else if (status === "PUBLISHED") {
            const current = await prisma.article.findUnique({
                where: { id: params.id },
                select: { publishedAt: true },
            });
            if (current && !current.publishedAt) {
                data.publishedAt = new Date();
            }
        }
        if (body.schemaType !== undefined) data.schemaType = body.schemaType;
        if (body.estimatedTime !== undefined) {
            if (body.estimatedTime === null || body.estimatedTime === "") {
                data.estimatedTime = null;
            } else {
                const parsedTime = parseInt(body.estimatedTime, 10);
                if (Number.isNaN(parsedTime)) {
                    return NextResponse.json(
                        { error: "estimatedTime must be a number" },
                        { status: 400 }
                    );
                }
                data.estimatedTime = parsedTime;
            }
        }

        // AI Content Pipeline metadata
        if (body.tone !== undefined) data.tone = body.tone || null;
        if (body.sourceUrls !== undefined)
            data.sourceUrls = Array.isArray(body.sourceUrls)
                ? body.sourceUrls
                : [];

        if (tags && Array.isArray(tags)) {
            data.tags = {
                deleteMany: {}, // Clear existing
                create: tags.map((tagId: string) => ({
                    tag: { connect: { id: tagId } },
                })),
            };
        }

        const article = await prisma.article.update({
            where: { id: params.id },
            data,
        });

        return NextResponse.json(article);
    } catch (error: any) {
        console.error(error);
        if (error.code === "P2002") {
            // Unique constraint
            return NextResponse.json(
                { error: "Slug already exists" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Failed to update article" },
            { status: 500 }
        );
    }
}

export async function DELETE(
    request: Request,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    try {
        await prisma.$transaction(async (tx) => {
            await tx.comment.updateMany({
                where: { articleId: params.id },
                data: { parentId: null },
            });
            await tx.comment.deleteMany({
                where: { articleId: params.id },
            });
            await tx.article.delete({
                where: { id: params.id },
            });
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to delete article" },
            { status: 500 }
        );
    }
}
