import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

const optionUpdateSchema = z.object({
    id: z.string().optional(), // If present, update; else create
    text: z.string().min(1, "Option text is required"),
    isCorrect: z.boolean().default(false),
});

const questionUpdateSchema = z.object({
    text: z.string().trim().min(1).optional(),
    order: z.number().int().optional(),
    options: z
        .array(optionUpdateSchema)
        .min(2, "At least 2 options required")
        .refine((opts) => opts.some((o) => o.isCorrect), {
            message: "At least one option must be marked as correct",
        })
        .optional(),
});

// PUT: Update question and its options (Full Sync)
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    try {
        const { id } = await params;
        const body = await req.json();
        const validation = questionUpdateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { text, order, options } = validation.data;

        // Transaction for atomic update
        const result = await prisma.$transaction(async (tx) => {
            // 1. Update question fields
            const question = await tx.question.update({
                where: { id },
                data: {
                    text,
                    order,
                },
            });

            // 2. Sync options if provided
            if (options) {
                // IDs to keep
                const optionIdsToKeep = options
                    .filter((o) => o.id)
                    .map((o) => o.id as string);

                // Delete options not in the list
                await tx.option.deleteMany({
                    where: {
                        questionId: id,
                        id: { notIn: optionIdsToKeep },
                    },
                });

                // Upsert options (scoped to questionId: id to prevent cross-question tampering)
                for (const opt of options) {
                    if (opt.id) {
                        const updated = await tx.option.updateMany({
                            where: { id: opt.id, questionId: id },
                            data: {
                                text: opt.text,
                                isCorrect: opt.isCorrect,
                            },
                        });
                        if (updated.count === 0) {
                            await tx.option.create({
                                data: {
                                    questionId: id,
                                    text: opt.text,
                                    isCorrect: opt.isCorrect,
                                },
                            });
                        }
                    } else {
                        await tx.option.create({
                            data: {
                                questionId: id,
                                text: opt.text,
                                isCorrect: opt.isCorrect,
                            },
                        });
                    }
                }
            }

            return await tx.question.findUnique({
                where: { id },
                include: { options: true },
            });
        });

        return NextResponse.json(result);
    } catch (error) {
        console.error("[QUESTION_PUT]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// DELETE: Delete question
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    try {
        const { id } = await params;
        await prisma.question.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Question deleted" });
    } catch (error) {
        console.error("[QUESTION_DELETE]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
