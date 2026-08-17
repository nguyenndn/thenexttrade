"use client";

import dynamic from "next/dynamic";
import { getCountryFlag, getCountryName } from "@/lib/country-utils";

const UserRoleChart = dynamic(
    () =>
        import("@/components/admin/charts/UserRoleChart").then(
            (mod) => mod.UserRoleChart
        ),
    {
        ssr: false,
        loading: () => (
            <div className="h-[300px] w-full bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />
        ),
    }
);

const UserActivityChart = dynamic(
    () =>
        import("@/components/admin/charts/UserActivityChart").then(
            (mod) => mod.UserActivityChart
        ),
    {
        ssr: false,
        loading: () => (
            <div className="h-[300px] w-full bg-gray-100 dark:bg-white/5 rounded-xl animate-pulse" />
        ),
    }
);

interface UserChartsProps {
    roleData: any[];
    activityData: any[];
    countryData: Array<{ country: string; name?: string; value: number }>;
}

export function UserCharts({
    roleData,
    activityData,
    countryData,
}: UserChartsProps) {
    const knownCountryUsers = countryData.reduce(
        (sum, country) => sum + country.value,
        0
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Signups Trend */}
            <div className="bg-white dark:bg-[#1E2028] p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">
                    User Signups Trend
                </h3>
                <div className="h-[220px] w-full">
                    <UserActivityChart data={activityData} />
                </div>
            </div>

            {/* Role Distribution */}
            <div className="bg-white dark:bg-[#1E2028] p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200 mb-4">
                    Role Distribution
                </h3>
                <div className="h-[220px] w-full">
                    <UserRoleChart data={roleData} />
                </div>
            </div>

            {/* Registered Users by Country */}
            <div className="bg-white dark:bg-[#1E2028] p-5 rounded-xl border border-gray-200 dark:border-white/10 shadow-sm flex flex-col justify-between">
                <div className="flex items-center justify-between gap-4 mb-4">
                    <div>
                        <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                            Users by Country
                        </h3>
                        <p className="text-[11px] text-gray-500 mt-0.5">
                            Based on account profile.
                        </p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-white/5 px-2 py-0.5 rounded-lg">
                        {knownCountryUsers} known
                    </span>
                </div>

                {countryData.length > 0 ? (
                    <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200 dark:scrollbar-thumb-white/10 pr-1 space-y-2.5 max-h-[220px]">
                        {countryData.map((country) => {
                            const percentage = knownCountryUsers
                                ? Math.round(
                                      (country.value / knownCountryUsers) * 100
                                  )
                                : 0;

                            return (
                                <div
                                    key={country.country}
                                    className="rounded-lg border border-gray-200 dark:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] p-2.5"
                                >
                                    <div className="flex items-center justify-between gap-3 mb-1.5">
                                        <div className="flex items-center gap-2 min-w-0">
                                            <span className="text-sm shrink-0">
                                                {getCountryFlag(
                                                    country.country
                                                )}
                                            </span>
                                            <div className="min-w-0">
                                                <p className="text-xs font-bold text-gray-700 dark:text-white truncate">
                                                    {country.name ||
                                                        getCountryName(
                                                            country.country
                                                        )}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right shrink-0 flex items-baseline gap-1">
                                            <span className="text-xs font-black text-gray-800 dark:text-white">
                                                {country.value}
                                            </span>
                                            <span className="text-[10px] text-gray-500 font-medium">
                                                ({percentage}%)
                                            </span>
                                        </div>
                                    </div>
                                    <div className="h-1.5 rounded-full bg-gray-200 dark:bg-white/10 overflow-hidden">
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
                    <div className="flex-1 flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 dark:border-white/10 p-4 text-center">
                        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
                            No country data yet
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}
