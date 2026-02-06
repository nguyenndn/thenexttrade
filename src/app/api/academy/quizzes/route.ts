
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const quizSchema = z.object({
    title: z.string().min(1, "Title is required"),
    description: z.string().optional(),
    moduleId: z.string().optional().nullable(),
});

// GET: List all quizzes
export async function GET() {
    try {
        const quizzes = await prisma.quiz.findMany({
            orderBy: { createdAt: "desc" },
            include: {
                _count: {
                    select: { questions: true },
                },
                module: {
                    select: { title: true },
                },
            },
        });

        return NextResponse.json(quizzes);
    } catch (error) {
        console.error("[QUIZZES_GET]", error);
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}

// POST: Create a new quiz
export async function POST(req: Request) {
    try {
        const body = await req.json();
        const validation = quizSchema.safeParse(body);

        if (!validation.success) {
            return NextResponse.json(
                { error: validation.error.issues[0].message },
                { status: 400 }
            );
        }

        const { title, description, moduleId } = validation.data;

        const quiz = await prisma.quiz.create({
            data: {
                title,
                description,
                moduleId,
            },
        });

        return NextResponse.json(quiz);
    } catch (error) {
        console.error("[QUIZZES_POST]", error);
        // Check for unique constraint on moduleId if necessary (though our schema allows 1-1, Prisma might throw if duplicate)
        if ((error as any).code === 'P2002') {
            return NextResponse.json({ error: "This module already has a quiz linked." }, { status: 409 });
        }
        return NextResponse.json({ error: "Internal Error" }, { status: 500 });
    }
}
