export default function Loading() {
    return (
        <div className="space-y-10 pb-10 animate-in fade-in">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 border-b border-gray-200 dark:border-white/10 pb-8">
                <div className="flex flex-col gap-2">
                    <div className="flex items-center gap-3">
                        <div className="w-1.5 h-8 bg-gray-200 dark:bg-white/10 rounded-full animate-pulse" />
                        <div className="h-8 w-32 bg-gray-200 dark:bg-white/10 rounded-lg animate-pulse" />
                    </div>
                </div>
                <div className="h-10 w-32 bg-gray-200 dark:bg-white/10 rounded-xl animate-pulse" />
            </div>

            {/* Comments List Skeleton */}
            <div className="space-y-4">
                {[...Array(5)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl p-6 shadow-sm animate-pulse">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <div className="h-10 w-10 bg-gray-100 dark:bg-white/5 rounded-full" />
                                <div className="space-y-2">
                                    <div className="h-4 w-32 bg-gray-200 dark:bg-white/10 rounded" />
                                    <div className="h-3 w-24 bg-gray-100 dark:bg-white/5 rounded" />
                                </div>
                            </div>
                            <div className="h-6 w-20 bg-gray-100 dark:bg-white/5 rounded-full" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 w-full bg-gray-50 dark:bg-white/5 rounded" />
                            <div className="h-4 w-2/3 bg-gray-50 dark:bg-white/5 rounded" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
