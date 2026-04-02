"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { toast } from "sonner";
import { approveLicense } from "@/app/admin/ea/actions";
import { useRouter } from "next/navigation";
import { Calendar, Info } from "lucide-react";

interface ApproveLicenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    license: any;
    adminId: string;
}

export function ApproveLicenseModal({ isOpen, onClose, license, adminId }: ApproveLicenseModalProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [expiryDate, setExpiryDate] = useState("");
    const [note, setNote] = useState("");
    const [isLifetime, setIsLifetime] = useState(true);

    if (!license) return null;

    const handleApprove = async () => {
        setIsLoading(true);
        try {
            const res = await approveLicense(license.id, adminId, {
                expiryDate: isLifetime ? undefined : (expiryDate ? new Date(expiryDate) : undefined),
                note
            });

            if (res.success) {
                toast.success(`Account ${license.accountNumber} approved successfully`);
                toast.info("Don't forget to add this account to the Google Sheet manually!", {
                    duration: 10000,
                });
                router.refresh();
                onClose();
            } else {
                toast.error(res.error || "Failed to approve");
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
                    <DialogTitle>Approve Account</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Summary */}
                    <div className="bg-gray-50 dark:bg-[#151925] p-4 rounded-xl space-y-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Account:</span>
                            <span className="font-bold text-gray-700 dark:text-white">{license.accountNumber}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Broker:</span>
                            <span className="font-medium text-gray-700 dark:text-white">{license.broker}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">User:</span>
                            <span className="font-medium text-gray-700 dark:text-white">{license.user.email}</span>
                        </div>
                    </div>

                    <div className="p-4 bg-yellow-50 dark:bg-yellow-900/10 border border-yellow-100 dark:border-yellow-900/20 rounded-xl flex gap-3 text-sm text-yellow-700 dark:text-yellow-400">
                        <Info className="shrink-0 mt-0.5" size={18} />
                        <div>
                            <p className="font-bold">Manual Sync Required</p>
                            <p>After approving, please manually add this account number to the central Google Sheet for the EA to work.</p>
                        </div>
                    </div>

                    {/* Expiry Settings */}
                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-white">Expiry Date</label>
                        <div className="flex flex-col gap-3">
                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={isLifetime}
                                    onChange={() => setIsLifetime(true)}
                                    className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">No Expiry (Lifetime)</span>
                            </label>

                            <label className="flex items-center gap-2 cursor-pointer">
                                <input
                                    type="radio"
                                    checked={!isLifetime}
                                    onChange={() => setIsLifetime(false)}
                                    className="w-4 h-4 text-primary focus:ring-primary"
                                />
                                <span className="text-sm text-gray-700 dark:text-gray-300">Set expiry date</span>
                            </label>

                            {!isLifetime && (
                                <PremiumInput
                                    type="date"
                                    value={expiryDate}
                                    onChange={(e) => setExpiryDate(e.target.value)}
                                    icon={Calendar}
                                />
                            )}
                        </div>
                    </div>

                    {/* Check IB (Mock link) */}
                    {/* In a real app, this would link to broker partner portals */}
                </div>

                <div className="flex justify-end gap-3">
                    <Button
                        onClick={handleApprove}
                        disabled={isLoading}
                        className="rounded-xl font-bold border-none disabled:bg-gray-300 disabled:shadow-none disabled:cursor-not-allowed dark:disabled:bg-gray-800 dark:disabled:text-gray-600"
                    >
                        {isLoading ? "Approving..." : "Confirm Approval"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
