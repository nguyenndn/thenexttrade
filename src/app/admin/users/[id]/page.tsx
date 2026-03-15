import { notFound } from "next/navigation";

export default async function UserDetailPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;

    if (!id) return notFound();

    return (
        <div className="p-6">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                User Detail
            </h1>
            <p className="text-gray-500 mt-2">User ID: {id}</p>
            <p className="text-sm text-gray-400 mt-4">This page is under construction.</p>
        </div>
    );
}
