import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

const reorderSchema = z.object({
    items: z.array(
        z.object({
            id: z.string(),
            order: z.number().int(),
        })
    ),
});

export async function PUT(req: Request) {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    try {
        const body = await req.json();
        const validation = reorderSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { items } = validation.data;

        // Transaction to ensure atomicity
        await prisma.$transaction(
            items.map((item) =>
                prisma.module.update({
                    where: { id: item.id },
                    data: { order: item.order },
                })
            )
        );

        return NextResponse.json({ message: "Order updated" });
    } catch (error) {
        console.error("[MODULE_REORDER]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
