"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { toast } from "sonner";
import { rejectLicense } from "@/app/admin/ea/actions";
import { useRouter } from "next/navigation";

interface RejectLicenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    license: any;
    adminId: string;
}

export function RejectLicenseModal({ isOpen, onClose, license, adminId }: RejectLicenseModalProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [reason, setReason] = useState("");
    const [customReason, setCustomReason] = useState("");

    if (!license) return null;

    const predefinedReasons = [
        "Account not found in IB Dashboard",
        "Account belongs to different IB",
        "Invalid account number format",
    ];

    const finalReason = reason === "Other" ? customReason : reason;

    const handleReject = async () => {
        if (!finalReason) {
            toast.error("Please provide a reason");
            return;
        }

        setIsLoading(true);
        try {
            const res = await rejectLicense(license.id, adminId, finalReason);

            if (res.success) {
                toast.success("Request rejected");
                router.refresh();
                onClose();
            } else {
                toast.error(res.error || "Failed to reject");
            }
        } catch (error: any) {
            toast.error(error instanceof Error ? error.message : (error?.message || "Something went wrong"));
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md bg-white dark:bg-[#1E2028] border-gray-100 dark:border-white/5">
                <DialogHeader>
                    <DialogTitle className="text-red-500">Reject Request</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                        You are about to reject the request for account <span className="font-bold text-gray-900 dark:text-white">{license.accountNumber}</span>.
                    </p>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-900 dark:text-white">Reason for rejection *</label>
                        <div className="space-y-2">
                            {predefinedReasons.map((r) => (
                                <label key={r} className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-[#151925] transition-colors">
                                    <input
                                        type="radio"
                                        name="reason"
                                        checked={reason === r}
                                        onChange={() => setReason(r)}
                                        className="w-4 h-4 text-red-500 focus:ring-red-500"
                                    />
                                    <span className="text-sm text-gray-700 dark:text-gray-300">{r}</span>
                                </label>
                            ))}
                            <label className="flex items-center gap-2 cursor-pointer p-2 rounded hover:bg-gray-50 dark:hover:bg-[#151925] transition-colors">
                                <input
                                    type="radio"
                                    name="reason"
                                    checked={reason === "Other"}
                                    onChange={() => setReason("Other")}
                                    className="w-4 h-4 text-red-500 focus:ring-red-500"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Other</span>
                            </label>
                        </div>

                        {reason === "Other" && (
                            <textarea
                                className="w-full min-h-[80px] px-4 py-3 bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-xl focus:ring-2 focus:ring-red-500 outline-none text-sm transition-all text-gray-900 dark:text-white placeholder:text-gray-400"
                                placeholder="Violation of terms regarding..."
                                value={customReason}
                                onChange={(e) => setCustomReason(e.target.value)}
                            />
                        )}
                    </div>
                </div>

                <div className="flex justify-end gap-3">
                    <Button
                        onClick={handleReject}
                        disabled={isLoading}
                        className="rounded-xl font-bold border-none"
                    >
                        {isLoading ? "Rejecting..." : "Reject Request"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
