export default function Loading() {
    return (
        <div className="space-y-10 pb-10 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-100 dark:border-white/5 pb-8">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-gray-200 dark:bg-white/10 rounded-full" />
                        <div className="h-8 w-48 bg-gray-200 dark:bg-white/10 rounded-lg" />
                    </div>
                    <div className="h-5 w-64 bg-gray-100 dark:bg-white/5 rounded-lg ml-4" />
                </div>
                <div className="h-10 w-32 bg-gray-200 dark:bg-white/10 rounded-xl" />
            </div>

            {/* Level Grid Skeleton */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-[#151925] border border-gray-100 dark:border-white/5 rounded-xl p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5" />
                            <div className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-white/5" />
                        </div>
                        <div className="space-y-3 mb-6">
                            <div className="h-6 w-3/4 bg-gray-200 dark:bg-white/10 rounded" />
                            <div className="h-4 w-full bg-gray-100 dark:bg-white/5 rounded" />
                            <div className="h-4 w-2/3 bg-gray-100 dark:bg-white/5 rounded" />
                        </div>
                        <div className="pt-4 border-t border-gray-100 dark:border-white/5 flex justify-between items-center">
                            <div className="h-4 w-20 bg-gray-100 dark:bg-white/5 rounded" />
                            <div className="h-4 w-24 bg-gray-100 dark:bg-white/5 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
