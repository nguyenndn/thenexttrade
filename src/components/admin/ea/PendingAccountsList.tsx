
"use client";

import { useState } from "react";
import { CheckCircle } from "lucide-react";
import { EALicenseWithUser } from "@/types/ea-license";
import { PendingAccountCard } from "@/components/admin/ea/PendingAccountCard";
import { ApproveModal } from "@/components/admin/ea/ApproveModal";
import { RejectModal } from "@/components/admin/ea/RejectModal";

interface PendingAccountsListProps {
    licenses: EALicenseWithUser[];
}

export function PendingAccountsList({ licenses }: PendingAccountsListProps) {
    const [selectedLicense, setSelectedLicense] = useState<EALicenseWithUser | null>(null);
    const [modalType, setModalType] = useState<"APPROVE" | "REJECT" | null>(null);

    const handleApprove = (license: EALicenseWithUser) => {
        setSelectedLicense(license);
        setModalType("APPROVE");
    };

    const handleReject = (license: EALicenseWithUser) => {
        setSelectedLicense(license);
        setModalType("REJECT");
    };

    const closeModal = () => {
        setModalType(null);
        setSelectedLicense(null);
    };

    if (licenses.length === 0) {
        return (
            <div className="text-center py-24 bg-white dark:bg-[#1E2028] rounded-xl border border-gray-100 dark:border-white/5">
                <CheckCircle size={48} className="mx-auto mb-4 text-green-500" />
                <h3 className="text-xl font-bold text-gray-700 dark:text-white mb-2">No Pending Requests</h3>
                <p className="text-gray-600 dark:text-gray-300">All license requests have been processed.</p>
            </div>
        );
    }

    return (
        <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {licenses.map((license) => (
                    <PendingAccountCard
                        key={license.id}
                        license={license}
                        onApprove={handleApprove}
                        onReject={handleReject}
                    />
                ))}
            </div>

            <ApproveModal
                license={selectedLicense}
                isOpen={modalType === "APPROVE"}
                onClose={closeModal}
            />

            <RejectModal
                license={selectedLicense}
                isOpen={modalType === "REJECT"}
                onClose={closeModal}
            />
        </>
    );
}
