export function StrategiesLoadingSkeleton() {
    return (
        <div className="space-y-2 md:space-y-4 animate-pulse mt-0 md:mt-4">
            <div className="h-[300px] bg-gray-100 dark:bg-white/5 rounded-xl border border-dashboard" />
            <div className="h-64 bg-gray-100 dark:bg-white/5 rounded-xl border border-dashboard" />
        </div>
    );
}
