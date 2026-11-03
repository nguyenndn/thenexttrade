"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
    cancelAccountRequest,
    removeAccount,
} from "@/app/dashboard/trading-systems/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import {
    Trash2,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface LicenseCardData {
    id: string;
    status: "PENDING" | "APPROVED" | "REJECTED" | "SUSPENDED" | "EXPIRED" | string;
    broker: string;
    accountNumber: string;
    createdAt: Date | string;
    expiryDate?: Date | string | null;
    rejectReason?: string | null;
}

interface LicenseCardProps {
    license: LicenseCardData;
}

export function LicenseCard({ license }: LicenseCardProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [isConfirmOpen, setIsConfirmOpen] = useState(false);

    const isPending = license.status === "PENDING";
    const action = isPending ? "Cancel Request" : "Remove Account";

    const confirmDelete = () => {
        setIsConfirmOpen(true);
    };

    const handleDelete = async () => {
        setIsLoading(true);
        try {
            const func = isPending ? cancelAccountRequest : removeAccount;
            const res = await func(license.id);

            if (res.success) {
                toast.success(
                    isPending ? "Request cancelled" : "Account removed"
                );
                router.refresh();
            } else {
                toast.error(res.error || "Failed");
            }
        } catch (error: unknown) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Something went wrong"
            );
        } finally {
            setIsLoading(false);
            setIsConfirmOpen(false);
        }
    };

    const statusConfig = {
        PENDING: {
            color: "text-amber-600 dark:text-gold",
            bg: "bg-amber-50 dark:bg-gold/10",
            border: "border-amber-200 dark:border-gold/30",
            icon: Clock,
        },
        APPROVED: {
            color: "text-emerald-600 dark:text-emerald-400",
            bg: "bg-emerald-50 dark:bg-emerald-500/10",
            border: "border-emerald-200 dark:border-emerald-500/30",
            icon: CheckCircle,
        },
        REJECTED: {
            color: "text-rose-600 dark:text-rose-400",
            bg: "bg-rose-50 dark:bg-rose-500/10",
            border: "border-rose-200 dark:border-rose-500/30",
            icon: XCircle,
        },
        SUSPENDED: {
            color: "text-gray-600 dark:text-gray-400",
            bg: "bg-gray-50/80 dark:bg-[#151925]",
            border: "border-dashboard",
            icon: AlertTriangle,
        },
        EXPIRED: {
            color: "text-rose-600 dark:text-rose-400",
            bg: "bg-rose-50 dark:bg-rose-500/10",
            border: "border-rose-200 dark:border-rose-500/30",
            icon: AlertTriangle,
        },
    };

    const config =
        statusConfig[license.status as keyof typeof statusConfig] ||
        statusConfig.PENDING;
    const Icon = config.icon;

    return (
        <Card
            className={cn(
                "p-6 rounded-xl bg-white dark:bg-[#1E2028] transition-shadow hover:shadow-md relative overflow-hidden",
                config.border,
                "border-l-4"
            )}
        >
            {/* Status Badge */}
            <div
                className={cn(
                    "absolute top-4 right-4 px-3 py-1 rounded-lg text-xs font-bold flex items-center gap-1.5",
                    config.bg,
                    config.color
                )}
            >
                <Icon size={14} />
                {license.status}
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    {/* Broker Logo Mock */}
                    <div className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-white/10 flex items-center justify-center font-bold text-gray-600 dark:text-gray-300 text-xs text-center p-1">
                        {license.broker}
                    </div>
                    <div>
                        <p className="text-xs text-gray-600 dark:text-gray-400 font-medium tracking-wider uppercase mb-0.5">
                            Account Number
                        </p>
                        <h3 className="text-xl font-bold text-gray-700 dark:text-white font-mono tabular-nums">
                            {license.accountNumber}
                        </h3>
                    </div>
                </div>

                <div className="pt-4 border-t border-dashboard space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Date Added</span>
                        <span className="font-medium font-mono tabular-nums text-gray-700 dark:text-white">
                            {format(new Date(license.createdAt), "MMM d, yyyy")}
                        </span>
                    </div>
                    {license.expiryDate && (
                        <div className="flex justify-between">
                            <span className="text-gray-600 dark:text-gray-400">Expires</span>
                            <span className="font-medium font-mono tabular-nums text-gray-700 dark:text-white">
                                {format(
                                    new Date(license.expiryDate),
                                    "MMM d, yyyy"
                                )}
                            </span>
                        </div>
                    )}
                    {license.rejectReason && (
                        <div className="p-3 bg-rose-50 dark:bg-rose-500/10 rounded-lg text-rose-600 dark:text-rose-400 text-xs mt-2">
                            <span className="font-bold">Reason:</span>{" "}
                            {license.rejectReason}
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-2">
                    <Button
                        onClick={confirmDelete}
                        disabled={isLoading}
                        variant="outline"
                        size="sm"
                        className={cn(
                            "transition-all font-bold rounded-lg px-4 py-2 h-auto text-rose-600 bg-rose-50 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:hover:bg-rose-500/20"
                        )}
                    >
                        <Trash2 size={16} className="mr-2" />
                        {license.status === "PENDING"
                            ? "Cancel Request"
                            : "Remove"}
                    </Button>
                </div>
            </div>

            <ConfirmDialog
                isOpen={isConfirmOpen}
                title={action}
                description={`Are you sure you want to ${action.toLowerCase()}? This action cannot be undone.`}
                confirmText={isPending ? "Cancel Request" : "Remove"}
                cancelText="Keep"
                isLoading={isLoading}
                onConfirm={handleDelete}
                onCancel={() => setIsConfirmOpen(false)}
                variant="danger"
            />
        </Card>
    );
}
