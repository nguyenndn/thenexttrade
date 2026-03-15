import { notFound } from "next/navigation";

export default async function LessonDetailPage({
    params,
}: {
    params: Promise<{ lessonId: string }>;
}) {
    const { lessonId } = await params;

    if (!lessonId) return notFound();

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Lesson Editor
            </h1>
            <p className="text-gray-500 mt-2">Lesson ID: {lessonId}</p>
            <p className="text-sm text-gray-400 mt-4">This page is under construction.</p>
        </div>
    );
}
