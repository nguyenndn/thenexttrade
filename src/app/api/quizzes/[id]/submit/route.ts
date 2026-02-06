
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        // Body: { userId: string, answers: { [questionId]: optionId } }
        const body = await request.json();
        const { userId, answers } = body;

        // Fetch quiz with correct answers
        const quiz = await prisma.quiz.findUnique({
            where: { id: params.id },
            include: {
                questions: {
                    include: { options: true }
                }
            }
        });

        if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

        let correctCount = 0;
        const totalQuestions = quiz.questions.length;

        // Calculate score
        quiz.questions.forEach(q => {
            const userOptionId = answers[q.id];
            const correctOption = q.options.find(o => o.isCorrect);
            if (correctOption && userOptionId === correctOption.id) {
                correctCount++;
            }
        });

        const score = Math.round((correctCount / totalQuestions) * 100);
        const passed = score >= 70; // 70% passing grade

        // Save attempt
        const attempt = await prisma.userQuizAttempt.create({
            data: {
                userId,
                quizId: quiz.id,
                score,
                passed
            }
        });

        return NextResponse.json({
            attempt,
            results: {
                correctCount,
                totalQuestions,
                score,
                passed
            }
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Submission failed" }, { status: 500 });
    }
}
