import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import LessonEditor from "@/components/admin/ai/lessons/LessonEditor";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export default async function LessonEditPage(props: { params: Promise<{ lessonId: string }> }) {
    const params = await props.params;
    const lesson = await prisma.lesson.findUnique({
        where: { id: params.lessonId },
        include: {
            module: {
                include: {
                    level: true
                }
            }
        }
    });

    if (!lesson) notFound();

    return <LessonEditor lesson={lesson} />;
}
