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
        <div className="bg-white/50 dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-6 backdrop-blur-sm">
            <h3 className="text-lg font-black text-slate-800 dark:text-white flex items-center gap-2">
                <DollarSign className="w-5 h-5 text-emerald-500" />
                Trading Business Health
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 mb-6">
                High-level overview of IB conversions, funding rates, and total
                system assets.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* IB Referrals */}
                <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-4 shadow-sm hover:shadow-md transition-shadow cursor-default">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <Users className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black text-gray-900 dark:text-white tabular-nums leading-none truncate">
                                    {data.totalIbReferrals.toLocaleString()}
                                </span>
                                <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10 px-1.5 py-0.5 rounded-lg shrink-0">
                                    {data.referralRate.toFixed(1)}%
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 truncate">
                                IB Referred Users
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                vs {data.directSignups.toLocaleString()} direct
                            </p>
                        </div>
                    </div>
                </div>

                {/* Funded Accounts */}
                <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-4 shadow-sm hover:shadow-md transition-shadow cursor-default">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <CreditCard className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black text-gray-900 dark:text-white tabular-nums leading-none truncate">
                                    {data.fundedAccounts.toLocaleString()}
                                </span>
                                <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-lg shrink-0">
                                    {data.fundingRate.toFixed(1)}%
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 truncate">
                                Funded Traders
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                vs {data.unfundedAccounts.toLocaleString()} unfunded
                            </p>
                        </div>
                    </div>
                </div>

                {/* System Assets */}
                <div className="rounded-xl border border-gray-200 dark:border-white/10 bg-white dark:bg-[#151925] p-4 shadow-sm hover:shadow-md transition-shadow cursor-default">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                            <DollarSign className="w-5 h-5" />
                        </div>
                        <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2">
                                <span className="text-xl font-black text-gray-900 dark:text-white tabular-nums leading-none truncate">
                                    {formatCurrency(data.totalSystemAssets)}
                                </span>
                            </div>
                            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mt-1 truncate">
                                Total System Assets
                            </p>
                            <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate">
                                avg {formatCurrency(data.averageBalance)} / funded
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
