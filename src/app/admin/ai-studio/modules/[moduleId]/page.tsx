import { notFound } from "next/navigation";

export default async function ModuleDetailPage({
    params,
}: {
    params: Promise<{ moduleId: string }>;
}) {
    const { moduleId } = await params;

    if (!moduleId) return notFound();

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                Module Editor
            </h1>
            <p className="text-gray-500 mt-2">Module ID: {moduleId}</p>
            <p className="text-sm text-gray-400 mt-4">This page is under construction.</p>
        </div>
    );
}
