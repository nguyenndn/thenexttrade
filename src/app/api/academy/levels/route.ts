
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const levelSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    order: z.number().int(),
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
                            select: { id: true, title: true, slug: true, duration: true }
                        }
                    }
                }
            },
        });
        return NextResponse.json(levels);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch levels" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedData = levelSchema.parse(body);

        const level = await prisma.level.create({
            data: validatedData,
        });
        return NextResponse.json(level, { status: 201 });
    } catch (error) {
        return NextResponse.json({ error: "Failed to create level" }, { status: 500 });
    }
}
