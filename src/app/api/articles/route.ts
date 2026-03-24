
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma"; // Assuming prisma client is exported here, need to verify
import { NextResponse } from "next/server";
import { z } from "zod";
import { cache } from "@/lib/cache";

// DTO Schema
const articleSchema = z.object({
    title: z.string().min(3),
    slug: z.string().min(3).optional(), // Can be auto-generated
    content: z.string().min(10),
    excerpt: z.string().optional(),
    categoryId: z.string(),
    status: z.enum(["DRAFT", "PUBLISHED", "PENDING", "ARCHIVED"]).default("DRAFT"),
    thumbnail: z.string().optional(),
    isFeatured: z.boolean().optional(),
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const categoryId = searchParams.get("categoryId");

    const skip = (page - 1) * limit;

    const where: any = {};
    if (status) where.status = status;
    if (categoryId) where.categoryId = categoryId;

    const cacheKey = `articles:list:${page}:${limit}:${status || 'all'}:${categoryId || 'all'}`;

    try {
        const { articles, total } = await cache.wrap(cacheKey, async () => {
            const [articles, total] = await Promise.all([
                prisma.article.findMany({
                    where,
                    include: {
                        category: { select: { id: true, name: true, slug: true } },
                        author: { select: { name: true, image: true } },
                    },
                    skip,
                    take: limit,
                    orderBy: { createdAt: "desc" },
                }),
                prisma.article.count({ where }),
            ]);
            return { articles, total };
        }, 600);

        return NextResponse.json({
            data: articles,
            meta: {
                total,
                page,
                limit,
                totalPages: Math.ceil(total / limit),
            },
        });
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch articles" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true }
    });

    if (profile?.role !== "ADMIN" && profile?.role !== "EDITOR") {
        return NextResponse.json({ error: "Forbidden: Admin access required" }, { status: 403 });
    }

    try {
        const body = await request.json();
        const { title, content, excerpt, thumbnail, status, categoryId, isFeatured, metaTitle, metaDescription, publishedAt, slug, tags, focusKeyword, schemaType, estimatedTime } = body;

        // Manual validation since Zod schema is simple and we have optional complex fields
        if (!title || !content || !categoryId) {
            return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
        }

        let finalSlug = slug;
        if (!finalSlug || finalSlug.trim() === "") {
            finalSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        }

        const existing = await prisma.article.findUnique({ where: { slug: finalSlug } });
        if (existing) {
            // Collision detected. Find the next available incremental suffix.
            // Fetch all slugs that start with the base slug to determine the next number.
            const collisions = await prisma.article.findMany({
                where: {
                    OR: [
                        { slug: finalSlug },
                        { slug: { startsWith: `${finalSlug}-` } }
                    ]
                },
                select: { slug: true }
            });

            let maxNumber = 0;
            const regex = new RegExp(`^${finalSlug}-(\\d+)$`);

            for (const item of collisions) {
                if (item.slug === finalSlug) continue; // Base slug is effectively suffix 0

                const match = item.slug.match(regex);
                if (match) {
                    const num = parseInt(match[1], 10);
                    if (!isNaN(num) && num > maxNumber) {
                        maxNumber = num;
                    }
                }
            }

            finalSlug = `${finalSlug}-${maxNumber + 1}`;
        }

        const data: any = {
            title,
            slug: finalSlug,
            content: content || "", // Allow empty content for draft
            excerpt,
            thumbnail,
            status: status || "DRAFT",
            categoryId, // Category is still required for relationship integrity, but UI can default it.
            isFeatured: isFeatured || false,
            metaTitle,
            metaDescription,
            focusKeyword,
            schemaType: schemaType || "ARTICLE",
            estimatedTime: estimatedTime ? parseInt(estimatedTime) : null,
            publishedAt: publishedAt ? new Date(publishedAt) : null,
            authorId: user.id
        };

        // For Drafts, allow missing category/content if we make schema optional? 
        // Schema says categoryId is required. So we must ensure it's sent.
        // Frontend handles defaulting.

        if (status === 'PUBLISHED') {
            if (!content || !categoryId) {
                return NextResponse.json({ error: "Content and Category are required for Publishing" }, { status: 400 });
            }
        }

        if (tags && Array.isArray(tags)) {
            data.tags = {
                create: tags.map((tagId: string) => ({
                    tag: { connect: { id: tagId } }
                }))
            };
        }

        const article = await prisma.article.create({
            data
        });

        return NextResponse.json(article, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Failed to create article" }, { status: 500 });
    }
}
