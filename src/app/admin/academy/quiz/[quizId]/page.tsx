
import { prisma } from "@/lib/prisma";
import { QuizBuilder } from "@/components/admin/academy/QuizBuilder";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function QuizBuilderPage({ params }: { params: Promise<{ quizId: string }> }) {
    const { quizId } = await params;
    const quiz = await prisma.quiz.findUnique({
        where: { id: quizId },
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

    return <QuizBuilder quiz={quiz} />;
}
