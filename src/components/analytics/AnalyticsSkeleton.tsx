
export default function AnalyticsSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header & Controls */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white dark:bg-[#1E2028] p-4 rounded-xl border border-gray-200 dark:border-white/10">
                <div className="h-10 w-64 bg-gray-200 dark:bg-white/10 rounded-xl"></div>
                <div className="h-10 w-32 bg-gray-200 dark:bg-white/10 rounded-xl"></div>
            </div>

            {/* Summary Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-28 bg-gray-200 dark:bg-white/10 rounded-xl"></div>
                ))}
            </div>

            {/* Main Equity Curve */}
            <div className="h-[400px] bg-gray-200 dark:bg-white/10 rounded-xl"></div>

            {/* Performance Grids */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="h-[300px] bg-gray-200 dark:bg-white/10 rounded-xl"></div>
                <div className="h-[300px] bg-gray-200 dark:bg-white/10 rounded-xl"></div>
            </div>
        </div>
    );
}
