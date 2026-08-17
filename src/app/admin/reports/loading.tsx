export default function AdminReportsLoading() {
    return (
        <div className="space-y-6 pb-10">
            {/* Header skeleton */}
            <div className="flex justify-between items-center gap-4 mb-6">
                <div className="flex items-center gap-4">
                    <div className="w-1 h-10 rounded-full bg-gray-200 dark:bg-white/10 animate-pulse" />
                    <div>
                        <div className="h-5 w-32 bg-gray-200 dark:bg-white/10 rounded-lg animate-pulse mb-1" />
                        <div className="h-3 w-64 bg-gray-200 dark:bg-white/10 rounded-lg animate-pulse" />
                    </div>
                </div>
                <div className="h-9 w-48 bg-gray-200 dark:bg-white/10 rounded-xl animate-pulse" />
            </div>
            {/* Panels skeleton */}
            {[1, 2, 3, 4].map((i) => (
                <div
                    key={i}
                    className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-6 animate-pulse"
                >
                    <div className="h-4 w-32 bg-gray-200 dark:bg-white/10 rounded-lg mb-4" />
                    <div className="grid grid-cols-4 gap-3">
                        {[1, 2, 3, 4].map((j) => (
                            <div
                                key={j}
                                className="h-20 bg-gray-100 dark:bg-white/5 rounded-xl"
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
}
