
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const levelUpdateSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    order: z.number().int().optional(),
});

// GET: Get single level
export async function GET(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await props.params;
        const level = await prisma.level.findUnique({
            where: { id },
            include: {
                modules: {
                    orderBy: { order: "asc" },
                    include: {
                        lessons: {
                            select: { id: true, title: true, slug: true, order: true },
                            orderBy: { order: "asc" },
                        },
                    },
                },
            },
        });

        if (!level) {
            return NextResponse.json({ error: "Level not found" }, { status: 404 });
        }

        return NextResponse.json(level);
    } catch (error) {
        console.error("[LEVEL_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// PUT: Update level
export async function PUT(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await props.params;
        const body = await req.json();
        const validation = levelUpdateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const level = await prisma.level.update({
            where: { id },
            data: validation.data,
        });

        return NextResponse.json(level);
    } catch (error) {
        console.error("[LEVEL_PUT]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// DELETE: Delete level
export async function DELETE(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await props.params;
        await prisma.level.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Level deleted" });
    } catch (error) {
        console.error("[LEVEL_DELETE]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
