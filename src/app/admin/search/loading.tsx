export default function Loading() {
    return (
        <div className="space-y-8 animate-pulse">
            {/* Header Skeleton */}
            <div className="border-b border-gray-100 dark:border-white/5 pb-8">
                <div className="h-8 w-48 bg-gray-200 dark:bg-white/10 rounded-lg" />
            </div>

            {/* Results Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-[#151925] border border-gray-100 dark:border-white/5 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="h-10 w-10 bg-gray-100 dark:bg-white/5 rounded-xl" />
                            <div className="h-4 w-24 bg-gray-200 dark:bg-white/10 rounded" />
                        </div>
                        <div className="h-4 w-3/4 bg-gray-100 dark:bg-white/5 rounded mb-2" />
                        <div className="h-3 w-1/2 bg-gray-50 dark:bg-white/5 rounded" />
                    </div>
                ))}
            </div>
        </div>
    );
}
