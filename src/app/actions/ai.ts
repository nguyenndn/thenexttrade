"use server";

import { prisma } from "@/lib/prisma";
import { StructureGenerationResponse } from "@/lib/ai/types";
import { revalidatePath } from "next/cache";

export async function saveStructure(
    data: StructureGenerationResponse,
    type: "level" | "module",
    parentId?: string
) {
    try {
        if (type === "level") {
            // 1. Get the highest order to append to the end
            const lastLevel = await prisma.level.findFirst({
                orderBy: { order: "desc" },
            });
            const newOrder = (lastLevel?.order || 0) + 1;

            // 2. Create Level
            const level = await prisma.level.create({
                data: {
                    title: data.title,
                    description: data.description,
                    order: newOrder,
                },
            });

            // 3. Create Modules
            // data.items are modules in this case
            if (data.items && data.items.length > 0) {
                for (const item of data.items) {
                    await prisma.module.create({
                        data: {
                            title: item.title,
                            description: item.description,
                            levelId: level.id,
                            order: item.order,
                        },
                    });
                }
            }

            revalidatePath("/admin/academy");
            return { success: true, id: level.id, type: "level" };
        }

        else if (type === "module") {
            if (!parentId) {
                throw new Error("Parent Level ID is required to save a Module");
            }

            // Check if parent level exists
            const level = await prisma.level.findUnique({ where: { id: parentId } });
            if (!level) throw new Error("Parent Level not found");

            // Get max order in this level
            const lastModule = await prisma.module.findFirst({
                where: { levelId: parentId },
                orderBy: { order: "desc" },
            });
            const newOrder = (lastModule?.order || 0) + 1;

            // Create Module
            const module = await prisma.module.create({
                data: {
                    title: data.title,
                    description: data.description,
                    levelId: parentId,
                    order: newOrder,
                },
            });

            // Create Lessons
            // data.items are lessons in this case
            if (data.items && data.items.length > 0) {
                for (const item of data.items) {
                    // Generate slug
                    let slug = createSlug(item.title);
                    // Ensure uniqueness (simple check)
                    const existing = await prisma.lesson.findUnique({ where: { slug } });
                    if (existing) {
                        slug = `${slug}-${Date.now()}`;
                    }

                    await prisma.lesson.create({
                        data: {
                            title: item.title,
                            slug: slug,
                            content: "", // Content is empty for structure generation
                            duration: item.duration || 10,
                            moduleId: module.id,
                            order: item.order,
                        },
                    });
                }
            }

            revalidatePath("/admin/academy");
            return { success: true, id: module.id, type: "module" };
        }

        return { success: false, error: "Invalid type" };

    } catch (error: any) {
        console.error("Save Structure Error:", error);
        return { success: false, error: error.message };
    }
}


export async function getModulesForSelect() {
    try {
        const modules = await prisma.module.findMany({
            select: { id: true, title: true, level: { select: { title: true } } },
            orderBy: { createdAt: "desc" },
        });
        return { success: true, data: modules };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function saveLesson(
    data: { title: string; content: string; duration: number },
    moduleId: string
) {
    try {
        if (!moduleId) throw new Error("Module ID is required");

        // Get max order
        const lastLesson = await prisma.lesson.findFirst({
            where: { moduleId },
            orderBy: { order: "desc" },
        });
        const newOrder = (lastLesson?.order || 0) + 1;

        // Generate slug
        let slug = createSlug(data.title);
        const existing = await prisma.lesson.findUnique({ where: { slug } });
        if (existing) {
            slug = `${slug}-${Date.now()}`;
        }

        const lesson = await prisma.lesson.create({
            data: {
                title: data.title,
                slug: slug,
                content: data.content,
                duration: data.duration,
                moduleId: moduleId,
                order: newOrder,
            },
        });

        revalidatePath("/admin/academy");
        return { success: true, id: lesson.id };
    } catch (error: any) {
        console.error("Save Lesson Error:", error);
        return { success: false, error: error.message };
    }
}


export async function saveQuiz(
    data: { questions: { text: string; options: { text: string; isCorrect: boolean }[]; explanation?: string }[] },
    moduleId: string,
    topic: string
) {
    try {
        if (!moduleId) throw new Error("Module ID is required");

        // Check if module exists
        const module = await prisma.module.findUnique({ where: { id: moduleId } });
        if (!module) throw new Error("Module not found");

        // Create Quiz
        const quiz = await prisma.quiz.create({
            data: {
                title: `Quiz: ${topic}`,
                moduleId: moduleId,
            },
        });

        // Create Questions
        for (let i = 0; i < data.questions.length; i++) {
            const q = data.questions[i];
            const question = await prisma.question.create({
                data: {
                    quizId: quiz.id,
                    text: q.text,
                    order: i + 1,
                },
            });

            // Create Options
            for (const opt of q.options) {
                await prisma.option.create({
                    data: {
                        questionId: question.id,
                        text: opt.text,
                        isCorrect: opt.isCorrect,
                    },
                });
            }
        }

        revalidatePath("/admin/academy");
        return { success: true, id: quiz.id };
    } catch (error: any) {
        console.error("Save Quiz Error:", error);
        return { success: false, error: error.message };
    }
}

function createSlug(text: string) {
    return text
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/[\s_-]+/g, "-")
        .replace(/^-+|-+$/g, "");
}

export async function deleteLesson(lessonId: string) {
    try {
        await prisma.lesson.delete({
            where: { id: lessonId },
        });
        revalidatePath("/admin/ai-studio");
        revalidatePath("/admin/academy");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}

export async function updateLesson(
    lessonId: string,
    data: { title: string; content: string; duration: number }
) {
    try {
        await prisma.lesson.update({
            where: { id: lessonId },
            data: {
                title: data.title,
                content: data.content,
                duration: data.duration,
            },
        });
        revalidatePath("/admin/ai-studio");
        revalidatePath("/admin/academy");
        return { success: true };
    } catch (error: any) {
        return { success: false, error: error.message };
    }
}
