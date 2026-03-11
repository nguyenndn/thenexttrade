"use client";

import { formatDistanceToNow } from "date-fns";
import { enUS } from "date-fns/locale";
import { Check, X, ExternalLink } from "lucide-react";
import { EALicenseWithUser } from "@/types/ea-license";
import { BrokerLogo } from "@/components/ui/BrokerLogo";
import { Button } from "@/components/ui/Button";
import { BROKERS } from "@/config/brokers";
import { cn } from "@/lib/utils";
import Link from "next/link";

interface PendingAccountCardProps {
    license: EALicenseWithUser;
    onApprove: (license: EALicenseWithUser) => void;
    onReject: (license: EALicenseWithUser) => void;
}

export function PendingAccountCard({ license, onApprove, onReject }: PendingAccountCardProps) {
    const brokerConfig = BROKERS[license.broker];

    return (
        <div className="bg-white dark:bg-[#1E2028] rounded-xl p-6 border border-gray-100 dark:border-white/5 shadow-sm hover:shadow-md transition-shadow flex flex-col items-center text-center group h-full relative">

            {/* Time Absolute */}
            <div className="absolute top-5 right-5">
                <span className="text-[10px] bg-gray-100 dark:bg-white/10 px-2 py-1 rounded-full text-gray-500 font-bold">
                    {formatDistanceToNow(new Date(license.createdAt), { addSuffix: true, locale: enUS })}
                </span>
            </div>

            {/* Header: Centered Logo */}
            <div className="mt-2 mb-4">
                <BrokerLogo broker={license.broker} size={120} />
            </div>

            {/* Info */}
            <div className="flex-1 flex flex-col items-center justify-center space-y-1 mb-6">
                <p className="font-black text-gray-900 dark:text-white font-mono text-2xl tracking-tight">
                    {license.accountNumber}
                </p>
                <div className="flex flex-col items-center">
                    <Link
                        href={`/admin/users/${license.userId}?from=/admin/ea/accounts/pending`}
                        className="text-sm font-bold text-gray-400 uppercase tracking-widest hover:text-primary hover:underline transition-all"
                    >
                        {license.user.name || license.user.email}
                    </Link>
                </div>
            </div>

            {/* Actions Grid */}
            <div className="grid grid-cols-2 gap-3 w-full mt-auto">
                {/* Check IB */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="col-span-1 h-10 bg-cyan-50 dark:bg-cyan-900/10 text-cyan-600 dark:text-cyan-400 hover:bg-cyan-100 dark:hover:bg-cyan-900/20 rounded-xl font-bold text-xs px-2 whitespace-nowrap"
                    onClick={() => window.open(brokerConfig?.ibDashboardUrl, "_blank")}
                >
                    <ExternalLink size={14} className="mr-1" />
                    Check IB
                </Button>

                {/* Reject */}
                <Button
                    variant="ghost"
                    size="sm"
                    className="col-span-1 h-10 bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-400 dark:hover:bg-red-900/20 rounded-xl font-bold text-xs px-2 whitespace-nowrap"
                    onClick={() => onReject(license)}
                >
                    <X size={14} className="mr-1" />
                    Reject
                </Button>

                {/* Approve - Full Width */}
                <Button
                    variant="primary"
                    size="md"
                    className="col-span-2 shadow-primary/20 uppercase tracking-wide w-full"
                    onClick={() => onApprove(license)}
                >
                    <Check size={18} className="mr-2" />
                    Approve
                </Button>
            </div>
        </div>
    );
}
