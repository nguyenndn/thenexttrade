import { EALicense } from "@/types/ea-license";
import { BROKERS } from "@/config/brokers";
import { cn } from "@/lib/utils";
import { AccountStatus } from "@prisma/client";
import { GripVertical, Trash2, Clock } from "lucide-react";

interface EALicenseCardProps {
    license: EALicense;
    onRemove?: (licenseId: string) => void;
    isRemoving?: boolean;
}

export function EALicenseCard({ license, onRemove, isRemoving }: EALicenseCardProps) {
    const isApproved = license.status === AccountStatus.APPROVED;
    const isPending = license.status === AccountStatus.PENDING;

    // SVG Ring Variables (Removed but kept empty for safety just in case needed later, or we can just nuke them)

    const brokerName = BROKERS[license.broker]?.name || license.broker;
    const formattedDate = new Date(license.createdAt).toLocaleDateString('en-US', { day: '2-digit', month: '2-digit', year: 'numeric' }) + " " + new Date(license.createdAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });

    const isRejected = license.status === AccountStatus.REJECTED;

    return (
        <div className={cn(
            "relative rounded-xl bg-white dark:bg-[#151925] p-5 flex flex-col transition-all duration-300",
            "border shadow-sm",
            isApproved ? "border-[#00C888] dark:border-[#00C888]" : (isPending ? "border-[#EAB308] dark:border-[#EAB308]/50" : "border-red-500/50")
        )}>
            {/* Header */}
            <div className="flex justify-between items-center mb-6 relative">
                <GripVertical size={14} className="opacity-40 flex-shrink-0 text-gray-500" />
                
                <button 
                    onClick={(e) => {
                        e.stopPropagation();
                        onRemove?.(license.id);
                    }}
                    disabled={isRemoving}
                    className="text-gray-400 hover:text-red-500 transition-colors bg-transparent border-0"
                    aria-label="Remove Account"
                >
                    <Trash2 size={12} strokeWidth={2.5} />
                </button>
            </div>

            {/* Centered Main Info (Replacing Ring) */}
            <div className="flex justify-center mb-8">
                <div className="text-center">
                    <span className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
                        {brokerName}
                    </span>
                    <p className="text-sm font-bold text-gray-500 dark:text-gray-400 mt-1">
                        #{license.accountNumber}
                    </p>
                </div>
            </div>

            {/* Warning for Pending Accounts */}
            {isPending && (
                <div className="mb-6 flex gap-2 items-center px-3 py-2.5 rounded-lg bg-orange-50 dark:bg-orange-500/10 border border-orange-200 dark:border-orange-500/20 text-orange-600 dark:text-orange-400 text-[11px] font-medium leading-snug">
                    <Clock size={16} className="flex-shrink-0" />
                    <p>Your MT5 account is being reviewed. This usually takes 24-48 hours.</p>
                </div>
            )}

            {/* 2 Rows of Info */}
            <div className="space-y-3 mt-auto">
                <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-500 font-medium tracking-wide">Added Time</span>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{formattedDate}</span>
                </div>
                <div className="flex justify-between items-center text-[11px]">
                    <span className="text-gray-500 font-medium tracking-wide">Status</span>
                    <span className={cn(
                        "font-bold capitalize",
                        isApproved ? "text-[#22C55E]" : (isPending ? "text-[#EAB308]" : "text-red-500")
                    )}>
                        {license.status.toLowerCase()}
                    </span>
                </div>
            </div>
        </div>
    );
}
