
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const questionReorderSchema = z.object({
    items: z.array(z.object({
        id: z.string(),
        order: z.number().int()
    }))
});

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { items } = questionReorderSchema.parse(body);

        await prisma.$transaction(
            items.map((item) =>
                prisma.question.update({
                    where: { id: item.id },
                    data: { order: item.order },
                })
            )
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
