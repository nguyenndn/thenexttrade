export default function JournalLoading() {
    return (
        <div className="space-y-4" aria-label="Loading trading journal">
            <div className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
            <div className="h-12 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                {Array.from({ length: 4 }).map((_, index) => (
                    <div
                        key={index}
                        className="h-24 animate-pulse rounded-xl bg-gray-100 dark:bg-white/5"
                    />
                ))}
            </div>
            <div className="h-[420px] animate-pulse rounded-xl bg-gray-100 dark:bg-white/5" />
        </div>
    );
}
