"use client";

import { useState } from "react";
import { toast } from "sonner";
import { ShieldCheck, Monitor } from "lucide-react";
import { EALicense } from "@/types/ea-license";
import { EALicenseCard } from "@/components/dashboard/accounts/EALicenseCard";
import { AddAccountModal } from "@/components/dashboard/accounts/AddAccountModal";
import { cancelAccountRequest, removeAccount } from "@/app/dashboard/trading-systems/actions";
import { AccountStatus } from "@prisma/client";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface AccountsListProps {
    licenses: EALicense[];
    eaBrokers: any[];
}

const MAX_ACCOUNTS = 3;

export function AccountsList({ licenses, eaBrokers }: AccountsListProps) {
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [accountToRemove, setAccountToRemove] = useState<EALicense | null>(null);

    const confirmRemoveAccount = (license: EALicense) => {
        setAccountToRemove(license);
        setIsConfirmOpen(true);
    };

    const handleRemoveAccount = async () => {
        if (!accountToRemove) return;

        const isPending = accountToRemove.status === AccountStatus.PENDING;

        setRemovingId(accountToRemove.id);
        try {
            const result = isPending 
                ? await cancelAccountRequest(accountToRemove.id)
                : await removeAccount(accountToRemove.id);
                
            if (result.success) {
                toast.success(isPending ? "Request cancelled successfully" : "Account removed successfully");
            } else {
                toast.error(result.error || "Failed to remove account");
            }
        } catch (error: any) {
            toast.error(error instanceof Error ? error.message : (error?.message || "An error occurred"));
        } finally {
            setRemovingId(null);
            setIsConfirmOpen(false);
            setAccountToRemove(null);
        }
    };

    return (
        <div className="w-full bg-white dark:bg-[#0B0E14] p-6 rounded-xl border border-gray-200 dark:border-white/10 overflow-hidden">
            {/* Header: Clean & Flat */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h2 className="text-sm font-extrabold text-gray-900 dark:text-white tracking-tight">
                        Authorized MT5 Accounts
                    </h2>
                    <p className="text-xs text-gray-400 dark:text-gray-500">
                        Terminals allowed to run your EA
                    </p>
                </div>
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
                <div className="p-4 mb-2">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {licenses.map((license) => (
                            <EALicenseCard
                                key={license.id}
                                license={license}
                                onRemove={() => confirmRemoveAccount(license)}
                                isRemoving={removingId === license.id}
                            />
                        ))}
                    </div>
                    <div className="mt-6 mb-2 flex justify-center">
                        <AddAccountModal brokers={eaBrokers} />
                    </div>
                </div>
            )}

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title={accountToRemove?.status === AccountStatus.PENDING ? "Cancel Request" : "Remove Account"}
                description={accountToRemove?.status === AccountStatus.PENDING 
                    ? "Are you sure you want to cancel this request?" 
                    : "Are you sure you want to remove this account from the list? This action cannot be undone."}
                confirmText={accountToRemove?.status === AccountStatus.PENDING ? "Cancel Request" : "Remove Account"}
                cancelText="Keep"
                isLoading={!!removingId}
                onConfirm={handleRemoveAccount}
                onCancel={() => { setIsConfirmOpen(false); setAccountToRemove(null); }}
                variant="danger"
            />
        </div>
    );
}
