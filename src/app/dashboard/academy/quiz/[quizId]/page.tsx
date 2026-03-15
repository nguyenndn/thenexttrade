import { prisma } from "@/lib/prisma";
import { notFound, redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth-cache";
import { QuizClient } from "./QuizClient";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }: { params: Promise<{ quizId: string }> }) {
    const { quizId } = await params;
    const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
        select: { title: true }
    });

    return {
        title: quiz ? `${quiz.title} | Quiz` : "Quiz Not Found",
    };
}

export default async function DashboardQuizPage({ params }: { params: Promise<{ quizId: string }> }) {
    const { quizId } = await params;
    const user = await getAuthUser();

    if (!user) {
        redirect("/auth/login");
    }

    // Fetch quiz with questions (exclude correct answers) + previous attempts
    const [quiz, previousAttempts] = await Promise.all([
        prisma.quiz.findUnique({
            where: { id: quizId },
            include: {
                module: {
                    select: { title: true, level: { select: { title: true } } }
                },
                questions: {
                    orderBy: { order: 'asc' },
                    select: {
                        id: true,
                        text: true,
                        order: true,
                        options: {
                            select: {
                                id: true,
                                text: true
                                // isCorrect excluded — prevent cheating
                            }
                        }
                    }
                }
            }
        }),
        prisma.userQuizAttempt.findMany({
            where: { userId: user.id, quizId },
            orderBy: { completedAt: 'desc' },
            take: 3
        })
    ]);

    if (!quiz) return notFound();

    const bestScore = previousAttempts.length > 0
        ? Math.max(...previousAttempts.map(a => a.score))
        : null;

    return (
        <QuizClient
            quiz={quiz}
            previousAttempts={previousAttempts.map(a => ({
                score: a.score,
                passed: a.passed,
                completedAt: a.completedAt.toISOString()
            }))}
            bestScore={bestScore}
        />
    );
}
