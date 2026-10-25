"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
    Loader2,
    KeyRound,
    ChevronDown,
} from "lucide-react";

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
import {
    DropdownMenu,
    DropdownMenuTrigger,
    DropdownMenuContent,
    DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { adminCreateLicenseSchema } from "@/lib/validations/ea-license";
import { adminIssueLicense } from "@/app/admin/trading-systems/accounts/actions";
import { AdminCreateLicenseInput } from "@/types/ea-license";

interface IssueLicenseModalProps {
    isOpen: boolean;
    onClose: () => void;
    brokers: { name: string; slug: string }[];
}

export function IssueLicenseModal({
    isOpen,
    onClose,
    brokers,
}: IssueLicenseModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const defaultBroker = brokers[0]?.slug || "EXNESS";

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<AdminCreateLicenseInput>({
        resolver: zodResolver(adminCreateLicenseSchema),
        defaultValues: {
            broker: defaultBroker,
        },
    });

    const selectedBroker = watch("broker") || defaultBroker;

    const onSubmit = async (data: AdminCreateLicenseInput) => {
        setIsSubmitting(true);
        try {
            const result = await adminIssueLicense({
                ...data,
                expiryDate: new Date("2040-12-31T23:59:59.000Z"),
            });
            if (result.success) {
                toast.success(
                    `License granted for #${data.accountNumber}. Key: ${result.licenseKey}`
                );
                if (result.githubSynced) {
                    toast.success("GitHub backup updated.");
                } else if (result.githubSkipped) {
                    toast.warning(
                        result.syncJobId
                            ? "GitHub backup skipped (GITHUB_TOKEN missing); retry queued."
                            : "GitHub backup skipped (GITHUB_TOKEN missing)."
                    );
                } else if (result.syncJobId) {
                    toast.warning(
                        `GitHub backup failed; retry queued. ${result.githubError ?? ""}`.trim()
                    );
                } else {
                    toast.warning("GitHub backup not updated.");
                }
                reset({ broker: defaultBroker });
                onClose();
            } else {
                toast.error(result.error || "Failed to grant license");
            }
        } catch (error) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Failed to grant license"
            );
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <DialogContent className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <KeyRound size={18} className="text-emerald-500" />
                        Grant EA License Key
                    </DialogTitle>
                    <DialogDescription>
                        Directly approve an IB trading account, generate its
                        unified License Key (unlocks all 3 EAs), and update the
                        GitHub backup when it is configured.
                    </DialogDescription>
                </DialogHeader>

                <form
                    onSubmit={handleSubmit(onSubmit)}
                    className="space-y-4 mt-2"
                >
                    <div className="space-y-1.5">
                        <PremiumInput
                            label="User Email Address"
                            type="email"
                            {...register("userEmail")}
                            error={errors.userEmail?.message}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Registered email of the trader in TheNextTrade.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-300">
                            Partner Broker
                        </label>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="w-full justify-between rounded-lg h-10 bg-gray-50 dark:bg-white/5 border-gray-200 dark:border-white/10 text-sm font-medium text-gray-800 dark:text-white"
                                >
                                    <span>
                                        {brokers.find(
                                            (b) => b.slug === selectedBroker
                                        )?.name || selectedBroker}
                                    </span>
                                    <ChevronDown
                                        size={14}
                                        className="text-gray-500"
                                    />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent className="w-64">
                                {brokers.map((b) => (
                                    <DropdownMenuItem
                                        key={b.slug}
                                        onClick={() =>
                                            setValue("broker", b.slug, {
                                                shouldValidate: true,
                                            })
                                        }
                                    >
                                        {b.name} ({b.slug})
                                    </DropdownMenuItem>
                                ))}
                            </DropdownMenuContent>
                        </DropdownMenu>
                        {errors.broker?.message && (
                            <p className="text-xs text-red-500">
                                {errors.broker.message}
                            </p>
                        )}
                    </div>

                    <div className="space-y-1.5">
                        <PremiumInput
                            label="MT4 / MT5 Account Login Number"
                            {...register("accountNumber")}
                            error={errors.accountNumber?.message}
                        />
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Digits only. The License Key will lock strictly 1-to-1
                            with this account number.
                        </p>
                    </div>

                    <div className="space-y-1.5">
                        <PremiumInput
                            label="Internal Note (Optional)"
                            {...register("note")}
                        />
                    </div>

                    <DialogFooter className="gap-2 pt-2">
                        <Button
                            variant="outline"
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="rounded-lg font-bold"
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            disabled={isSubmitting}
                            className="rounded-lg font-bold"
                        >
                            {isSubmitting && (
                                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            )}
                            Grant & Sync License
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
