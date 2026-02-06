"use client";

import dynamic from "next/dynamic";

const UserRoleChart = dynamic(() => import("@/components/admin/charts/UserRoleChart").then(mod => mod.UserRoleChart), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse" />
});

const UserActivityChart = dynamic(() => import("@/components/admin/charts/UserActivityChart").then(mod => mod.UserActivityChart), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-gray-100 dark:bg-white/5 rounded-2xl animate-pulse" />
});

interface UserChartsProps {
    roleData: any[];
    activityData: any[];
}

export function UserCharts({ roleData, activityData }: UserChartsProps) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white dark:bg-[#0B0E14] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white">User Signups Trend</h3>
                <div className="h-[300px] w-full">
                    <UserActivityChart data={activityData} />
                </div>
            </div>
            <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-2xl border border-gray-100 dark:border-white/5 shadow-sm">
                <h3 className="text-lg font-bold mb-6 text-gray-900 dark:text-white">Role Distribution</h3>
                <div className="h-[300px] w-full">
                    <UserRoleChart data={roleData} />
                </div>
            </div>
        </div>
    );
}
