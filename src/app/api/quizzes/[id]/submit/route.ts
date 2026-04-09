
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { getAuthUser } from "@/lib/auth-cache";

export async function POST(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const user = await getAuthUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const body = await request.json();
        const { answers } = body;
        const userId = user.id;

        // Fetch quiz with correct answers
        const quiz = await prisma.quiz.findUnique({
            where: { id: params.id },
            include: {
                module: { select: { id: true, levelId: true } },
                questions: {
                    include: { options: true }
                }
            }
        });

        if (!quiz) return NextResponse.json({ error: "Quiz not found" }, { status: 404 });

        // GUARD: Verify all module lessons are completed before allowing submission
        if (quiz.moduleId) {
            const moduleLessons = await prisma.lesson.findMany({
                where: { moduleId: quiz.moduleId },
                select: { id: true }
            });
            const completedCount = await prisma.userProgress.count({
                where: {
                    userId,
                    isCompleted: true,
                    lessonId: { in: moduleLessons.map(l => l.id) }
                }
            });
            if (completedCount < moduleLessons.length) {
                return NextResponse.json(
                    { error: "You must complete all module lessons before taking the quiz." },
                    { status: 403 }
                );
            }
        }

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
        const passed = score >= 75; // 75% passing grade

        // Save attempt
        const attempt = await prisma.userQuizAttempt.create({
            data: {
                userId,
                quizId: quiz.id,
                score,
                passed
            }
        });

        // ── AUTO-GRANT CERTIFICATE ──
        // When user passes, check if ALL quizzes in the level are now passed
        let certificateEarned = false;
        if (passed && quiz.module?.levelId) {
            try {
                const levelId = quiz.module.levelId;

                // Find all modules in this level that have quizzes
                const modulesWithQuizzes = await prisma.module.findMany({
                    where: { levelId, quiz: { isNot: null } },
                    select: {
                        quiz: {
                            select: { id: true }
                        }
                    }
                });

                const quizIds = modulesWithQuizzes
                    .map(m => m.quiz?.id)
                    .filter((id): id is string => !!id);

                if (quizIds.length > 0) {
                    // Check if user has passed ALL quizzes in this level
                    // Get best attempt per quiz
                    const passedQuizzes = await prisma.userQuizAttempt.findMany({
                        where: {
                            userId,
                            quizId: { in: quizIds },
                            passed: true
                        },
                        distinct: ['quizId'],
                        select: { quizId: true, score: true }
                    });

                    if (passedQuizzes.length === quizIds.length) {
                        // All quizzes passed! Calculate average score
                        // Get best score per quiz
                        const bestScores = await Promise.all(
                            quizIds.map(async (qId) => {
                                const best = await prisma.userQuizAttempt.findFirst({
                                    where: { userId, quizId: qId, passed: true },
                                    orderBy: { score: 'desc' },
                                    select: { score: true }
                                });
                                return best?.score ?? 0;
                            })
                        );
                        const avgScore = Math.round(bestScores.reduce((a, b) => a + b, 0) / bestScores.length);

                        // Upsert certificate
                        await prisma.certificate.upsert({
                            where: { userId_levelId: { userId, levelId } },
                            create: { userId, levelId, score: avgScore },
                            update: { score: avgScore, earnedAt: new Date() }
                        });
                        certificateEarned = true;
                    }
                }
            } catch (certError) {
                console.error("Certificate grant error:", certError);
                // Don't fail the quiz submission if certificate logic fails
            }
        }

        return NextResponse.json({
            attempt,
            results: {
                correctCount,
                totalQuestions,
                score,
                passed,
                certificateEarned
            }
        });

    } catch (error) {
        console.error(error);
        return NextResponse.json({ error: "Submission failed" }, { status: 500 });
    }
}
