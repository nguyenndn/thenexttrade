import { notFound } from "next/navigation";

export default async function LevelDetailPage({
    params,
}: {
    params: Promise<{ levelId: string }>;
}) {
    const { levelId } = await params;

    if (!levelId) return notFound();

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Level Editor
            </h1>
            <p className="text-gray-500 mt-2">Level ID: {levelId}</p>
            <p className="text-sm text-gray-400 mt-4">This page is under construction.</p>
        </div>
    );
}
