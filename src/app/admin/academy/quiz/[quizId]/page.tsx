import { notFound } from "next/navigation";

export default async function QuizDetailPage({
    params,
}: {
    params: Promise<{ quizId: string }>;
}) {
    const { quizId } = await params;

    if (!quizId) return notFound();

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Quiz Editor
            </h1>
            <p className="text-gray-500 mt-2">Quiz ID: {quizId}</p>
            <p className="text-sm text-gray-400 mt-4">This page is under construction.</p>
        </div>
    );
}
