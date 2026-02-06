
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, AlertTriangle } from "lucide-react";

import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { rejectAccountSchema } from "@/lib/validations/ea-license";
import { rejectAccount } from "@/app/admin/ea/accounts/actions";
import { RejectAccountInput, EALicenseWithUser } from "@/types/ea-license";

interface RejectModalProps {
    license: EALicenseWithUser | null;
    isOpen: boolean;
    onClose: () => void;
}

export function RejectModal({ license, isOpen, onClose }: RejectModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm<RejectAccountInput>({
        resolver: zodResolver(rejectAccountSchema),
    });

    const onSubmit = async (data: RejectAccountInput) => {
        if (!license) return;
        setIsSubmitting(true);
        try {
            const result = await rejectAccount(license.id, data);
            if (result.success) {
                toast.success(`Rejected account ${license.accountNumber}`);
                onClose();
                reset();
            } else {
                toast.error(result.error);
            }
        } catch (error) {
            toast.error("An error occurred");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!license) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-white dark:bg-[#1E2028] rounded-3xl border-0 dark:border dark:border-white/5 max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-red-600 dark:text-red-500 flex items-center gap-2">
                        <AlertTriangle size={24} />
                        Reject Account
                    </DialogTitle>
                    <DialogDescription>
                        This action will reject the account request <span className="font-bold text-gray-900 dark:text-white">{license.accountNumber}</span>.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-4">
                    <div className="space-y-4">
                        {/* Reason */}
                        <div className="space-y-2">
                            <PremiumInput
                                label="Rejection Reason"
                                {...register("reason")}
                                placeholder="Account not found in IB Dashboard..."
                                error={errors.reason?.message}
                            />
                        </div>

                        <div className="bg-red-50 dark:bg-red-900/10 p-3 rounded-xl border border-red-100 dark:border-red-900/20">
                            <p className="text-xs text-red-600 dark:text-red-400">
                                The user will receive a notification with this reason. They can delete the account request and submit a new one.
                            </p>
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="ghost" type="button" onClick={onClose} disabled={isSubmitting}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="bg-red-500 hover:bg-red-600 text-white shadow-red-500/20"
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Confirm Reject
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
