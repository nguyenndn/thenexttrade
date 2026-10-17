import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

const levelSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    order: z.number().int().optional(),
});

export async function GET() {
    try {
        const levels = await prisma.level.findMany({
            orderBy: { order: "asc" },
            include: {
                modules: {
                    orderBy: { order: "asc" },
                    include: {
                        lessons: {
                            orderBy: { order: "asc" },
                            select: {
                                id: true,
                                title: true,
                                slug: true,
                                duration: true,
                            },
                        },
                    },
                },
            },
        });
        return NextResponse.json(levels);
    } catch (error) {
        return NextResponse.json(
            { error: "Failed to fetch levels" },
            { status: 500 }
        );
    }
}

export async function POST(request: Request) {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    try {
        const body = await request.json();
        const validatedData = levelSchema.parse(body);

        let order = validatedData.order;
        if (order === undefined) {
            const lastLevel = await prisma.level.findFirst({
                orderBy: { order: "desc" },
                select: { order: true },
            });
            order = (lastLevel?.order ?? 0) + 1;
        }

        const level = await prisma.level.create({
            data: {
                title: validatedData.title,
                description: validatedData.description,
                order,
            },
        });
        return NextResponse.json(level, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues[0]?.message || "Invalid input" },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Failed to create level" },
            { status: 500 }
        );
    }
}
