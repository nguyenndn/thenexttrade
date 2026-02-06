
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";

const quizSchema = z.object({
    title: z.string().min(3),
    description: z.string().optional(),
    moduleId: z.string().optional(),
    questions: z.array(z.object({
        text: z.string(),
        options: z.array(z.object({
            text: z.string(),
            isCorrect: z.boolean()
        }))
    })).optional()
});

export async function GET() {
    try {
        const quizzes = await prisma.quiz.findMany({
            include: {
                _count: { select: { questions: true } }
            },
            orderBy: { createdAt: 'desc' }
        });
        return NextResponse.json(quizzes);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch quizzes" }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const body = await request.json();
        const validatedData = quizSchema.parse(body);

        const quiz = await prisma.quiz.create({
            data: {
                title: validatedData.title,
                description: validatedData.description,
                moduleId: validatedData.moduleId || undefined,
                questions: validatedData.questions ? {
                    create: validatedData.questions.map((q, idx) => ({
                        text: q.text,
                        order: idx + 1,
                        options: {
                            create: q.options
                        }
                    }))
                } : undefined
            },
        });
        return NextResponse.json(quiz, { status: 201 });
    } catch (error) {
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.issues }, { status: 400 });
        }
        console.error(error);
        return NextResponse.json({ error: "Failed to create quiz" }, { status: 500 });
    }
}
