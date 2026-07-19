import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
    try {
        const auth = await requireAdmin();
        if (auth instanceof NextResponse) return auth;

        // Get query params for pagination
        const { searchParams } = new URL(request.url);
        const page = parseInt(searchParams.get("page") || "1");
        const limit = parseInt(searchParams.get("limit") || "20");
        const skip = (page - 1) * limit;

        const [comments, total] = await Promise.all([
            prisma.comment.findMany({
                skip,
                take: limit,
                orderBy: { createdAt: "desc" },
                include: {
                    user: {
                        select: { name: true, image: true, email: true },
                    },
                    article: {
                        select: { title: true, slug: true },
                    },
                    lesson: {
                        select: { title: true, slug: true },
                    },
                },
            }),
            prisma.comment.count(),
        ]);

        return NextResponse.json({
            comments,
            pagination: {
                total,
                pages: Math.ceil(total / limit),
                page,
                limit,
            },
        });
    } catch (error) {
        console.error("Admin Comments API Error:", error);
        return NextResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
        );
    }
}
