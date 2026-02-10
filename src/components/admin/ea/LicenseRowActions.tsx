"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Check, X, ExternalLink } from "lucide-react";
import { ApproveLicenseModal } from "./ApproveLicenseModal";
import { RejectLicenseModal } from "./RejectLicenseModal";

interface LicenseRowActionsProps {
    license: any;
    adminId: string;
}

export function LicenseRowActions({ license, adminId }: LicenseRowActionsProps) {
    const [isApproveOpen, setIsApproveOpen] = useState(false);
    const [isRejectOpen, setIsRejectOpen] = useState(false);
    const [isPopoverOpen, setIsPopoverOpen] = useState(false);

    const getIBLink = (broker: string) => {
        if (broker === "EXNESS") return "https://my.exness.com/partner/";
        if (broker === "VANTAGE") return "https://portal.vantagemarkets.com/ib/login";
        return "#";
    };

    if (license.status !== "PENDING") {
        return (
            <span className="text-gray-400 text-xs italic">
                {license.status === "APPROVED" ? "Active" : "Processed"}
            </span>
        );
    }

    return (
        <div className="flex items-center justify-end gap-2">
            <a
                href={getIBLink(license.broker)}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-2 text-xs font-medium text-gray-500 hover:text-primary px-3 py-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/5 transition"
            >
                <ExternalLink size={14} />
                Check IB
            </a>

            <Button
                size="sm"
                onClick={() => setIsRejectOpen(true)}
                className="bg-red-50 hover:bg-red-100 text-red-600 border border-red-100 hover:border-red-200 font-bold px-3 py-1.5 h-auto rounded-lg text-xs transition-all"
            >
                <X size={14} className="mr-1.5" />
                Reject
            </Button>

            <Button
                size="sm"
                onClick={() => setIsApproveOpen(true)}
                className="bg-primary hover:bg-[#00B078] text-white border-none shadow-sm shadow-primary/20 hover:shadow-primary/40 hover:-translate-y-0.5 px-3 py-1.5 h-auto rounded-lg text-xs font-bold transition-all"
            >
                <Check size={14} className="mr-1.5" />
                Approve
            </Button>

            <ApproveLicenseModal
                isOpen={isApproveOpen}
                onClose={() => setIsApproveOpen(false)}
                license={license}
                adminId={adminId}
            />

            <RejectLicenseModal
                isOpen={isRejectOpen}
                onClose={() => setIsRejectOpen(false)}
                license={license}
                adminId={adminId}
            />
        </div>
    );
}
