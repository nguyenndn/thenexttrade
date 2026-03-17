import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST: Track a tool view (increment view count)
export async function POST(request: Request) {
    try {
        const { slug } = await request.json();

        if (!slug || typeof slug !== "string") {
            return NextResponse.json({ success: false, error: "Invalid slug" }, { status: 400 });
        }

        await prisma.toolView.upsert({
            where: { slug },
            update: { viewCount: { increment: 1 } },
            create: { slug, viewCount: 1 },
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
        const limit = parseInt(searchParams.get("limit") || "6", 10);

        const popular = await prisma.toolView.findMany({
            orderBy: { viewCount: "desc" },
            take: limit,
        });

        return NextResponse.json({
            success: true,
            tools: popular.map((t) => ({ slug: t.slug, viewCount: t.viewCount })),
        });
    } catch (error) {
        console.error("Popular tools fetch error:", error);
        return NextResponse.json({ success: false, tools: [] }, { status: 500 });
    }
}
