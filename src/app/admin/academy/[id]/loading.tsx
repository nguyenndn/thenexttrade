
export default function Loading() {
    return (
        <div className="space-y-10 pb-10 animate-in fade-in max-w-5xl mx-auto pt-10">
            {/* Header Skeleton */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                    {/* Breadcrumb skeleton */}
                    <div className="flex items-center gap-2">
                        <div className="h-4 w-16 bg-gray-200 dark:bg-white/5 rounded animate-pulse" />
                        <div className="h-4 w-4 bg-gray-200 dark:bg-white/5 rounded animate-pulse" />
                        <div className="h-4 w-32 bg-gray-200 dark:bg-white/5 rounded animate-pulse" />
                    </div>
                    {/* Title skeleton */}
                    <div className="h-8 w-64 bg-gray-200 dark:bg-white/5 rounded animate-pulse" />
                    {/* Subtitle skeleton */}
                    <div className="h-4 w-48 bg-gray-200 dark:bg-white/5 rounded animate-pulse" />
                </div>
                {/* Button skeleton */}
                <div className="h-10 w-32 bg-gray-200 dark:bg-white/5 rounded-xl animate-pulse" />
            </div>

            {/* Modules Skeleton */}
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="bg-white dark:bg-[#151925] rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden">
                        <div className="p-4 flex items-center gap-4">
                            <div className="h-6 w-6 bg-gray-200 dark:bg-white/5 rounded animate-pulse" />
                            <div className="flex-1 space-y-2">
                                <div className="h-5 w-48 bg-gray-200 dark:bg-white/5 rounded animate-pulse" />
                                <div className="h-3 w-24 bg-gray-200 dark:bg-white/5 rounded animate-pulse" />
                            </div>
                            <div className="flex gap-2">
                                <div className="h-8 w-8 bg-gray-200 dark:bg-white/5 rounded animate-pulse" />
                                <div className="h-8 w-8 bg-gray-200 dark:bg-white/5 rounded animate-pulse" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Empty State Skeleton (optional visual fill) */}
            <div className="h-20 w-full bg-gray-50 dark:bg-white/5 rounded-2xl border border-dashed border-gray-200 dark:border-white/10 animate-pulse" />
        </div>
    )
}
