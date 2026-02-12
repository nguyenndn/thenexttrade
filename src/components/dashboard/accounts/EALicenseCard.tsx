import { EALicense } from "@/types/ea-license";
import { BROKERS } from "@/config/brokers";
import { BrokerLogo } from "@/components/ui/BrokerLogo";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { cn } from "@/lib/utils";
import { AccountStatus } from "@prisma/client";

interface EALicenseCardProps {
    license: EALicense;
    onClick?: (license: EALicense) => void;
}

export function EALicenseCard({ license, onClick }: EALicenseCardProps) {
    const statusConfig: Record<string, { className: string; label: string }> = {
        [AccountStatus.APPROVED]: {
            className: "bg-primary/10 text-primary border-primary/20 shadow-[0_0_15px_rgba(0,200,136,0.3)]",
            label: "Active"
        },
        [AccountStatus.PENDING]: {
            className: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20 shadow-[0_0_15px_rgba(234,179,8,0.2)]",
            label: "Pending"
        },
        [AccountStatus.REJECTED]: {
            className: "bg-red-500/10 text-red-500 border-red-500/20",
            label: "Rejected"
        },
        [AccountStatus.EXPIRED]: {
            className: "bg-gray-500/10 text-gray-500 border-gray-500/20",
            label: "Expired"
        },
        [AccountStatus.SUSPENDED]: {
            className: "bg-gray-500/10 text-gray-500 border-gray-500/20",
            label: "Suspended"
        }
    };

    const config = statusConfig[license.status] || statusConfig[AccountStatus.EXPIRED];

    return (
        <div
            onClick={() => onClick?.(license)}
            className={cn(
                "relative rounded-xl p-6 transition-all duration-300 border group",
                "border-gray-100 dark:border-white/5 bg-white dark:bg-[#1E2028]",
                onClick ? "cursor-pointer hover:shadow-2xl hover:shadow-primary/5 hover:-translate-y-1 hover:border-primary/30" : ""
            )}
        >
            {/* Status Badge (Absolute) */}
            <div className="absolute top-4 right-4">
                <span className={cn(
                    "px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border backdrop-blur-md transition-all",
                    config.className
                )}>
                    {config.label}
                </span>
            </div>

            {/* Centered Logo */}
            <div className="flex justify-center mb-4 mt-8">
                <BrokerLogo broker={license.broker} size={80} />
            </div>

            {/* Content: Centered Info */}
            <div className="text-center space-y-1">
                <p className="text-2xl font-black text-gray-900 dark:text-white font-mono tracking-tight group-hover:text-primary transition-colors">
                    {license.accountNumber}
                </p>
                <p className="text-sm text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wide">
                    {BROKERS[license.broker]?.name || license.broker}
                </p>
            </div>
        </div>
    );
}
