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
    status: z
        .enum(["DRAFT", "PUBLISHED", "PENDING", "ARCHIVED"])
        .default("DRAFT"),
    thumbnail: z.string().optional(),
    isFeatured: z.boolean().optional(),
});

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const status = searchParams.get("status");
    const categoryId = searchParams.get("categoryId");

    // Public callers must never receive drafts/PENDING/ARCHIVED content. Only
    // an authenticated ADMIN may pass an explicit status filter (for admin
    // tooling); everyone else is forced to published-only regardless of input.
    const supabase = await createClient();
    const {
        data: { user },
    } = await supabase.auth.getUser();
    let isAdmin = false;
    if (user) {
        const profile = await prisma.profile.findUnique({
            where: { userId: user.id },
            select: { role: true },
        });
        isAdmin = profile?.role === "ADMIN";
    }

    const skip = (page - 1) * limit;

    const where: any = {};
    if (isAdmin && status) {
        where.status = status;
    } else {
        where.status = "PUBLISHED";
    }
    if (categoryId) where.categoryId = categoryId;

    const cacheKey = `articles:list:${page}:${limit}:${
        isAdmin ? status || "all" : "published"
    }:${categoryId || "all"}`;

    try {
        const { articles, total } = await cache.wrap(
            cacheKey,
            async () => {
                const [articles, total] = await Promise.all([
                    prisma.article.findMany({
                        where,
                        include: {
                            category: {
                                select: { id: true, name: true, slug: true },
                            },
                            author: { select: { name: true, image: true } },
                        },
                        skip,
                        take: limit,
                        orderBy: { createdAt: "desc" },
                    }),
                    prisma.article.count({ where }),
                ]);
                return { articles, total };
            },
            600
        );

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
        return NextResponse.json(
            { error: "Failed to fetch articles" },
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

    const profile = await prisma.profile.findUnique({
        where: { userId: user.id },
        select: { role: true },
    });

    if (profile?.role !== "ADMIN") {
        return NextResponse.json(
            { error: "Forbidden: Admin access required" },
            { status: 403 }
        );
    }

    try {
        const body = await request.json();
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
            schemaType,
            estimatedTime,
        } = body;

        // Manual validation since Zod schema is simple and we have optional complex fields
        if (!title || !content || !categoryId) {
            return NextResponse.json(
                { error: "Missing required fields" },
                { status: 400 }
            );
        }

        const slugify = (s: string) =>
            s
                .trim()
                .toLowerCase()
                .replace(/[^a-z0-9]+/g, "-")
                .replace(/^-|-$/g, "");

        // Always normalize the slug — a raw user-supplied slug (spaces,
        // uppercase, slashes) would be unreachable at /articles/<slug> and
        // would break collision detection.
        let finalSlug = slugify(slug || title);
        if (!finalSlug) finalSlug = "article";

        // Validate status enum before it reaches Prisma (a bogus value would
        // otherwise surface as a generic 500).
        const VALID_STATUSES = ["DRAFT", "PUBLISHED", "PENDING", "ARCHIVED"];
        if (status && !VALID_STATUSES.includes(status)) {
            return NextResponse.json(
                { error: "Invalid status" },
                { status: 400 }
            );
        }

        // Validate numeric/date fields so parseInt("abc") / new Date("junk")
        // don't throw Prisma errors (NaN / Invalid Date) into a 500.
        const parsedEstimatedTime = estimatedTime
            ? parseInt(estimatedTime, 10)
            : null;
        if (
            parsedEstimatedTime !== null &&
            Number.isNaN(parsedEstimatedTime)
        ) {
            return NextResponse.json(
                { error: "estimatedTime must be a number" },
                { status: 400 }
            );
        }
        const parsedPublishedAt = publishedAt
            ? new Date(publishedAt)
            : null;
        if (parsedPublishedAt && Number.isNaN(parsedPublishedAt.getTime())) {
            return NextResponse.json(
                { error: "publishedAt must be a valid date" },
                { status: 400 }
            );
        }

        // Verify the category exists — a bogus id is an FK error → 500.
        const categoryExists = await prisma.category.findUnique({
            where: { id: categoryId },
            select: { id: true },
        });
        if (!categoryExists) {
            return NextResponse.json(
                { error: "Category not found" },
                { status: 400 }
            );
        }

        const existing = await prisma.article.findUnique({
            where: { slug: finalSlug },
        });
        if (existing) {
            // Collision detected. Find the next available incremental suffix.
            // Fetch all slugs that start with the base slug to determine the next number.
            const collisions = await prisma.article.findMany({
                where: {
                    OR: [
                        { slug: finalSlug },
                        { slug: { startsWith: `${finalSlug}-` } },
                    ],
                },
                select: { slug: true },
            });

            let maxNumber = 0;
            // Escape the slug before interpolating into the regex — a slug with
            // regex metacharacters (a+b, a(1), a.b) would otherwise silently
            // mis-detect collisions.
            const escapedSlug = finalSlug.replace(
                /[.*+?^${}()|[\]\\]/g,
                "\\$&"
            );
            const regex = new RegExp(`^${escapedSlug}-(\\d+)$`);

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
            estimatedTime: parsedEstimatedTime,
            publishedAt: parsedPublishedAt,
            authorId: user.id,
            // AI Content Pipeline metadata
            tone: body.tone || null,
            sourceUrls: Array.isArray(body.sourceUrls) ? body.sourceUrls : [],
        };

        // For Drafts, allow missing category/content if we make schema optional?
        // Schema says categoryId is required. So we must ensure it's sent.
        // Frontend handles defaulting.

        if (status === "PUBLISHED") {
            if (!content || !categoryId) {
                return NextResponse.json(
                    {
                        error: "Content and Category are required for Publishing",
                    },
                    { status: 400 }
                );
            }
        }

        if (tags && Array.isArray(tags)) {
            data.tags = {
                create: tags.map((tagId: string) => ({
                    tag: { connect: { id: tagId } },
                })),
            };
        }

        const article = await prisma.article.create({
            data,
        });

        return NextResponse.json(article, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json(
            { error: "Failed to create article" },
            { status: 500 }
        );
    }
}
