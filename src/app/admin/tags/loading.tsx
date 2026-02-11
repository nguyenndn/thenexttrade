export default function Loading() {
    return (
        <div className="space-y-10 pb-10 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-100 dark:border-white/5 pb-8">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-gray-200 dark:bg-white/10 rounded-full" />
                        <div className="h-8 w-32 bg-gray-200 dark:bg-white/10 rounded-lg" />
                    </div>
                    <div className="h-5 w-48 bg-gray-100 dark:bg-white/5 rounded-lg ml-4" />
                </div>
                <div className="h-10 w-32 bg-gray-200 dark:bg-white/10 rounded-xl" />
            </div>

            {/* Table Skeleton */}
            <div className="bg-white dark:bg-[#151925] rounded-[2.5rem] border border-gray-100 dark:border-white/5 overflow-hidden">
                <div className="bg-gray-50 dark:bg-white/5 px-6 py-4 flex gap-4">
                    <div className="h-4 w-1/3 bg-gray-200 dark:bg-white/10 rounded" />
                    <div className="h-4 w-1/3 bg-gray-200 dark:bg-white/10 rounded" />
                </div>
                <div className="divide-y divide-gray-100 dark:divide-white/5">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="px-6 py-4 flex gap-4 items-center">
                            <div className="h-6 w-24 bg-gray-100 dark:bg-white/5 rounded-full" />
                            <div className="h-4 w-1/3 bg-gray-100 dark:bg-white/5 rounded ml-auto" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
