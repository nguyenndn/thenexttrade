
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const { articleId } = body;

        if (!articleId) {
            return NextResponse.json({ error: "Missing articleId" }, { status: 400 });
        }

        // Increment view count
        // Note: In high traffic, use Redis or a queue. For now, direct DB update is fine as it's async to the page load.
        await prisma.article.update({
            where: { id: articleId },
            data: { views: { increment: 1 } }
        });

        return NextResponse.json({ success: true });
    } catch (error) {
        console.error("Failed to increment views:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}
