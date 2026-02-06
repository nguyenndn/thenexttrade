
import { prisma } from "@/lib/prisma";
import { QuizBuilder } from "@/components/admin/academy/QuizBuilder";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AdminQuizEditPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params;
    const quiz = await prisma.quiz.findUnique({
        where: { id },
        include: {
            module: { select: { id: true } },
            questions: {
                orderBy: { order: "asc" },
                include: {
                    options: true
                }
            }
        },
    });

    if (!quiz) {
        return notFound();
    }

    return (
        <div className="w-full">
            <QuizBuilder quiz={quiz} backLink="/admin/quizzes" />
        </div>
    );
}
