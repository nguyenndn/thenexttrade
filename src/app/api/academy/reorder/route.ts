
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const reorderSchema = z.object({
    type: z.enum(["level", "module", "lesson"]),
    items: z.array(z.object({
        id: z.string(),
        order: z.number().int()
    }))
});

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { type, items } = reorderSchema.parse(body);

        // Using transaction to ensure integrity
        await prisma.$transaction(
            items.map((item) => {
                if (type === "level") {
                    return prisma.level.update({
                        where: { id: item.id },
                        data: { order: item.order },
                    });
                } else if (type === "module") {
                    return prisma.module.update({
                        where: { id: item.id },
                        data: { order: item.order },
                    });
                } else {
                    return prisma.lesson.update({
                        where: { id: item.id },
                        data: { order: item.order },
                    });
                }
            })
        );

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("Reorder failed:", error);
        return NextResponse.json({ error: "Reorder failed" }, { status: 500 });
    }
}
