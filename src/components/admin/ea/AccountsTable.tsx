
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Edit, Trash2, Check, X, MoreHorizontal } from "lucide-react";
import { toast } from "sonner";
import { EALicenseWithUser } from "@/types/ea-license";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BrokerLogo } from "@/components/ui/BrokerLogo";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

// Wait, checking popover.tsx in comp/ui from earlier list_dir.
// I don't see DropdownMenu.tsx. popover.tsx exists.
// I'll stick to simple buttons or try to import if I missed it.
// If no dropdown, I'll use buttons.
// Let's assume buttons for now to be safe.

import { ApproveModal } from "@/components/admin/ea/ApproveModal";
import { RejectModal } from "@/components/admin/ea/RejectModal";
import { deleteLicense } from "@/app/admin/ea/accounts/actions";
import { AccountStatus } from "@prisma/client";

interface AccountsTableProps {
    licenses: EALicenseWithUser[];
}

export function AccountsTable({ licenses }: AccountsTableProps) {
    const [selectedLicense, setSelectedLicense] = useState<EALicenseWithUser | null>(null);
    const [modalType, setModalType] = useState<"APPROVE" | "REJECT" | null>(null);

    // Confirm Dialog State
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);
    const [licenseToDelete, setLicenseToDelete] = useState<EALicenseWithUser | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const handleApprove = (license: EALicenseWithUser) => {
        setSelectedLicense(license);
        setModalType("APPROVE");
    };

    const handleReject = (license: EALicenseWithUser) => {
        setSelectedLicense(license);
        setModalType("REJECT");
    };

    const confirmDelete = (license: EALicenseWithUser) => {
        setLicenseToDelete(license);
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        if (!licenseToDelete) return;
        
        setIsDeleting(true);
        try {
            const result = await deleteLicense(licenseToDelete.id);
            if (result.success) {
                toast.success("License deleted successfully");
                setIsConfirmOpen(false);
                setLicenseToDelete(null);
            } else {
                toast.error(result.error);
                setIsConfirmOpen(false);
            }
        } catch (error) {
            toast.error("Failed to delete license");
            setIsConfirmOpen(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const closeModal = () => {
        setModalType(null);
        setSelectedLicense(null);
    };

    return (
        <>
            <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-100 dark:border-white/5 overflow-hidden shadow-sm">
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 dark:bg-white/5 text-xs uppercase text-gray-400 font-bold tracking-wider">
                            <tr>
                                <th className="px-6 py-4">Account</th>
                                <th className="px-6 py-4">Broker</th>
                                <th className="px-6 py-4">User</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Created</th>
                                <th className="px-6 py-4 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                            {licenses.map((license) => (
                                <tr key={license.id} className="hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white font-mono">
                                        {license.accountNumber}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <BrokerLogo broker={license.broker} size={48} />
                                            <span className="text-gray-600 dark:text-gray-300">{license.broker}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link href={`/admin/users/${license.userId}?from=/admin/ea/accounts`} className="block hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg -m-2 p-2 transition-colors">
                                            <div>
                                                <p className="font-medium text-gray-900 dark:text-white text-xs hover:text-primary transition-colors">{license.user.name}</p>
                                                <p className="text-gray-500 dark:text-gray-400 text-xs">{license.user.email}</p>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={license.status} />
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs">
                                        {format(new Date(license.createdAt), "dd/MM/yyyy")}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-2">
                                            {license.status === AccountStatus.PENDING && (
                                                <>
                                                    <Button size="sm" variant="ghost" onClick={() => handleApprove(license)} className="text-green-500 hover:bg-green-50 h-8 w-8 p-0">
                                                        <Check size={16} />
                                                    </Button>
                                                    <Button size="sm" variant="ghost" onClick={() => handleReject(license)} className="text-red-500 hover:bg-red-50 h-8 w-8 p-0">
                                                        <X size={16} />
                                                    </Button>
                                                </>
                                            )}

                                            <Button size="sm" variant="ghost" onClick={() => confirmDelete(license)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 h-8 w-8 p-0">
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {licenses.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        No accounts found.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            <ApproveModal license={selectedLicense} isOpen={modalType === "APPROVE"} onClose={closeModal} />
            <RejectModal license={selectedLicense} isOpen={modalType === "REJECT"} onClose={closeModal} />

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title="Delete License"
                description={`Are you sure you want to delete account ${licenseToDelete?.accountNumber}? This action cannot be undone.`}
                confirmText="Delete"
                cancelText="Cancel"
                isLoading={isDeleting}
                onConfirm={handleDelete}
                onCancel={() => {
                    setIsConfirmOpen(false);
                    setLicenseToDelete(null);
                }}
                variant="danger"
            />
        </>
    );
}
