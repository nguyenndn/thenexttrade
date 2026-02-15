
export default function DashboardSkeleton() {
    return (
        <div className="space-y-6 animate-pulse">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="h-8 w-48 bg-gray-200 dark:bg-white/10 rounded-lg"></div>
                <div className="h-10 w-32 bg-gray-200 dark:bg-white/10 rounded-xl"></div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="h-32 bg-gray-200 dark:bg-white/10 rounded-xl"></div>
                ))}
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 h-[400px] bg-gray-200 dark:bg-white/10 rounded-xl"></div>
                <div className="h-[400px] bg-gray-200 dark:bg-white/10 rounded-xl"></div>
            </div>

            {/* Recent Trades Table */}
            <div className="h-[300px] bg-gray-200 dark:bg-white/10 rounded-xl"></div>
        </div>
    );
}
