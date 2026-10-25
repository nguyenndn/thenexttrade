"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Key, CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import {
    approveAccount,
    rejectAccount,
} from "@/app/admin/trading-systems/accounts/actions";

export interface EALicenseItem {
    id: string;
    broker: string;
    accountNumber: string;
    status: string;
    startDate: Date | string | null;
    expiryDate: Date | string | null;
    createdAt: Date | string;
}

interface UserLicensesListProps {
    licenses: EALicenseItem[];
}

const licenseStatusStyles: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-700 dark:bg-yellow-500/20 dark:text-yellow-400 border-yellow-200 dark:border-yellow-500/30",
    APPROVED: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/30",
    REJECTED: "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400 border-red-200 dark:border-red-500/30",
    EXPIRED: "bg-gray-100 text-gray-600 dark:bg-gray-500/20 dark:text-gray-400 border-gray-200 dark:border-white/10",
    SUSPENDED: "bg-orange-100 text-orange-700 dark:bg-orange-500/20 dark:text-orange-400 border-orange-200 dark:border-orange-500/30",
};

export function UserLicensesList({ licenses }: UserLicensesListProps) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [busyId, setBusyId] = useState<string | null>(null);
    const activeLicenses = licenses.filter((l) => l.status === "APPROVED");

    const handleApprove = (licenseId: string, accountNumber: string) => {
        setBusyId(licenseId);
        startTransition(async () => {
            try {
                const res = await approveAccount(licenseId, {
                    expiryDate: undefined,
                    note: "Approved via User Detail",
                });
                if (res.success) {
                    toast.success(`Approved EA License for #${accountNumber}`);
                    router.refresh();
                } else {
                    toast.error(res.error || "Failed to approve EA License");
                }
            } finally {
                setBusyId(null);
            }
        });
    };

    const handleReject = (licenseId: string, accountNumber: string) => {
        setBusyId(licenseId);
        startTransition(async () => {
            try {
                const res = await rejectAccount(licenseId, {
                    reason: "Not verified under our IB network",
                });
                if (res.success) {
                    toast.success(`Rejected EA License for #${accountNumber}`);
                    router.refresh();
                } else {
                    toast.error(res.error || "Failed to reject EA License");
                }
            } finally {
                setBusyId(null);
            }
        });
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                    <h3 className="text-base font-bold text-gray-800 dark:text-white flex items-center gap-2">
                        <Key size={18} className="text-primary" />
                        EA Licenses
                    </h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                        Registered trading bot licenses, validity windows, and authorized account numbers.
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-white/5 border border-gray-200 dark:border-white/10 px-3 py-1 rounded-lg">
                        {licenses.length} Total
                    </span>
                    {activeLicenses.length > 0 && (
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 px-3 py-1 rounded-lg">
                            {activeLicenses.length} Active
                        </span>
                    )}
                </div>
            </div>

            {licenses.length > 0 ? (
                <div className="divide-y divide-gray-200 rounded-lg border border-gray-200 bg-white shadow-sm dark:divide-white/10 dark:border-white/10 dark:bg-[#151925]">
                    {licenses.map((lic) => (
                        <div
                            key={lic.id}
                            className="flex flex-col gap-4 p-4 transition-colors hover:bg-gray-50/50 dark:hover:bg-white/[0.02] sm:flex-row sm:items-center sm:justify-between sm:p-5"
                        >
                            <div className="flex min-w-0 items-start gap-3.5">
                                <div className="p-2.5 bg-gray-100 dark:bg-white/5 rounded-lg text-gray-600 dark:text-gray-300 shrink-0 mt-0.5">
                                    <Key size={18} />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-bold text-gray-800 dark:text-white truncate">
                                            {lic.broker}
                                        </p>
                                        <span className="text-xs font-mono font-semibold text-gray-500">
                                            #{lic.accountNumber}
                                        </span>
                                    </div>
                                    <p className="mt-1 text-xs text-gray-500 flex flex-wrap items-center gap-x-2 gap-y-0.5">
                                        <span>
                                            {lic.startDate
                                                ? `Activated: ${format(new Date(lic.startDate), "MMM d, yyyy")}`
                                                : "Pending activation"}
                                        </span>
                                        <span>·</span>
                                        <span>
                                            {lic.expiryDate
                                                ? `Expires: ${format(new Date(lic.expiryDate), "MMM d, yyyy")}`
                                                : "Lifetime license"}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-2 sm:justify-end shrink-0 flex-wrap">
                                {lic.status === "PENDING" && (
                                    <>
                                        <Button
                                            type="button"
                                            variant="outline"
                                            size="sm"
                                            disabled={isPending && busyId === lic.id}
                                            onClick={() =>
                                                handleReject(lic.id, lic.accountNumber)
                                            }
                                            className="h-8 px-2.5 rounded-lg text-xs font-bold text-red-500 border-red-200 hover:bg-red-50 dark:border-red-500/20 dark:hover:bg-red-500/10"
                                        >
                                            <XCircle size={13} />
                                            <span>Reject</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            variant="primary"
                                            size="sm"
                                            disabled={isPending && busyId === lic.id}
                                            onClick={() =>
                                                handleApprove(lic.id, lic.accountNumber)
                                            }
                                            className="h-8 px-3 rounded-lg text-xs font-bold"
                                        >
                                            {isPending && busyId === lic.id ? (
                                                <Loader2
                                                    size={13}
                                                    className="animate-spin"
                                                />
                                            ) : (
                                                <CheckCircle2 size={13} />
                                            )}
                                            <span>Approve</span>
                                        </Button>
                                    </>
                                )}
                                {(lic.status === "REJECTED" ||
                                    lic.status === "SUSPENDED") && (
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        disabled={isPending && busyId === lic.id}
                                        onClick={() =>
                                            handleApprove(lic.id, lic.accountNumber)
                                        }
                                        className="h-8 px-2.5 rounded-lg text-xs font-bold"
                                    >
                                        {isPending && busyId === lic.id ? (
                                            <Loader2
                                                size={13}
                                                className="animate-spin"
                                            />
                                        ) : (
                                            <CheckCircle2 size={13} />
                                        )}
                                        <span>Approve</span>
                                    </Button>
                                )}
                                <span
                                    className={`inline-block text-[11px] font-bold px-3 py-1 rounded-md uppercase tracking-wider border ${
                                        licenseStatusStyles[lic.status] || "bg-gray-100 text-gray-600 border-gray-200"
                                    }`}
                                >
                                    {lic.status}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="rounded-lg border border-gray-200 bg-white p-12 text-center shadow-sm dark:border-white/10 dark:bg-[#151925]">
                    <Key size={32} className="mx-auto text-gray-400 mb-3" />
                    <p className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                        No EA licenses registered.
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        When the user purchases or requests bot licenses, they will appear here for verification.
                    </p>
                </div>
            )}
        </div>
    );
}
