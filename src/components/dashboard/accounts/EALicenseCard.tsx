import { EALicense } from "@/types/ea-license";
import { BROKERS } from "@/config/brokers";
import { cn } from "@/lib/utils";
import { AccountStatus } from "@prisma/client";
import { Trash2, Clock, CheckCircle2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface EALicenseCardProps {
    license: EALicense;
    onRemove?: (licenseId: string) => void;
    isRemoving?: boolean;
}

export function EALicenseCard({ license, onRemove, isRemoving }: EALicenseCardProps) {
    const isApproved = license.status === AccountStatus.APPROVED;
    const isPending = license.status === AccountStatus.PENDING;
    const isRejected = license.status === AccountStatus.REJECTED;

    const brokerName = BROKERS[license.broker]?.name || license.broker;
    const formattedDate = new Date(license.createdAt).toLocaleDateString('en-US', {
        day: '2-digit', month: 'short', year: 'numeric'
    });

    return (
        <div className={cn(
            "relative rounded-xl bg-white dark:bg-[#151925] p-4 flex flex-col gap-3 transition-all duration-300",
            "border shadow-sm hover:shadow-md",
            isApproved ? "border-emerald-200 dark:border-emerald-500/30" :
            isPending ? "border-amber-200 dark:border-amber-500/30" :
            "border-red-200 dark:border-red-500/30"
        )}>
            {/* Top Row: Broker + Account + Delete */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5 min-w-0">
                    <span className="text-base font-black text-gray-900 dark:text-white truncate">
                        {brokerName}
                    </span>
                    <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-500/20 flex-shrink-0">
                        #{license.accountNumber}
                    </span>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => { e.stopPropagation(); onRemove?.(license.id); }}
                    disabled={isRemoving}
                    className="text-gray-300 h-7 w-7 hover:text-red-500 transition-colors bg-transparent border-0 flex-shrink-0"
                    aria-label="Remove Account"
                >
                    <Trash2 size={13} strokeWidth={2.5} />
                </Button>
            </div>

            {/* Status Badge */}
            {isPending && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20">
                    <Clock size={13} className="text-amber-500 flex-shrink-0" strokeWidth={2.5} />
                    <span className="text-[11px] font-bold text-amber-700 dark:text-amber-400">
                        Pending Review · Usually 24-48 hours
                    </span>
                </div>
            )}

            {isRejected && (
                <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20">
                    <AlertCircle size={13} className="text-red-500 flex-shrink-0" strokeWidth={2.5} />
                    <span className="text-[11px] font-bold text-red-600 dark:text-red-400">
                        Rejected
                    </span>
                </div>
            )}

            {/* Bottom Info */}
            <div className="flex items-center justify-between pt-2 border-t border-gray-50 dark:border-white/5">
                <span className="text-[11px] text-gray-400 font-medium">{formattedDate}</span>
                <div className="flex items-center gap-1.5">
                    {isApproved ? (
                        <CheckCircle2 size={13} className="text-emerald-500" strokeWidth={2.5} />
                    ) : isPending ? (
                        <Clock size={13} className="text-amber-500" strokeWidth={2.5} />
                    ) : (
                        <AlertCircle size={13} className="text-red-500" strokeWidth={2.5} />
                    )}
                    <span className={cn(
                        "text-[11px] font-bold capitalize",
                        isApproved ? "text-emerald-500" :
                        isPending ? "text-amber-500" :
                        "text-red-500"
                    )}>
                        {license.status.toLowerCase()}
                    </span>
                </div>
            </div>
        </div>
    );
}
