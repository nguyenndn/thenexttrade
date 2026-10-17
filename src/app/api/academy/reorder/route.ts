import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

const reorderSchema = z.object({
    type: z.enum(["level", "module", "lesson"]),
    items: z.array(
        z.object({
            id: z.string(),
            order: z.number().int(),
        })
    ),
});

export async function PUT(request: Request) {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    try {
        const body = await request.json();
        const { type, items } = reorderSchema.parse(body);

        // Using transaction to ensure integrity (two-phase for level due to @unique on Level.order)
        if (type === "level") {
            await prisma.$transaction([
                ...items.map((item, idx) =>
                    prisma.level.update({
                        where: { id: item.id },
                        data: { order: -(idx + 10000) },
                    })
                ),
                ...items.map((item) =>
                    prisma.level.update({
                        where: { id: item.id },
                        data: { order: item.order },
                    })
                ),
            ]);
        } else {
            await prisma.$transaction(
                items.map((item) => {
                    if (type === "module") {
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
        }

        return NextResponse.json({ success: true });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error("Reorder failed:", error);
        return NextResponse.json({ error: "Reorder failed" }, { status: 500 });
    }
}
