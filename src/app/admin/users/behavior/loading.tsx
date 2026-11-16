import { BehaviorTableSkeleton } from "@/components/admin/behavior/BehaviorTableSkeleton";

export default function AdminBehaviorLoading() {
    return (
        <div className="space-y-6 pb-10 animate-in fade-in">
            <div className="space-y-2">
                <div className="h-7 w-72 rounded-lg bg-gray-200 dark:bg-white/5 animate-pulse" />
                <div className="h-4 w-96 max-w-full rounded-lg bg-gray-100 dark:bg-white/5 animate-pulse" />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((card) => (
                    <div
                        key={card}
                        className="h-20 rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] animate-pulse"
                    />
                ))}
            </div>

            <div className="h-10 w-72 rounded-lg bg-gray-100 dark:bg-white/5 animate-pulse" />

            <div className="h-[70px] rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] animate-pulse" />

            <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#1E2028] overflow-hidden">
                <BehaviorTableSkeleton />
            </div>
        </div>
    );
}
