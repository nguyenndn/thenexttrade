export function BehaviorTableSkeleton() {
    return (
        <div className="divide-y divide-gray-100 dark:divide-white/5">
            {[1, 2, 3, 4, 5, 6].map((row) => (
                <div
                    key={row}
                    className="px-4 py-4 flex items-center justify-between gap-4"
                >
                    <div className="flex items-center gap-3 min-w-0">
                        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-white/5 animate-pulse shrink-0" />
                        <div className="space-y-1.5">
                            <div className="h-3.5 w-32 rounded-lg bg-gray-200 dark:bg-white/5 animate-pulse" />
                            <div className="h-2.5 w-44 rounded-lg bg-gray-100 dark:bg-white/5 animate-pulse" />
                        </div>
                    </div>
                    <div className="hidden md:block h-5 w-24 rounded-lg bg-gray-100 dark:bg-white/5 animate-pulse" />
                    <div className="hidden lg:block h-3.5 w-56 rounded-lg bg-gray-100 dark:bg-white/5 animate-pulse" />
                    <div className="h-8 w-24 rounded-lg bg-gray-200 dark:bg-white/5 animate-pulse shrink-0" />
                </div>
            ))}
        </div>
    );
}
