
"use client";

import { useState } from "react";
import { toast } from "sonner";
import { format } from "date-fns";
import { enUS } from "date-fns/locale";
import { X, ExternalLink, Loader2, Trash2, Ban } from "lucide-react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { BrokerLogo } from "@/components/ui/BrokerLogo";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { BROKERS } from "@/config/brokers";
import { cancelAccountRequest, removeAccount } from "@/app/dashboard/trading-systems/actions";
import { EALicense } from "@/types/ea-license";
import { AccountStatus } from "@prisma/client";

interface AccountDetailModalProps {
    license: EALicense | null;
    isOpen: boolean;
    onClose: () => void;
}

export function AccountDetailModal({ license, isOpen, onClose }: AccountDetailModalProps) {
    const [isProcessing, setIsProcessing] = useState(false);

    if (!license) return null;

    const brokerConfig = BROKERS[license.broker];

    const handleCancel = async () => {
        if (!confirm("Are you sure you want to cancel this request?")) return;

        setIsProcessing(true);
        try {
            const result = await cancelAccountRequest(license.id);
            if (result.success) {
                toast.success("Request cancelled successfully");
                onClose();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRemove = async () => {
        if (!confirm("Are you sure you want to remove this account from the list?")) return;

        setIsProcessing(true);
        try {
            const result = await removeAccount(license.id);
            if (result.success) {
                toast.success("Account removed successfully");
                onClose();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-white dark:bg-[#1E2028] rounded-3xl border-0 dark:border dark:border-white/5 max-w-md">
                <DialogHeader>
                    <div className="flex items-center justify-between">
                        <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                            Account Details
                        </DialogTitle>
                        <div onClick={onClose} className="cursor-pointer p-1 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 transition">
                            {/* Close handled by Dialog primitive usually, but good to have explicit if needed or rely on X in DialogContent */}
                        </div>
                    </div>
                </DialogHeader>

                <div className="py-2 space-y-6">
                    {/* Header Info */}
                    <div className="flex items-center gap-4 bg-gray-50 dark:bg-white/5 p-4 rounded-2xl">
                        <BrokerLogo broker={license.broker} size={96} />
                        <div>
                            <p className="text-xl font-bold text-gray-900 dark:text-white font-mono">
                                {license.accountNumber}
                            </p>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {brokerConfig?.name}
                            </p>
                        </div>
                    </div>

                    {/* Status & Dates */}
                    <div className="space-y-4">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5">
                            <span className="text-sm text-gray-500">Status</span>
                            <StatusBadge status={license.status} />
                        </div>

                        <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5">
                            <span className="text-sm text-gray-500">Created At</span>
                            <span className="text-sm font-medium dark:text-gray-200">
                                {format(new Date(license.createdAt), "dd/MM/yyyy HH:mm", { locale: enUS })}
                            </span>
                        </div>

                        {license.expiryDate && (
                            <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-white/5">
                                <span className="text-sm text-gray-500">Expires At</span>
                                <span className="text-sm font-medium dark:text-gray-200">
                                    {format(new Date(license.expiryDate), "dd/MM/yyyy", { locale: enUS })}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Messages */}
                    {license.status === AccountStatus.PENDING && (
                        <div className="bg-yellow-50 dark:bg-yellow-900/10 p-4 rounded-xl text-sm text-yellow-700 dark:text-yellow-400">
                            ⏳ Your request is being reviewed. Please wait.
                        </div>
                    )}

                    {license.status === AccountStatus.REJECTED && license.rejectReason && (
                        <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-xl text-sm text-red-700 dark:text-red-400">
                            <p className="font-bold flex items-center gap-2 mb-1">
                                <Ban size={16} /> Rejection Reason:
                            </p>
                            {license.rejectReason}
                        </div>
                    )}
                </div>

                <DialogFooter className="flex-col sm:flex-row gap-2">
                    {license.status === AccountStatus.PENDING && (
                        <Button
                            variant="ghost" // Using ghost base but overriding styles for red pill
                            className="w-full py-3 rounded-xl font-bold bg-red-50 text-red-600 hover:bg-red-100 dark:bg-red-900/10 dark:text-red-500 dark:hover:bg-red-900/20 transition-all"
                            onClick={handleCancel}
                            disabled={isProcessing}
                        >
                            {isProcessing ? <Loader2 className="animate-spin w-4 h-4" /> : <Trash2 className="w-4 h-4 mr-2" />}
                            Cancel Request
                        </Button>
                    )}

                    {(license.status === AccountStatus.APPROVED || license.status === AccountStatus.REJECTED || license.status === AccountStatus.EXPIRED) && (
                        <Button
                            variant="ghost"
                            className="w-full py-3 rounded-xl font-bold bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600 dark:bg-white/5 dark:text-gray-400 dark:hover:bg-red-900/10 dark:hover:text-red-500 transition-all"
                            onClick={handleRemove}
                            disabled={isProcessing}
                        >
                            {(license.status === AccountStatus.APPROVED ? "Remove Account" : "Delete from list")}
                        </Button>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
