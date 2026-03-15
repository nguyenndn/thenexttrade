
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

// PUT: Update quiz details + questions
export async function PUT(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { title, description, moduleId, questions } = body;

        if (!title) {
            return NextResponse.json({ error: "Title is required" }, { status: 400 });
        }

        // Use transaction to atomically update quiz + questions
        const quiz = await prisma.$transaction(async (tx) => {
            // 1. Update quiz info
            const updated = await tx.quiz.update({
                where: { id },
                data: {
                    title,
                    description: description || null,
                    ...(moduleId !== undefined && { moduleId: moduleId || null }),
                },
            });

            // 2. If questions provided, replace all questions + options
            if (questions && Array.isArray(questions)) {
                // Delete existing questions (cascade deletes options)
                await tx.question.deleteMany({ where: { quizId: id } });

                // Create new questions with options
                for (const q of questions) {
                    await tx.question.create({
                        data: {
                            quizId: id,
                            text: q.text,
                            order: q.order || 0,
                            options: {
                                create: q.options.map((o: any) => ({
                                    text: o.text,
                                    isCorrect: o.isCorrect || false,
                                }))
                            }
                        }
                    });
                }
            }

            return updated;
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
