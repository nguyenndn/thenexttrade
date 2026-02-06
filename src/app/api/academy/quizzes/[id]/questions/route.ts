
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const optionSchema = z.object({
    text: z.string().min(1, "Option text is required"),
    isCorrect: z.boolean().default(false),
});

const questionSchema = z.object({
    text: z.string().min(1, "Question text is required"),
    order: z.number().int().optional(),
    options: z.array(optionSchema).min(2, "At least 2 options required"),
});

// GET: List all questions for a quiz
export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const questions = await prisma.question.findMany({
            where: { quizId: id },
            orderBy: { order: "asc" },
            include: {
                options: true,
            },
        });

        return NextResponse.json(questions);
    } catch (error) {
        console.error("[QUIZ_QUESTIONS_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// POST: Create a new question with options
export async function POST(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await req.json();
        const validation = questionSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { text, order, options } = validation.data;

        let newOrder = order;
        if (newOrder === undefined) {
            const lastQuestion = await prisma.question.findFirst({
                where: { quizId: id },
                orderBy: { order: "desc" },
            });
            newOrder = (lastQuestion?.order || 0) + 1;
        }

        const question = await prisma.question.create({
            data: {
                quizId: id,
                text,
                order: newOrder,
                options: {
                    create: options,
                },
            },
            include: {
                options: true,
            },
        });

        return NextResponse.json(question);
    } catch (error) {
        console.error("[QUIZ_QUESTIONS_POST]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
