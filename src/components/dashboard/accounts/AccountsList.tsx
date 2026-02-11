
"use client";

import { useState } from "react";
import { Plus, Wallet } from "lucide-react";
import { EALicense } from "@/types/ea-license";
import { EALicenseCard } from "@/components/dashboard/accounts/EALicenseCard";
import { AddAccountModal } from "@/components/dashboard/accounts/AddAccountModal";
import { AccountDetailModal } from "@/components/dashboard/accounts/AccountDetailModal";

interface AccountsListProps {
    licenses: EALicense[]; // Passed from server
}

export function AccountsList({ licenses }: AccountsListProps) {
    const [selectedLicense, setSelectedLicense] = useState<EALicense | null>(null);

    return (
        <>
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h1 className="sr-only">My Accounts</h1>
                    <p className="text-transparent bg-clip-text bg-gradient-to-r from-gray-800 to-gray-500 dark:from-white dark:to-gray-500 font-bold text-lg tracking-tight">
                        Manage your EA trading accounts
                    </p>
                </div>
                {licenses.length > 0 && <AddAccountModal />}
            </div>

            {licenses.length === 0 ? (
                <div className="bg-white dark:bg-[#1E2028] rounded-[2.5rem] p-16 text-center border border-gray-100 dark:border-white/5 shadow-sm">
                    <div className="inline-flex items-center justify-center p-4 rounded-xl bg-cyan-500/10 text-cyan-500 mb-6 ring-4 ring-cyan-500/5">
                        <Wallet size={40} />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                        No accounts found
                    </h3>
                    <p className="text-gray-500 dark:text-gray-400 mb-8 max-w-md mx-auto">
                        Add your trading account to start using EA.
                    </p>
                    <div className="inline-block">
                        <AddAccountModal />
                    </div>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {licenses.map((license) => (
                        <EALicenseCard
                            key={license.id}
                            license={license}
                            onClick={(lic) => setSelectedLicense(lic)}
                        />
                    ))}
                </div>
            )}

            <AccountDetailModal
                license={selectedLicense}
                isOpen={!!selectedLicense}
                onClose={() => setSelectedLicense(null)}
            />
        </>
    );
}
