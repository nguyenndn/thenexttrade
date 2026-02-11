import { Skeleton } from "@/components/ui/Skeleton";

export default function DashboardLoading() {
    return (
        <div className="p-6 space-y-6 animate-pulse">
            <div className="flex items-center justify-between mb-2">
                <div>
                    <div className="h-8 w-48 bg-gray-200 dark:bg-white/5 rounded-lg mb-2" />
                    <div className="h-4 w-64 bg-gray-100 dark:bg-white/5 rounded-lg" />
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 rounded-xl bg-white dark:bg-[#0B0E14] border border-gray-100 dark:border-white/5 p-6 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="h-10 w-10 rounded-xl bg-gray-100 dark:bg-white/5" />
                            <div className="h-6 w-16 rounded-full bg-gray-100 dark:bg-white/5" />
                        </div>
                        <div className="space-y-2">
                            <div className="h-4 w-24 bg-gray-100 dark:bg-white/5 rounded" />
                            <div className="h-8 w-16 bg-gray-200 dark:bg-white/10 rounded" />
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="xl:col-span-2 space-y-6">
                    <div className="h-[400px] rounded-xl bg-white dark:bg-[#0B0E14] border border-gray-100 dark:border-white/5 p-6" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-[400px]">
                        <div className="rounded-xl bg-white dark:bg-[#0B0E14] border border-gray-100 dark:border-white/5 p-6" />
                        <div className="rounded-xl bg-white dark:bg-[#0B0E14] border border-gray-100 dark:border-white/5 p-6" />
                    </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                    <div className="h-[400px] rounded-xl bg-white dark:bg-[#0B0E14] border border-gray-100 dark:border-white/5 p-6" />
                    <div className="h-[400px] rounded-xl bg-white dark:bg-[#0B0E14] border border-gray-100 dark:border-white/5 p-6" />
                </div>
            </div>
        </div>
    );
}
