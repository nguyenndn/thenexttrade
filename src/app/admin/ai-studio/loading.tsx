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
                    <div className="h-5 w-80 bg-gray-100 dark:bg-white/5 rounded-lg ml-4" />
                </div>
                <div className="h-10 w-40 bg-gray-200 dark:bg-white/10 rounded-2xl" />
            </div>

            {/* Quick Actions Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-[#151925] border border-gray-100 dark:border-white/5 rounded-3xl p-6 shadow-sm flex flex-col items-center text-center space-y-4">
                        <div className="w-16 h-16 rounded-2xl bg-gray-100 dark:bg-white/5" />
                        <div className="space-y-2 w-full flex flex-col items-center">
                            <div className="h-6 w-32 bg-gray-200 dark:bg-white/10 rounded" />
                            <div className="h-4 w-48 bg-gray-100 dark:bg-white/5 rounded" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Activity Section */}
            <div className="space-y-6">
                <div className="h-8 w-48 bg-gray-200 dark:bg-white/10 rounded-lg" />
                <div className="bg-white dark:bg-[#151925] border border-gray-100 dark:border-white/5 rounded-3xl p-6 space-y-4">
                    {[...Array(3)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/5 shrink-0" />
                            <div className="flex-1 space-y-2">
                                <div className="h-4 w-1/3 bg-gray-200 dark:bg-white/10 rounded" />
                                <div className="h-3 w-1/4 bg-gray-100 dark:bg-white/5 rounded" />
                            </div>
                            <div className="h-8 w-24 bg-gray-100 dark:bg-white/5 rounded-lg" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
