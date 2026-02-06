
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const quizUpdateSchema = z.object({
    title: z.string().min(1).optional(),
    description: z.string().optional(),
    moduleId: z.string().optional().nullable(),
});

// GET: Get single quiz with questions
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const quiz = await prisma.quiz.findUnique({
            where: { id },
            include: {
                module: {
                    select: { id: true, title: true }
                },
                questions: {
                    orderBy: { order: "asc" },
                    include: {
                        options: true
                    }
                },
            },
        });

        if (!quiz) {
            return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
        }

        return NextResponse.json(quiz);
    } catch (error) {
        console.error("[QUIZ_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// PUT: Update quiz details
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const validation = quizUpdateSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const quiz = await prisma.quiz.update({
            where: { id },
            data: validation.data,
        });

        return NextResponse.json(quiz);
    } catch (error) {
        console.error("[QUIZ_PUT]", error);
        if ((error as any).code === 'P2002') {
            return NextResponse.json({ error: "This module already has a quiz linked." }, { status: 409 });
        }
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// DELETE: Delete quiz
export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        await prisma.quiz.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Quiz deleted" });
    } catch (error) {
        console.error("[QUIZ_DELETE]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
