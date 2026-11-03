export default function Loading() {
    return (
        <div className="min-h-screen bg-white dark:bg-transparent">
            <div className="h-16 border-b border-gray-200 dark:border-white/10" />
            <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-16 space-y-10">
                {/* Hero Skeleton */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    <div className="lg:col-span-7 space-y-4">
                        <div className="h-7 w-36 rounded-lg bg-gray-200 dark:bg-white/10 animate-pulse" />
                        <div className="h-12 w-72 rounded-lg bg-gray-200 dark:bg-white/10 animate-pulse" />
                        <div className="h-5 w-full max-w-xl rounded-lg bg-gray-200 dark:bg-white/10 animate-pulse" />
                        <div className="h-11 w-full max-w-md rounded-lg bg-gray-200 dark:bg-white/10 animate-pulse" />
                    </div>
                    <div className="lg:col-span-5 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-5 space-y-3">
                        <div className="h-4 w-32 rounded-lg bg-gray-200 dark:bg-white/10 animate-pulse" />
                        <div className="flex flex-wrap gap-2">
                            {Array.from({ length: 6 }).map((_, i) => (
                                <div
                                    key={i}
                                    className="h-8 w-24 rounded-lg bg-gray-200 dark:bg-white/10 animate-pulse"
                                />
                            ))}
                        </div>
                    </div>
                </div>

                {/* Controls Skeleton */}
                <div className="flex items-center justify-between gap-4">
                    <div className="h-10 w-72 rounded-xl bg-gray-200 dark:bg-white/10 animate-pulse" />
                    <div className="h-8 w-24 rounded-lg bg-gray-200 dark:bg-white/10 animate-pulse" />
                </div>

                {/* 3-Column Shape-Matched ArticleCard Skeleton Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-7">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div
                            key={i}
                            className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] p-3.5 space-y-3.5"
                        >
                            <div className="aspect-[16/9] w-full rounded-lg bg-gray-200 dark:bg-white/10 animate-pulse" />
                            <div className="space-y-2 px-1">
                                <div className="h-5 w-4/5 rounded-lg bg-gray-200 dark:bg-white/10 animate-pulse" />
                                <div className="h-4 w-full rounded-lg bg-gray-200 dark:bg-white/10 animate-pulse" />
                                <div className="h-4 w-2/3 rounded-lg bg-gray-200 dark:bg-white/10 animate-pulse" />
                            </div>
                            <div className="pt-3 border-t border-gray-100 dark:border-white/10 flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse" />
                                    <div className="h-3.5 w-24 rounded-lg bg-gray-200 dark:bg-white/10 animate-pulse" />
                                </div>
                                <div className="h-3.5 w-14 rounded-lg bg-gray-200 dark:bg-white/10 animate-pulse" />
                            </div>
                        </div>
                    ))}
                </div>
            </main>
        </div>
    );
}
