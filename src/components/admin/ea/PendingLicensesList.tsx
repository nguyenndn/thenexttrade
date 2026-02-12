"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ApproveLicenseModal } from "@/components/admin/ea/ApproveLicenseModal";
import { RejectLicenseModal } from "@/components/admin/ea/RejectLicenseModal";
import { Check, X, Search, ExternalLink } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PendingLicensesListProps {
    licenses: any[];
    adminId: string;
}

export function PendingLicensesList({ licenses, adminId }: PendingLicensesListProps) {
    const [selectedLicense, setSelectedLicense] = useState<any>(null);
    const [modalType, setModalType] = useState<"APPROVE" | "REJECT" | null>(null);

    const handleAction = (license: any, type: "APPROVE" | "REJECT") => {
        setSelectedLicense(license);
        setModalType(type);
    };

    const getIBLink = (broker: string) => {
        // Mock links for common brokers partner portals
        if (broker === "EXNESS") return "https://my.exness.com/partner/";
        if (broker === "VANTAGE") return "https://portal.vantagemarkets.com/ib/login";
        return "#";
    };

    if (licenses.length === 0) {
        return (
            <div className="text-center py-20 bg-gray-50 dark:bg-white/5 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10">
                <Check className="mx-auto text-gray-300 mb-4" size={48} />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white">All caught up!</h3>
                <p className="text-gray-500 mt-2">There are no pending license requests.</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {licenses.map((req) => (
                <Card key={req.id} className="p-6 transition-all hover:shadow-md border-l-4 border-l-yellow-500">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-1">
                            <div className="flex items-center gap-3">
                                <span className="text-xl font-bold text-gray-900 dark:text-white font-mono">
                                    {req.accountNumber}
                                </span>
                                <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300 font-bold tracking-wide">
                                    {req.broker}
                                </span>
                                <span className="text-xs text-gray-400">
                                    {formatDistanceToNow(new Date(req.createdAt))} ago
                                </span>
                            </div>

                            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-bold uppercase">
                                    {req.user.email?.substring(0, 2)}
                                </div>
                                <div className="flex flex-col">
                                    <span className="font-medium text-gray-900 dark:text-white">{req.user.name || "Unknown"}</span>
                                    <span className="text-xs">{req.user.email}</span>
                                </div>
                            </div>
                        </div>

                        <div className="flex items-center gap-3">
                            <a
                                href={getIBLink(req.broker)}
                                target="_blank"
                                rel="noreferrer"
                                className="hidden md:flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-primary px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition"
                            >
                                <ExternalLink size={14} />
                                Check IB
                            </a>

                            <div className="flex gap-2 w-full md:w-auto">
                                <Button
                                    onClick={() => handleAction(req, "REJECT")}
                                    className="flex-1 md:flex-none bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 hover:border-red-200 font-bold px-4 rounded-xl transition-all"
                                >
                                    <X size={18} className="mr-2" />
                                    Reject
                                </Button>
                                <Button
                                    onClick={() => handleAction(req, "APPROVE")}
                                    className="flex-1 md:flex-none bg-primary hover:bg-[#00B078] text-white font-bold shadow-lg shadow-primary/30 hover:shadow-primary/40 hover:-translate-y-0.5 px-6 rounded-xl transition-all border-none"
                                >
                                    <Check size={18} className="mr-2" />
                                    Approve
                                </Button>
                            </div>
                        </div>
                    </div>
                </Card>
            ))}

            <ApproveLicenseModal
                isOpen={modalType === "APPROVE"}
                onClose={() => setModalType(null)}
                license={selectedLicense}
                adminId={adminId}
            />

            <RejectLicenseModal
                isOpen={modalType === "REJECT"}
                onClose={() => setModalType(null)}
                license={selectedLicense}
                adminId={adminId}
            />
        </div>
    );
}
