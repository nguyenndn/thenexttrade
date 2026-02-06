
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const moduleSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    levelId: z.string().min(1, "Level ID is required"),
    order: z.number().int().optional(),
});

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = moduleSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { title, description, levelId, order } = validation.data;

        let newOrder = order;
        if (newOrder === undefined) {
            const lastModule = await prisma.module.findFirst({
                where: { levelId },
                orderBy: { order: "desc" },
            });
            newOrder = (lastModule?.order || 0) + 1;
        }

        const module = await prisma.module.create({
            data: {
                title,
                description,
                levelId,
                order: newOrder,
            },
        });

        return NextResponse.json(module);
    } catch (error) {
        console.error("[MODULE_POST]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
