import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { ALL_TOOLS } from "@/config/tools-data";

const VALID_TOOL_SLUGS = new Set(ALL_TOOLS.map((tool) => tool.slug));

// POST: Track a tool view (increment view count)
export async function POST(request: Request) {
    try {
        const body = (await request.json().catch(() => null)) as {
            slug?: unknown;
        } | null;
        const rawSlug = typeof body?.slug === "string" ? body.slug.trim() : "";

        if (!rawSlug || !VALID_TOOL_SLUGS.has(rawSlug)) {
            return NextResponse.json(
                { success: false, error: "Invalid tool slug" },
                { status: 400 }
            );
        }

        await prisma.toolView.upsert({
            where: { slug: rawSlug },
            update: { viewCount: { increment: 1 } },
            create: { slug: rawSlug, viewCount: 1 },
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Tool view tracking error:", error);
        return NextResponse.json({ success: false }, { status: 500 });
    }
}

// GET: Get most popular tools (top N by view count)
export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const rawLimit = Number.parseInt(
            searchParams.get("limit") || "6",
            10
        );
        const limit = Number.isNaN(rawLimit)
            ? 6
            : Math.min(50, Math.max(1, rawLimit));

        const popular = await prisma.toolView.findMany({
            where: { slug: { in: Array.from(VALID_TOOL_SLUGS) } },
            orderBy: { viewCount: "desc" },
            take: limit,
        });

        return NextResponse.json({
            success: true,
            tools: popular.map((t) => ({
                slug: t.slug,
                viewCount: t.viewCount,
            })),
        });
    } catch (error) {
        console.error("Popular tools fetch error:", error);
        return NextResponse.json(
            { success: false, tools: [] },
            { status: 500 }
        );
    }
}
