
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q");
    const type = searchParams.get("type") || "all"; // all, article, lesson, user (for admin)
    const scope = searchParams.get("scope") || "public"; // public, admin

    if (!query || query.trim().length === 0) {
        return NextResponse.json({ data: [] });
    }

    const searchQuery = query.trim();

    try {
        const results: any[] = [];

        // --- Admin Scope Logic ---
        if (scope === "admin") {
            // Check permissions here if needed using Supabase, though this is an internal API usually protected by Middleware or Client checks.
            // For extra security, verify user role here.

            if (type === "all" || type === "article") {
                const articles = await prisma.article.findMany({
                    where: {
                        OR: [
                            { title: { contains: searchQuery, mode: "insensitive" } },
                            { excerpt: { contains: searchQuery, mode: "insensitive" } },
                            { content: { contains: searchQuery, mode: "insensitive" } }
                        ]
                    },
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        thumbnail: true,
                        updatedAt: true,
                        category: { select: { name: true } }
                    },
                    take: 20,
                    orderBy: { updatedAt: "desc" }
                });

                results.push(...articles.map(article => ({
                    type: "article",
                    id: article.id,
                    title: article.title,
                    slug: `/admin/articles/${article.id}/edit`, // ADMIN LINK
                    description: `[${article.status}] ${article.category.name}`, // Show status
                    image: article.thumbnail,
                    date: article.updatedAt,
                    meta: { status: article.status }
                })));
            }

            // Can add User search here for admins too
            if (type === "all" || type === "user") {
                const users = await prisma.user.findMany({
                    where: {
                        OR: [
                            { email: { contains: searchQuery, mode: "insensitive" } },
                            { name: { contains: searchQuery, mode: "insensitive" } }
                        ]
                    },
                    take: 5
                });

                results.push(...users.map(u => ({
                    type: "user",
                    id: u.id, // Fixed: use id instead of uuid
                    title: u.name || "No Name",
                    slug: `/admin/users/${u.id}`,
                    description: u.email,
                    image: u.image,
                    date: u.createdAt,
                    meta: { role: "User" } // Simplified
                })));
            }

        }
        // --- Public Scope Logic ---
        else {
            if (type === "all" || type === "article") {
                const articles = await prisma.article.findMany({
                    where: {
                        status: "PUBLISHED",
                        OR: [
                            { title: { contains: searchQuery, mode: "insensitive" } },
                            { excerpt: { contains: searchQuery, mode: "insensitive" } },
                            // Content search might be slow, enabling for now but can be removed if performance drops
                            { content: { contains: searchQuery, mode: "insensitive" } }
                        ]
                    },
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        excerpt: true,
                        thumbnail: true,
                        createdAt: true,
                        category: {
                            select: { name: true, slug: true }
                        }
                    },
                    take: 10,
                    orderBy: { createdAt: "desc" }
                });

                results.push(...articles.map(article => ({
                    type: "article",
                    id: article.id,
                    title: article.title,
                    slug: `/articles/${article.slug}`,
                    description: article.excerpt,
                    image: article.thumbnail,
                    date: article.createdAt,
                    meta: { category: article.category.name }
                })));
            }

            // Search Lessons
            if (type === "all" || type === "lesson") {
                const lessons = await prisma.lesson.findMany({
                    where: {
                        OR: [
                            { title: { contains: searchQuery, mode: "insensitive" } },
                            { content: { contains: searchQuery, mode: "insensitive" } }
                        ]
                    },
                    select: {
                        id: true,
                        title: true,
                        slug: true,
                        updatedAt: true,
                        module: {
                            select: {
                                title: true,
                                level: { select: { title: true } }
                            }
                        }
                    },
                    take: 10
                });

                results.push(...lessons.map(lesson => ({
                    type: "lesson",
                    id: lesson.id,
                    title: lesson.title,
                    slug: `/academy/lesson/${lesson.slug}`, // Verify URL structure later
                    description: `Lesson in ${lesson.module.level.title} - ${lesson.module.title}`,
                    image: null,
                    date: lesson.updatedAt,
                    meta: { module: lesson.module.title }
                })));
            }
        }

        // Sort combined results by date check (optional, or relevance)
        // For now, simple sort or leave as is. 
        // If "all", maybe interleave? Or just simple sort?
        // Let's sort by date descending to show freshest content first
        results.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

        return NextResponse.json({
            data: results,
            meta: {
                total: results.length,
                query: searchQuery,
                scope: scope
            }
        });

    } catch (error) {
        console.error("Search API Error:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
