
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const moduleUpdateSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    order: z.number().int().optional(),
    levelId: z.string().optional(), // In case we want to move module to another level
});

export async function PUT(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await props.params;
        const body = await req.json();
        const validation = moduleUpdateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const module = await prisma.module.update({
            where: { id },
            data: validation.data,
        });

        return NextResponse.json(module);
    } catch (error) {
        console.error("[MODULE_PUT]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    props: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await props.params;
        await prisma.module.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Module deleted" });
    } catch (error) {
        console.error("[MODULE_DELETE]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
