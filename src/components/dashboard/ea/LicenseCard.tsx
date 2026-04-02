"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { cancelAccountRequest, removeAccount } from "@/app/dashboard/trading-systems/actions";
import { toast } from "sonner";
import { useRouter } from "next/navigation";
import { Trash2, Clock, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";

interface LicenseCardProps {
    license: any;
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
                toast.success(isPending ? "Request cancelled" : "Account removed");
                router.refresh();
            } else {
                toast.error(res.error || "Failed");
            }
        } catch (error: any) {
            toast.error(error instanceof Error ? error.message : (error?.message || "Something went wrong"));
        } finally {
            setIsLoading(false);
            setIsConfirmOpen(false);
        }
    };

    const statusConfig = {
        PENDING: { color: "text-yellow-500", bg: "bg-yellow-50 dark:bg-yellow-900/10", border: "border-yellow-200 dark:border-yellow-900/30", icon: Clock },
        APPROVED: { color: "text-primary", bg: "bg-primary/5", border: "border-primary/20", icon: CheckCircle },
        REJECTED: { color: "text-red-500", bg: "bg-red-50 dark:bg-red-900/10", border: "border-red-200 dark:border-red-900/30", icon: XCircle },
        SUSPENDED: { color: "text-gray-600", bg: "bg-gray-50 dark:bg-gray-900/10", border: "border-gray-200 dark:border-white/10", icon: AlertTriangle },
        EXPIRED: { color: "text-orange-500", bg: "bg-orange-50 dark:bg-orange-900/10", border: "border-orange-200 dark:border-orange-900/30", icon: AlertTriangle },
    };

    const config = statusConfig[license.status as keyof typeof statusConfig] || statusConfig.PENDING;
    const Icon = config.icon;

    return (
        <Card className={cn("p-6 transition-shadow hover:shadow-md relative overflow-hidden", config.border, "border-l-4")}>
            {/* Status Badge */}
            <div className={cn("absolute top-4 right-4 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5", config.bg, config.color)}>
                <Icon size={14} />
                {license.status}
            </div>

            <div className="space-y-4">
                <div className="flex items-center gap-4">
                    {/* Broker Logo Mock */}
                    <div className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-white/10 flex items-center justify-center font-bold text-gray-600 text-xs text-center p-1">
                        {license.broker}
                    </div>
                    <div>
                        <p className="text-xs text-gray-600 font-medium tracking-wider uppercase mb-0.5">Account Number</p>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white font-mono">{license.accountNumber}</h3>
                    </div>
                </div>

                <div className="pt-4 border-t border-gray-200 dark:border-white/10 space-y-2 text-sm">
                    <div className="flex justify-between">
                        <span className="text-gray-600">Date Added</span>
                        <span className="font-medium text-gray-900 dark:text-white">
                            {format(new Date(license.createdAt), "MMM d, yyyy")}
                        </span>
                    </div>
                    {license.expiryDate && (
                        <div className="flex justify-between">
                            <span className="text-gray-600">Expires</span>
                            <span className="font-medium text-gray-900 dark:text-white">
                                {format(new Date(license.expiryDate), "MMM d, yyyy")}
                            </span>
                        </div>
                    )}
                    {license.rejectReason && (
                        <div className="p-3 bg-red-50 dark:bg-red-900/10 rounded-lg text-red-600 dark:text-red-400 text-xs mt-2">
                            <span className="font-bold">Reason:</span> {license.rejectReason}
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
                            "transition-all font-bold rounded-xl px-4 py-2 h-auto text-red-600 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-400 dark:hover:bg-red-900/30"
                        )}
                    >
                        <Trash2 size={16} className="mr-2" />
                        {license.status === "PENDING" ? "Cancel Request" : "Remove"}
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
        </Card >
    );
}
