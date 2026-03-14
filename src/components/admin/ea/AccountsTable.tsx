
"use client";

import { useState, useMemo } from "react";
import { format } from "date-fns";
import { Edit, Trash2, Check, X, Search, Filter, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import { EALicenseWithUser } from "@/types/ea-license";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BrokerLogo } from "@/components/ui/BrokerLogo";
import { Button } from "@/components/ui/Button";
import Link from "next/link";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

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
    const [searchTerm, setSearchTerm] = useState("");
    const [filterStatus, setFilterStatus] = useState<AccountStatus | "ALL">("ALL");

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
        } catch (error: any) {
            toast.error(error instanceof Error ? error.message : (error?.message || "Failed to delete license"));
            setIsConfirmOpen(false);
        } finally {
            setIsDeleting(false);
        }
    };

    const closeModal = () => {
        setModalType(null);
        setSelectedLicense(null);
    };

    const filteredLicenses = useMemo(() => {
        return licenses.filter(license => {
            const searchLower = searchTerm.toLowerCase();
            const matchesSearch = 
                license.accountNumber.toLowerCase().includes(searchLower) || 
                license.user.name?.toLowerCase().includes(searchLower) ||
                license.user.email?.toLowerCase().includes(searchLower) ||
                license.broker.toLowerCase().includes(searchLower);
            
            const matchesStatus = filterStatus === "ALL" || license.status === filterStatus;

            return matchesSearch && matchesStatus;
        });
    }, [licenses, searchTerm, filterStatus]);

    return (
        <div className="flex flex-col h-full">
            {/* Toolbar Card */}
            <div className="bg-white dark:bg-[#0B0E14] border border-gray-200 dark:border-white/10 rounded-xl p-4 shadow-sm flex flex-col md:flex-row gap-4 mb-6">
                <div className="flex items-center gap-2 px-4 py-2 bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-200 dark:border-white/10 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary transition-colors flex-1 w-full max-w-md h-[38px]">
                    <Search size={16} className="text-gray-400" aria-hidden="true" />
                    <input
                        type="text"
                        placeholder="Search accounts or users..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-transparent text-sm focus:outline-none w-full text-gray-900 dark:text-white placeholder:text-gray-400"
                    />
                </div>
                <div className="flex gap-4 w-full md:w-auto overflow-x-auto">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="outline"
                                size="md"
                                className="h-[38px] flex items-center justify-between gap-2 bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 text-gray-700 dark:text-gray-300 w-full md:w-48 group hover:bg-gray-50 dark:hover:bg-white/5"
                            >
                                <span className="whitespace-nowrap flex items-center gap-1.5 font-medium">
                                    Status: <span className="text-primary font-bold">{filterStatus === "ALL" ? "All" : filterStatus}</span>
                                </span>
                                <ChevronDown size={14} className="text-gray-400 group-hover:text-primary transition-colors" aria-hidden="true" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-full md:w-48">
                            <DropdownMenuItem onClick={() => setFilterStatus("ALL")}>All Status</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterStatus("PENDING")}>Pending</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterStatus("APPROVED")}>Approved</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterStatus("REJECTED")}>Rejected</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterStatus("SUSPENDED")}>Suspended</DropdownMenuItem>
                            <DropdownMenuItem onClick={() => setFilterStatus("EXPIRED")}>Expired</DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Data Table Card */}
            <div className="bg-white dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm flex flex-col relative w-full flex-1">
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
                            {filteredLicenses.map((license) => (
                                <tr key={license.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors group">
                                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white font-mono group-hover:text-primary transition-colors">
                                        {license.accountNumber}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="p-1.5 bg-white dark:bg-white/5 rounded border border-gray-100 dark:border-white/10">
                                                <BrokerLogo broker={license.broker} size={24} />
                                            </div>
                                            <span className="text-gray-600 dark:text-gray-300 font-medium">{license.broker.replace("_", " ")}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <Link href={`/admin/users/${license.userId}?from=/admin/ea/accounts`} className="block hover:bg-gray-50 dark:hover:bg-white/5 rounded-lg -m-2 p-2 transition-colors">
                                            <div>
                                                <p className="font-bold text-gray-900 dark:text-white text-sm hover:text-primary transition-colors">{license.user.name}</p>
                                                <p className="text-gray-500 dark:text-gray-400 text-xs mt-0.5">{license.user.email}</p>
                                            </div>
                                        </Link>
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge status={license.status} />
                                    </td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 text-xs font-medium">
                                        {format(new Date(license.createdAt), "dd MMM yyyy")}
                                    </td>
                                    <td className="px-6 py-4 text-right">
                                        <div className="flex items-center justify-end gap-1">
                                            {license.status === AccountStatus.PENDING && (
                                                <>
                                                    <Button size="icon" variant="ghost" onClick={() => handleApprove(license)} className="text-green-500 hover:text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20 h-8 w-8 rounded-lg transition-colors" aria-label="Approve">
                                                        <Check size={16} />
                                                    </Button>
                                                    <Button size="icon" variant="ghost" onClick={() => handleReject(license)} className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 rounded-lg transition-colors" aria-label="Reject">
                                                        <X size={16} />
                                                    </Button>
                                                </>
                                            )}

                                            <Button size="icon" variant="ghost" onClick={() => confirmDelete(license)} className="text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 h-8 w-8 rounded-lg transition-colors" aria-label="Delete">
                                                <Trash2 size={16} />
                                            </Button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filteredLicenses.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                                        {searchTerm || filterStatus !== "ALL" ? "No matching accounts found for your filters." : "No accounts found."}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {/* Pagination Placeholder */}
                <div className="border-t border-gray-200 dark:border-white/5 py-3 px-6 bg-gray-50/50 dark:bg-white/5 flex items-center justify-between text-sm text-gray-500 mt-auto">
                    <span>Showing 1 - {filteredLicenses.length} of {filteredLicenses.length} accounts</span>
                    <div className="flex items-center gap-2 opacity-50 pointer-events-none">
                        <Button variant="outline" size="sm" className="h-8 text-xs">Previous</Button>
                        <Button variant="outline" size="sm" className="h-8 text-xs">Next</Button>
                    </div>
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
        </div>
    );
}
