export default function DashboardSkeleton() {
    return (
        <div className="w-full space-y-4 animate-pulse">
            {/* Header: Greeting & Quote */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-2">
                    <div className="h-7 w-52 bg-gray-200 dark:bg-white/5 rounded-xl"></div>
                    <div className="h-4 w-80 bg-gray-100 dark:bg-white/[0.03] rounded-lg"></div>
                </div>
            </div>

            {/* Dashboard Hero KPI Bar */}
            <div className="h-24 sm:h-28 rounded-xl bg-gray-100 dark:bg-[#1E2028] border border-dashboard p-4 grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="flex flex-col justify-center space-y-2">
                        <div className="h-3 w-20 bg-gray-200 dark:bg-white/10 rounded"></div>
                        <div className="h-6 w-28 bg-gray-200 dark:bg-white/10 rounded-lg"></div>
                    </div>
                ))}
            </div>

            {/* Filter Controls Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-1">
                <div className="h-10 w-44 bg-gray-100 dark:bg-[#1E2028] border border-dashboard rounded-xl"></div>
                <div className="h-10 w-64 bg-gray-100 dark:bg-[#1E2028] border border-dashboard rounded-xl"></div>
            </div>

            {/* Main Charts Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="h-[360px] bg-gray-100 dark:bg-[#1E2028] border border-dashboard rounded-2xl p-4">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-white/10 rounded mb-4"></div>
                    <div className="h-[280px] bg-gray-200/50 dark:bg-white/[0.02] rounded-xl"></div>
                </div>
                <div className="h-[360px] bg-gray-100 dark:bg-[#1E2028] border border-dashboard rounded-2xl p-4">
                    <div className="h-4 w-32 bg-gray-200 dark:bg-white/10 rounded mb-4"></div>
                    <div className="h-[280px] bg-gray-200/50 dark:bg-white/[0.02] rounded-xl"></div>
                </div>
            </div>

            {/* Secondary Charts / Widgets Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[1, 2, 3].map((i) => (
                    <div
                        key={i}
                        className="h-[280px] bg-gray-100 dark:bg-[#1E2028] border border-dashboard rounded-2xl p-4"
                    >
                        <div className="h-4 w-28 bg-gray-200 dark:bg-white/10 rounded mb-4"></div>
                        <div className="h-[200px] bg-gray-200/50 dark:bg-white/[0.02] rounded-xl"></div>
                    </div>
                ))}
            </div>
        </div>
    );
}
