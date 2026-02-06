
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const importSchema = z.object({
    sourceQuestionIds: z.array(z.string()).min(1),
});

export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> } // Target Quiz ID
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const { sourceQuestionIds } = importSchema.parse(body);

        // 1. Fetch source questions with options
        const sourceQuestions = await prisma.question.findMany({
            where: { id: { in: sourceQuestionIds } },
            include: { options: true }
        });

        if (sourceQuestions.length === 0) {
            return NextResponse.json({ error: "No questions found" }, { status: 404 });
        }

        // 2. Get current highest order in target quiz
        const targetQuiz = await prisma.quiz.findUnique({
            where: { id },
            include: { _count: { select: { questions: true } } }
        });

        if (!targetQuiz) {
            return NextResponse.json({ error: "Target quiz not found" }, { status: 404 });
        }

        let nextOrder = (targetQuiz._count?.questions || 0) + 1;

        // 3. Transactionally create copies
        // Note: Prisma doesn't support "createMany" with nested "create" (for options) well in one go.
        // We will map create promises and run transaction.

        const createPromises = sourceQuestions.map(sourceQ => {
            const newOrder = nextOrder++;
            return prisma.question.create({
                data: {
                    quizId: id,
                    text: sourceQ.text,
                    order: newOrder,
                    options: {
                        create: sourceQ.options.map(opt => ({
                            text: opt.text,
                            isCorrect: opt.isCorrect
                        }))
                    }
                }
            });
        });

        const newQuestions = await prisma.$transaction(createPromises);

        return NextResponse.json({
            success: true,
            count: newQuestions.length,
            questions: newQuestions
        });

    } catch (error) {
        console.error("[QUIZ_IMPORT]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
