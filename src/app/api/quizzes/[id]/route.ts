
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        const quiz = await prisma.quiz.findUnique({
            where: { id: params.id },
            include: {
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
                                // Explicitly exclude isCorrect
                            }
                        }
                    }
                }
            }
        });

        if (!quiz) return NextResponse.json({ error: "Not found" }, { status: 404 });

        return NextResponse.json(quiz);
    } catch (error) {
        return NextResponse.json({ error: "Failed to fetch quiz" }, { status: 500 });
    }
}

export async function DELETE(request: Request, props: { params: Promise<{ id: string }> }) {
    const params = await props.params;
    try {
        await prisma.quiz.delete({
            where: { id: params.id }
        });
        return NextResponse.json({ success: true });
    } catch (error) {
        return NextResponse.json({ error: "Failed to delete quiz" }, { status: 500 });
    }
}
