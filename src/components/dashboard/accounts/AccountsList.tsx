"use client";

import { useState } from "react";
import { ShieldCheck, Monitor } from "lucide-react";
import { EALicense } from "@/types/ea-license";
import { EALicenseCard } from "@/components/dashboard/accounts/EALicenseCard";
import { AddAccountModal } from "@/components/dashboard/accounts/AddAccountModal";
import { AccountDetailModal } from "@/components/dashboard/accounts/AccountDetailModal";

const MAX_ACCOUNTS = 3;

interface AccountsListProps {
    licenses: EALicense[];
    eaBrokers: any[];
}

export function AccountsList({ licenses, eaBrokers }: AccountsListProps) {
    const [selectedLicense, setSelectedLicense] = useState<EALicense | null>(null);
    const approvedCount = licenses.filter(l => l.status === "APPROVED").length;

    return (
        <>
            {/* Section Card */}
            <div className="bg-white dark:bg-[#0B0E14] rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b border-gray-50 dark:border-white/[0.03]">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                            <Monitor size={18} className="text-primary" />
                        </div>
                        <div>
                            <h2 className="text-sm font-extrabold text-gray-900 dark:text-white tracking-tight">
                                Authorized MT5 Accounts
                            </h2>
                            <p className="text-xs text-gray-400 dark:text-gray-500">
                                Terminals allowed to run your EA
                            </p>
                        </div>
                    </div>
                    <span className="text-sm font-bold text-gray-400 dark:text-gray-500">
                        {approvedCount}/{MAX_ACCOUNTS}
                    </span>
                </div>

                {/* Content */}
                {licenses.length === 0 ? (
                    <div className="px-5 py-14 text-center">
                        <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 mb-4">
                            <ShieldCheck size={24} className="text-amber-500" />
                        </div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1.5">
                            Get Verified
                        </h3>
                        <p className="text-sm text-gray-400 dark:text-gray-500 mb-6 max-w-xs mx-auto">
                            Submit your MT5 account to unlock premium EAs
                        </p>
                        <div className="inline-block">
                            <AddAccountModal brokers={eaBrokers} />
                        </div>
                    </div>
                ) : (
                    <div className="p-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {licenses.map((license) => (
                                <EALicenseCard
                                    key={license.id}
                                    license={license}
                                    onClick={(lic) => setSelectedLicense(lic)}
                                />
                            ))}
                        </div>
                        {licenses.length < MAX_ACCOUNTS && (
                            <div className="mt-4 flex justify-center">
                                <AddAccountModal brokers={eaBrokers} />
                            </div>
                        )}
                    </div>
                )}
            </div>

            <AccountDetailModal
                license={selectedLicense}
                isOpen={!!selectedLicense}
                onClose={() => setSelectedLicense(null)}
            />
        </>
    );
}
