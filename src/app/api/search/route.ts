import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { isAcademyEnabled } from "@/app/admin/academy/actions";
import { ALL_TOOLS } from "@/config/tools-data";
import { TRADING_SYSTEMS_DATA } from "@/config/trading-systems-data";

export const dynamic = "force-dynamic";

interface SearchResultEntry {
    type: "article" | "lesson" | "tool" | "system" | "strategy" | "user";
    id: string;
    title: string;
    slug: string;
    description: string;
    image: string | null;
    date: Date | string;
    meta: Record<string, unknown>;
}

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "all";
    const scope = searchParams.get("scope") || "public";

    if (!query || query.trim().length === 0) {
        return NextResponse.json({ data: [] });
    }

    const searchQuery = query.trim();
    const normalizedQuery = searchQuery.toLowerCase();

    try {
        const results: SearchResultEntry[] = [];

        // --- Admin Scope Logic ---
        if (scope === "admin") {
            // Check auth - only allow ADMIN and EDITOR to search admin scope
            const { createServerClient } = await import("@supabase/ssr");
            const { cookies } = await import("next/headers");
            const cookieStore = await cookies();
            const supabase = createServerClient(
                process.env.NEXT_PUBLIC_SUPABASE_URL!,
                process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                { cookies: { getAll: () => cookieStore.getAll() } }
            );
            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (!user) {
                return NextResponse.json(
                    { error: "Unauthorized" },
                    { status: 401 }
                );
            }

            const profile = await prisma.profile.findUnique({
                where: { userId: user.id },
                select: { role: true },
            });

            if (
                !profile ||
                profile.role !== "ADMIN"
            ) {
                return NextResponse.json(
                    { error: "Forbidden" },
                    { status: 403 }
                );
            }

            if (type === "all" || type === "article") {
                const articles = await prisma.article.findMany({
                    where: {
                        OR: [
                            {
                                title: {
                                    contains: searchQuery,
                                    mode: "insensitive",
                                },
                            },
                            {
                                excerpt: {
                                    contains: searchQuery,
                                    mode: "insensitive",
                                },
                            },
                            {
                                content: {
                                    contains: searchQuery,
                                    mode: "insensitive",
                                },
                            },
                        ],
                    },
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        thumbnail: true,
                        updatedAt: true,
                        category: { select: { name: true } },
                    },
                    take: 20,
                    orderBy: { updatedAt: "desc" },
                });

                    results.push(
                        ...articles.map((article) => ({
                            type: "article" as const,
                            id: article.id,
                            title: article.title,
                            slug: `/admin/articles/${article.id}/edit`,
                            description: `[${article.status}] ${article.category.name}`,
                            image: article.thumbnail,
                            date: article.updatedAt,
                            meta: { status: article.status },
                        }))
                    );
                }

                // Can add User search here for admins too
                if (type === "all" || type === "user") {
                    const users = await prisma.user.findMany({
                        where: {
                            OR: [
                                {
                                    email: {
                                        contains: searchQuery,
                                        mode: "insensitive",
                                    },
                                },
                                {
                                    name: {
                                        contains: searchQuery,
                                        mode: "insensitive",
                                    },
                                },
                            ],
                        },
                        take: 5,
                    });

                    results.push(
                        ...users.map((u) => ({
                            type: "user" as const,
                            id: u.id,
                            title: u.name || "No Name",
                            slug: `/admin/users/${u.id}`,
                            description: u.email || "",
                            image: u.image,
                            date: u.createdAt,
                            meta: { role: "User" },
                        }))
                    );
                }
            }
            // --- Public Scope Logic ---
            else {
                // Static Public Tools (ALL_TOOLS)
                if (type === "all" || type === "tool") {
                    const matchedTools = ALL_TOOLS.filter(
                        (tool) =>
                            tool.title.toLowerCase().includes(normalizedQuery) ||
                            tool.shortTitle.toLowerCase().includes(normalizedQuery) ||
                            tool.description.toLowerCase().includes(normalizedQuery) ||
                            tool.category.toLowerCase().includes(normalizedQuery)
                    ).slice(0, 8);

                    results.push(
                        ...matchedTools.map((tool) => ({
                            type: "tool" as const,
                            id: tool.slug,
                            title: tool.title,
                            slug: `/tools/${tool.slug}`,
                            description: tool.description,
                            image: null,
                            date: new Date().toISOString(),
                            meta: { category: tool.category },
                        }))
                    );
                }

                // Static Trading Systems (TRADING_SYSTEMS_DATA)
                if (type === "all" || type === "system" || type === "strategy") {
                    const matchedSystems = TRADING_SYSTEMS_DATA.filter(
                        (sys) =>
                            sys.title.toLowerCase().includes(normalizedQuery) ||
                            sys.description.toLowerCase().includes(normalizedQuery) ||
                            sys.targetAsset.toLowerCase().includes(normalizedQuery) ||
                            sys.strategyStyle.toLowerCase().includes(normalizedQuery)
                    ).slice(0, 6);

                    results.push(
                        ...matchedSystems.map((sys) => ({
                            type: "system" as const,
                            id: sys.slug,
                            title: sys.title,
                            slug: `/trading-systems/${sys.slug}`,
                            description: sys.description,
                            image: null,
                            date: new Date().toISOString(),
                            meta: {
                                platform: sys.platform,
                                targetAsset: sys.targetAsset,
                            },
                        }))
                    );
                }

                if (type === "all" || type === "article") {
                    const articles = await prisma.article.findMany({
                        where: {
                            status: "PUBLISHED",
                            OR: [
                                {
                                    title: {
                                        contains: searchQuery,
                                        mode: "insensitive",
                                    },
                                },
                                {
                                    excerpt: {
                                        contains: searchQuery,
                                        mode: "insensitive",
                                    },
                                },
                                {
                                    content: {
                                        contains: searchQuery,
                                        mode: "insensitive",
                                    },
                                },
                            ],
                        },
                        select: {
                            id: true,
                            title: true,
                            slug: true,
                            excerpt: true,
                            thumbnail: true,
                            createdAt: true,
                            category: {
                                select: { name: true, slug: true },
                            },
                        },
                        take: 10,
                        orderBy: { createdAt: "desc" },
                    });

                    results.push(
                        ...articles.map((article) => ({
                            type: "article" as const,
                            id: article.id,
                            title: article.title,
                            slug: `/articles/${article.slug}`,
                            description: article.excerpt || "",
                            image: article.thumbnail,
                            date: article.createdAt,
                            meta: { category: article.category.name },
                        }))
                    );
                }

                // Search Lessons & User Strategies (only for authenticated users)
                if (type === "all" || type === "lesson" || type === "strategy") {
                    const { createServerClient } = await import("@supabase/ssr");
                    const { cookies } = await import("next/headers");
                    const cookieStore = await cookies();
                    const supabase = createServerClient(
                        process.env.NEXT_PUBLIC_SUPABASE_URL!,
                        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
                        { cookies: { getAll: () => cookieStore.getAll() } }
                    );
                    const {
                        data: { user },
                    } = await supabase.auth.getUser();

                    if (user) {
                        if (type === "all" || type === "strategy") {
                            const strategies = await prisma.strategy.findMany({
                                where: {
                                    userId: user.id,
                                    OR: [
                                        {
                                            name: {
                                                contains: searchQuery,
                                                mode: "insensitive",
                                            },
                                        },
                                        {
                                            description: {
                                                contains: searchQuery,
                                                mode: "insensitive",
                                            },
                                        },
                                    ],
                                },
                                select: {
                                    id: true,
                                    name: true,
                                    description: true,
                                    updatedAt: true,
                                    setupType: true,
                                },
                                take: 5,
                                orderBy: { updatedAt: "desc" },
                            });

                            results.push(
                                ...strategies.map((s) => ({
                                    type: "strategy" as const,
                                    id: s.id,
                                    title: s.name,
                                    slug: "/dashboard/strategies",
                                    description:
                                        s.description ||
                                        "Personal trading playbook and execution rules.",
                                    image: null,
                                    date: s.updatedAt,
                                    meta: { setupType: s.setupType },
                                }))
                            );
                        }

                        if (type === "all" || type === "lesson") {
                            const academyEnabled = await isAcademyEnabled();
                            let canSearchLessons = academyEnabled;

                            if (!canSearchLessons) {
                                const profile = await prisma.profile.findUnique({
                                    where: { userId: user.id },
                                    select: { role: true },
                                });
                                canSearchLessons = profile?.role === "ADMIN";
                            }

                            if (canSearchLessons) {
                                const lessons = await prisma.lesson.findMany({
                                    where: {
                                        status: "published",
                                        OR: [
                                            {
                                                title: {
                                                    contains: searchQuery,
                                                    mode: "insensitive",
                                                },
                                            },
                                            {
                                                content: {
                                                    contains: searchQuery,
                                                    mode: "insensitive",
                                                },
                                            },
                                        ],
                                    },
                                    select: {
                                        id: true,
                                        title: true,
                                        slug: true,
                                        updatedAt: true,
                                        module: {
                                            select: {
                                                title: true,
                                                level: { select: { title: true } },
                                            },
                                        },
                                    },
                                    take: 10,
                                });

                                results.push(
                                    ...lessons.map((lesson) => ({
                                        type: "lesson" as const,
                                        id: lesson.id,
                                        title: lesson.title,
                                        slug: `/dashboard/academy/lessons/${lesson.slug}`,
                                        description: `Lesson in ${lesson.module.level.title} - ${lesson.module.title}`,
                                        image: null,
                                        date: lesson.updatedAt,
                                        meta: { module: lesson.module.title },
                                    }))
                                );
                            }
                        }
                    }
                }
            }

        // Sort combined results by date check (optional, or relevance)
        // For now, simple sort or leave as is.
        // If "all", maybe interleave? Or just simple sort?
        // Let's sort by date descending to show freshest content first
        results.sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
        );

        return NextResponse.json({
            data: results,
            meta: {
                total: results.length,
                query: searchQuery,
                scope: scope,
            },
        });
    } catch (error) {
        console.error("Search API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
