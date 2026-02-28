"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Wallet, Loader2, ExternalLink, ArrowLeft } from "lucide-react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { submitAccountSchema } from "@/lib/validations/ea-license";
import { submitAccountRequest } from "@/app/dashboard/trading-systems/actions";
import { SubmitAccountInput } from "@/types/ea-license";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { cn } from "@/lib/utils";

interface EABrokerData {
    id: string;
    name: string;
    slug: string;
    logo: string;
    affiliateUrl: string | null;
    color: string;
}

interface AddAccountModalProps {
    brokers: EABrokerData[];
}

type ModalView = "form" | "register";

export function AddAccountModal({ brokers }: AddAccountModalProps) {
    const [open, setOpen] = useState(false);
    const [view, setView] = useState<ModalView>("form");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const {
        register,
        handleSubmit,
        setValue,
        watch,
        reset,
        formState: { errors },
    } = useForm<SubmitAccountInput>({
        resolver: zodResolver(submitAccountSchema),
        defaultValues: {
            broker: brokers[0]?.slug || "",
            accountNumber: "",
        },
    });

    const selectedBroker = watch("broker");

    const onSubmit = async (data: SubmitAccountInput) => {
        setIsSubmitting(true);
        try {
            const result = await submitAccountRequest(data);
            if (result.success) {
                toast.success("Request sent successfully!", {
                    description: "We will review and approve shortly.",
                });
                setOpen(false);
                reset();
                setView("form");
            } else {
                toast.error(result.error || "An error occurred, please try again");
            }
        } catch (error) {
            toast.error("An error occurred, please try again");
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            setView("form");
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button
                    variant="primary"
                    className="bg-primary hover:bg-[#00B078] shadow-lg shadow-primary/25 text-white font-bold rounded-xl"
                >
                    <Plus size={20} className="mr-2" />
                    <span>Add Account</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-[#1E2028] rounded-xl border-0 dark:border dark:border-white/5 max-w-md">

                {/* ===== VIEW 1: ADD ACCOUNT FORM ===== */}
                {view === "form" && (
                    <>
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                                Add New Account
                            </DialogTitle>
                            <DialogDescription className="text-gray-500 dark:text-gray-400">
                                Enter your trading account information to activate license.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 mt-2">
                            {/* Broker Selection */}
                            <div className="space-y-3">
                                <label className="text-sm font-bold text-gray-700 dark:text-gray-300">
                                    Select Broker <span className="text-red-500">*</span>
                                </label>
                                <div className={cn(
                                    "grid gap-3",
                                    brokers.length <= 3 ? `grid-cols-${brokers.length}` : "grid-cols-3"
                                )}>
                                    {brokers.map((broker) => (
                                        <div
                                            key={broker.slug}
                                            onClick={() => setValue("broker", broker.slug, { shouldValidate: true })}
                                            className={cn(
                                                "cursor-pointer rounded-xl border p-4 flex flex-col items-center gap-2 transition-all duration-200",
                                                selectedBroker === broker.slug
                                                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                                    : "border-gray-200 dark:border-white/10 hover:border-primary/50 bg-white dark:bg-white/5"
                                            )}
                                        >
                                            <div className="w-16 h-10 flex items-center justify-center">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={broker.logo}
                                                    alt={broker.name}
                                                    className="max-w-full max-h-full object-contain"
                                                />
                                            </div>
                                            <span className={cn(
                                                "text-xs font-bold",
                                                selectedBroker === broker.slug ? "text-primary" : "text-gray-500 dark:text-gray-400"
                                            )}>
                                                {broker.name}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                {errors.broker && (
                                    <p className="text-xs text-red-500 font-medium">{errors.broker.message}</p>
                                )}
                            </div>

                            {/* Account Number */}
                            <div className="space-y-2">
                                <PremiumInput
                                    label="Account Number (MT5 Only)"
                                    {...register("accountNumber")}
                                    placeholder="Example: 8062451"
                                    icon={Wallet}
                                    error={errors.accountNumber?.message}
                                />
                                <p className="text-xs text-amber-600 dark:text-amber-400 flex items-center gap-1 mt-1 whitespace-nowrap">
                                    <span>⚠️</span>
                                    <span>Account must be under our IB code for approval</span>
                                </p>
                            </div>

                            <DialogFooter className="gap-2 sm:gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    disabled={isSubmitting}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="flex-1 bg-primary hover:bg-[#00B078] text-white"
                                    disabled={isSubmitting}
                                >
                                    {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    Submit Request
                                </Button>
                            </DialogFooter>

                            {/* Divider + Register CTA — outside DialogFooter to avoid justify-end */}
                            <div className="relative w-full">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-100 dark:border-white/5" />
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="px-3 bg-white dark:bg-[#1E2028] text-gray-400">or</span>
                                </div>
                            </div>

                            <button
                                type="button"
                                onClick={() => setView("register")}
                                className="w-full py-3 px-4 rounded-xl border-2 border-dashed border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all group flex flex-col items-center justify-center"
                            >
                                <p className="text-sm font-bold text-amber-600 dark:text-amber-400 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                                    Don&apos;t have an account yet?
                                </p>
                                <p className="text-[11px] text-amber-500/70 dark:text-amber-500/50 mt-0.5">
                                    Register with our partner broker first
                                </p>
                            </button>
                        </form>
                    </>
                )}

                {/* ===== VIEW 2: REGISTER NEW ACCOUNT ===== */}
                {view === "register" && (
                    <>
                        <DialogHeader>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setView("form")}
                                    className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                    aria-label="Go back"
                                >
                                    <ArrowLeft size={18} className="text-gray-500 dark:text-gray-400" />
                                </button>
                                <DialogTitle className="text-lg font-extrabold text-gray-900 dark:text-white">
                                    Create Your Trading Account
                                </DialogTitle>
                            </div>
                            <DialogDescription className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                                Sign up with a supported broker below to get started with our EAs.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Broker List */}
                        <div className="space-y-2 mt-2">
                            {brokers.map((broker) => (
                                <div
                                    key={broker.slug}
                                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 dark:border-white/5 hover:border-gray-200 dark:hover:border-white/10 transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-white dark:bg-white/10 border border-gray-100 dark:border-white/10 flex items-center justify-center flex-shrink-0 p-1.5">
                                        {/* eslint-disable-next-line @next/next/no-img-element */}
                                        <img src={broker.logo} alt={broker.name} className="max-w-full max-h-full object-contain" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white">
                                            {broker.name}
                                        </p>
                                    </div>
                                    {broker.affiliateUrl ? (
                                        <a
                                            href={broker.affiliateUrl}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white text-[11px] font-bold tracking-wide uppercase transition-all duration-200 flex-shrink-0 shadow-[0_2px_8px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_12px_rgba(245,158,11,0.4)] hover:scale-105"
                                        >
                                            <ExternalLink size={11} />
                                            Register
                                        </a>
                                    ) : (
                                        <span className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-400 dark:text-gray-500 text-xs font-bold flex-shrink-0">
                                            Coming soon
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Info Footer */}
                        <p className="text-xs text-center text-gray-400 dark:text-gray-500 mt-3 leading-relaxed">
                            Once registered, return here and enter your MT5 account number to activate your license.
                        </p>

                        {/* Back Button */}
                        <button
                            type="button"
                            onClick={() => setView("form")}
                            className="w-full mt-2 py-3 px-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2"
                        >
                            <ArrowLeft size={16} className="text-gray-500 dark:text-gray-400" />
                            <span className="text-sm font-bold text-gray-600 dark:text-gray-300">
                                I already have an account
                            </span>
                        </button>
                    </>
                )}

            </DialogContent>
        </Dialog>
    );
}
