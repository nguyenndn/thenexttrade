import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/api-auth";
import { z } from "zod";

const importSchema = z.object({
    sourceQuestionIds: z.array(z.string()).min(1),
});

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // Target Quiz ID
) {
    const auth = await requireAdmin();
    if (auth instanceof NextResponse) return auth;

    try {
        const { id } = await params;
        const body = await req.json();
        const { sourceQuestionIds } = importSchema.parse(body);

        // 1. Fetch source questions with options
        const sourceQuestions = await prisma.question.findMany({
            where: { id: { in: sourceQuestionIds } },
            include: { options: true },
        });

        if (sourceQuestions.length === 0) {
            return NextResponse.json(
                { error: "No questions found" },
                { status: 404 }
            );
        }

        // 2. Verify target quiz exists and get current highest question order
        const targetQuiz = await prisma.quiz.findUnique({
            where: { id },
            select: { id: true },
        });

        if (!targetQuiz) {
            return NextResponse.json(
                { error: "Target quiz not found" },
                { status: 404 }
            );
        }

        const lastQuestion = await prisma.question.findFirst({
            where: { quizId: id },
            orderBy: { order: "desc" },
            select: { order: true },
        });

        let nextOrder = (lastQuestion?.order || 0) + 1;

        // 3. Transactionally create copies
        const createPromises = sourceQuestions.map((sourceQ) => {
            const newOrder = nextOrder++;
            return prisma.question.create({
                data: {
                    quizId: id,
                    text: sourceQ.text,
                    order: newOrder,
                    options: {
                        create: sourceQ.options.map((opt) => ({
                            text: opt.text,
                            isCorrect: opt.isCorrect,
                        })),
                    },
                },
            });
        });

        const newQuestions = await prisma.$transaction(createPromises);

        return NextResponse.json({
            success: true,
            count: newQuestions.length,
            questions: newQuestions,
        });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json(
                { error: error.issues[0]?.message || "Invalid input" },
                { status: 400 }
            );
        }
        console.error("[QUIZ_IMPORT]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
