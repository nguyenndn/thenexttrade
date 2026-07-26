"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Loader2, Calendar as CalendarIcon } from "lucide-react";

import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { approveAccountSchema } from "@/lib/validations/ea-license";
import { approveAccount } from "@/app/admin/trading-systems/accounts/actions";
import { ApproveAccountInput, EALicenseWithUser } from "@/types/ea-license";

// Start of DatePicker or similar.
// Standard input type="date" is easiest for now unless shadcn Calendar is integrated.
// I'll use type="date" to keep it simple and robust.

interface ApproveModalProps {
    license: EALicenseWithUser | null;
    isOpen: boolean;
    onClose: () => void;
}

export function ApproveModal({ license, isOpen, onClose }: ApproveModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        reset,
        formState: { errors: _errors },
    } = useForm<ApproveAccountInput>({
        resolver: zodResolver(approveAccountSchema),
    });

    const onSubmit = async (data: ApproveAccountInput) => {
        if (!license) return;
        setIsSubmitting(true);
        try {
            const result = await approveAccount(license.id, data);
            if (result.success) {
                toast.success(`Account ${license.accountNumber} approved`);
                onClose();
                reset();
            } else {
                toast.error(result.error);
            }
        } catch (error: any) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : error?.message || "An error occurred"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!license) return null;

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-white dark:bg-[#1E2028] rounded-xl border-0 dark:border max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-xl font-bold text-gray-700 dark:text-white">
                        Approve Account
                    </DialogTitle>
                    <DialogDescription>
                        You are approving account{" "}
                        <span className="font-bold text-gray-700 dark:text-white">
                            {license.accountNumber}
                        </span>{" "}
                        for {license.user.name || license.user.email}
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-6 mt-4"
                >
                    <div className="space-y-4">
                        {/* Expiry Date */}
                        <div className="space-y-2">
                            <PremiumInput
                                label="Expiry Date (Optional)"
                                type="date"
                                {...register("expiryDate", {
                                    setValueAs: (v) =>
                                        v ? new Date(v) : undefined,
                                })}
                                icon={CalendarIcon}
                            />
                            <p className="text-xs text-gray-500">
                                Leave blank for Lifetime account
                            </p>
                        </div>

                        {/* Note */}
                        <div className="space-y-2">
                            <PremiumInput
                                label="Internal Note"
                                {...register("note")}
                                placeholder="Note for other admins..."
                            />
                        </div>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            variant="outline"
                            size="smd"
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            size="smd"
                            className="bg-primary hover:bg-[#00B078] text-white font-bold"
                            disabled={isSubmitting}
                        >
                            {isSubmitting && (
                                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            )}
                            Confirm Approve
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
