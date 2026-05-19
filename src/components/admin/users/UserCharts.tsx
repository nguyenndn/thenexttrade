"use client";

import dynamic from "next/dynamic";
import { getCountryFlag, getCountryName } from "@/lib/country-utils";

const UserRoleChart = dynamic(() => import("@/components/admin/charts/UserRoleChart").then(mod => mod.UserRoleChart), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />
});

const UserActivityChart = dynamic(() => import("@/components/admin/charts/UserActivityChart").then(mod => mod.UserActivityChart), {
    ssr: false,
    loading: () => <div className="h-[300px] w-full bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />
});

interface UserChartsProps {
    roleData: any[];
    activityData: any[];
    countryData: Array<{ country: string; name?: string; value: number }>;
}

export function UserCharts({ roleData, activityData, countryData }: UserChartsProps) {
    const knownCountryUsers = countryData.reduce((sum, country) => sum + country.value, 0);

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white dark:bg-[#0B0E14] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                <h3 className="text-lg font-bold mb-6 text-gray-700 dark:text-white">User Signups Trend</h3>
                <div className="h-[300px] w-full">
                    <UserActivityChart data={activityData} />
                </div>
            </div>
            <div className="bg-white dark:bg-[#0B0E14] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                <h3 className="text-lg font-bold mb-6 text-gray-700 dark:text-white">Role Distribution</h3>
                <div className="h-[300px] w-full">
                    <UserRoleChart data={roleData} />
                </div>
            </div>
            <div className="lg:col-span-3 bg-white dark:bg-[#0B0E14] p-6 rounded-xl border border-gray-100 dark:border-white/5 shadow-sm">
                <div className="flex items-center justify-between gap-4 mb-6">
                    <div>
                        <h3 className="text-lg font-bold text-gray-700 dark:text-white">Registered Users by Country</h3>
                        <p className="text-sm text-gray-500 mt-1">Based on account profile country, not visitor pageviews.</p>
                    </div>
                    <span className="text-xs font-bold text-gray-500 uppercase tracking-widest">
                        {knownCountryUsers} known
                    </span>
                </div>

                {countryData.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {countryData.map((country) => {
                            const percentage = knownCountryUsers
                                ? Math.round((country.value / knownCountryUsers) * 100)
                                : 0;

                            return (
                                <div
                                    key={country.country}
                                    className="rounded-xl border border-gray-100 dark:border-white/5 bg-gray-50/70 dark:bg-white/[0.03] p-4"
                                >
                                    <div className="flex items-center justify-between gap-3 mb-3">
                                        <div className="flex items-center gap-3 min-w-0">
                                            <span className="text-lg shrink-0">{getCountryFlag(country.country)}</span>
                                            <div className="min-w-0">
                                                <p className="text-sm font-bold text-gray-700 dark:text-white truncate">
                                                    {country.name || getCountryName(country.country)}
                                                </p>
                                                <p className="text-xs text-gray-500">{country.country}</p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="text-sm font-black text-gray-800 dark:text-white">{country.value}</p>
                                            <p className="text-xs text-gray-500">{percentage}%</p>
                                        </div>
                                    </div>
                                    <div className="h-2 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
                                        <div
                                            className="h-full rounded-full bg-emerald-500"
                                            style={{ width: `${percentage}%` }}
                                        />
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="rounded-xl border border-dashed border-gray-200 dark:border-white/10 p-8 text-center">
                        <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">No country data yet</p>
                        <p className="text-xs text-gray-500 mt-1">New verified signups will appear here after country is captured.</p>
                    </div>
                )}
            </div>
        </div>
    );
}
