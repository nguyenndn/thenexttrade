export default function Loading() {
    return (
        <div className="space-y-10 pb-10 animate-pulse">
            {/* Header Skeleton */}
            <div className="border-b border-gray-100 dark:border-white/5 pb-8">
                <div className="h-8 w-32 bg-gray-200 dark:bg-white/10 rounded-lg mb-2" />
                <div className="h-5 w-64 bg-gray-100 dark:bg-white/5 rounded-lg" />
            </div>

            {/* Content Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Sidebar Navigation */}
                <div className="space-y-2">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="h-10 w-full bg-white dark:bg-[#151925] rounded-xl border border-gray-100 dark:border-white/5" />
                    ))}
                </div>

                {/* Form Area */}
                <div className="lg:col-span-3 space-y-6">
                    <div className="bg-white dark:bg-[#151925] rounded-[2.5rem] border border-gray-100 dark:border-white/5 p-8 space-y-6">
                        <div className="h-6 w-48 bg-gray-200 dark:bg-white/10 rounded mb-6" />

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="space-y-2">
                                    <div className="h-4 w-24 bg-gray-200 dark:bg-white/10 rounded" />
                                    <div className="h-12 w-full bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5" />
                                </div>
                            ))}
                        </div>

                        <div className="space-y-2">
                            <div className="h-4 w-32 bg-gray-200 dark:bg-white/10 rounded" />
                            <div className="h-32 w-full bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/5" />
                        </div>

                        <div className="flex justify-end pt-4">
                            <div className="h-12 w-32 bg-gray-200 dark:bg-white/10 rounded-xl" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
