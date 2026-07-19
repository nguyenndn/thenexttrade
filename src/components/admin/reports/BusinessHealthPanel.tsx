"use client";

import { Users, CreditCard, DollarSign } from "lucide-react";
import type { BusinessHealthReport } from "@/lib/admin/reports/types";

interface Props {
    data: BusinessHealthReport;
}

export function BusinessHealthPanel({ data }: Props) {
    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "USD",
            maximumFractionDigits: 0,
        }).format(val);
    };

    return (
        <div className="bg-white/50 dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 dark:border-white/5 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                Trading Business Health
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-6">
                High-level overview of IB conversions, funding rates, and total
                system assets.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* IB Referrals */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                        <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
                            IB Referred Users
                        </p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-800 dark:text-white">
                                {data.totalIbReferrals.toLocaleString()}
                            </span>
                            <span className="text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-2 py-0.5 rounded-full">
                                {data.referralRate.toFixed(1)}% of total
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            vs {data.directSignups.toLocaleString()} direct
                            signups
                        </p>
                    </div>
                </div>

                {/* Funded Accounts */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                        <CreditCard className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
                            Funded Traders
                        </p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-800 dark:text-white">
                                {data.fundedAccounts.toLocaleString()}
                            </span>
                            <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-0.5 rounded-full">
                                {data.fundingRate.toFixed(1)}% conversion
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            vs {data.unfundedAccounts.toLocaleString()} unfunded
                        </p>
                    </div>
                </div>

                {/* System Assets */}
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-purple-50 dark:bg-purple-500/10 flex items-center justify-center shrink-0">
                        <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                    </div>
                    <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 font-medium mb-1">
                            Total System Assets
                        </p>
                        <div className="flex items-baseline gap-2">
                            <span className="text-2xl font-black text-slate-800 dark:text-white">
                                {formatCurrency(data.totalSystemAssets)}
                            </span>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                            Avg: {formatCurrency(data.averageBalance)} per
                            funded user
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
