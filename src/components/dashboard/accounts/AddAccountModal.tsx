"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Wallet, Loader2, ExternalLink, ArrowLeft, AlertTriangle, XCircle, CheckCircle, Lightbulb } from "lucide-react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { submitAccountSchema } from "@/lib/validations/ea-license";
import { submitAccountRequest } from "@/app/dashboard/trading-systems/actions";
import { SubmitAccountInput } from "@/types/ea-license";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { cn } from "@/lib/utils";
import confetti from "canvas-confetti";

interface EABrokerData {
    id: string;
    name: string;
    slug: string;
    logo: string;
    affiliateUrl: string | null;
    ibCode: string | null;
    color: string;
}

interface AddAccountModalProps {
    brokers: EABrokerData[];
}

type ModalView = "form" | "register" | "verify_ib" | "instructions" | "verify_balance" | "insufficient_balance" | "success";

export function AddAccountModal({ brokers }: AddAccountModalProps) {
    const [open, setOpen] = useState(false);
    const [view, setView] = useState<ModalView>("form");
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [pendingData, setPendingData] = useState<SubmitAccountInput | null>(null);

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
    const selectedBrokerData = brokers.find(b => b.slug === selectedBroker);

    const onFormSubmit = (data: SubmitAccountInput) => {
        setPendingData(data);
        setView("verify_ib");
    };

    const handleConfirmSubmit = async () => {
        if (!pendingData) return;
        setIsSubmitting(true);
        try {
            const result = await submitAccountRequest(pendingData);
            if (result.success) {
                setView("success");
                
                // Trigger confetti
                confetti({
                    particleCount: 150,
                    spread: 80,
                    origin: { y: 0.5 },
                    colors: ['#00C888', '#fbbf24', '#ffffff'],
                    zIndex: 99999
                });
            } else {
                toast.error(result.error || "An error occurred, please try again");
            }
        } catch (error: any) {
            toast.error(error instanceof Error ? error.message : (error?.message || "An error occurred, please try again"));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleOpenChange = (isOpen: boolean) => {
        setOpen(isOpen);
        if (!isOpen) {
            // Delay reset slightly to avoid content flashing during the closing animation
            setTimeout(() => {
                setView("form");
                setPendingData(null);
                reset();
            }, 300);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogTrigger asChild>
                <Button
                    className="bg-[#00C888] hover:bg-[#00B078] text-white font-bold rounded-lg px-6 h-10 shadow-none border-none transition-colors border-0"
                >
                    <Plus size={16} className="mr-2" strokeWidth={3} />
                    <span className="text-sm">Add Account</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-[#1A1D27] rounded-xl border-0 dark:border dark:border-white/10 max-w-md p-0 overflow-hidden shadow-2xl dark:shadow-[0_0_40px_rgba(0,0,0,0.5)]">

                {/* ===== VIEW 0.5: INSTRUCTIONS ===== */}
                {view === "instructions" && pendingData && (
                    <div className="p-8">
                        <DialogHeader className="mb-6 flex flex-row items-center justify-between space-y-0 pb-0">
                            <DialogTitle className="text-xl font-black text-gray-900 dark:text-white tracking-tight mx-auto uppercase">
                                IB Transfer Instructions
                            </DialogTitle>
                        </DialogHeader>

                        {/* Warning Icon Container */}
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-full border-2 border-amber-100 dark:border-amber-500/20 flex items-center justify-center bg-amber-50/50 dark:bg-amber-500/5">
                                <AlertTriangle size={24} className="text-amber-500" strokeWidth={2} />
                            </div>
                        </div>

                        <h3 className="text-center text-xl font-black text-gray-900 dark:text-white mb-6">
                            How to Transfer to Our IB
                        </h3>

                        {/* Instruction List Box */}
                        <div className="bg-gray-50 dark:bg-[#151925] rounded-xl p-5 mb-6 shadow-inner max-h-[300px] overflow-y-auto">
                            <p className="font-bold text-gray-900 dark:text-white mb-4">
                                {selectedBrokerData?.name || pendingData.broker} IB Transfer Instructions:
                            </p>
                            
                            <ul className="space-y-3 text-sm text-gray-600 dark:text-gray-400 font-medium">
                                <li>1. Log in to your {selectedBrokerData?.name || pendingData.broker} client portal</li>
                                <li>2. Go to "My Account" or "Profile" section</li>
                                <li>3. Find "IB/Partner" or "Referral" section</li>
                                <li>4. Request to transfer to a new IB</li>
                                <li>
                                    5. Enter IB code: <span className="text-amber-500 font-bold">{selectedBrokerData?.ibCode || "Check Partner Link"}</span>
                                </li>
                                <li>6. Submit and wait for approval (usually 1-3 business days)</li>
                            </ul>

                            <div className="mt-4 p-3 rounded-lg bg-amber-50 dark:bg-amber-500/10 border border-amber-100 dark:border-amber-500/20 text-xs text-amber-700 dark:text-amber-400 flex gap-2">
                                <AlertTriangle size={14} className="flex-shrink-0 mt-0.5" />
                                <p>
                                    If you cannot find this option, contact {selectedBrokerData?.name || pendingData.broker} support and request to transfer to IB code <span className="font-bold">{selectedBrokerData?.ibCode || "our partner link"}</span>
                                </p>
                            </div>

                            <div className="mt-4 p-3 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-100 dark:border-emerald-500/20 text-xs text-emerald-700 dark:text-emerald-400 flex gap-2 font-medium">
                                <CheckCircle size={14} className="flex-shrink-0 mt-0.5" />
                                <p>
                                    After your IB transfer is complete, come back here and submit your MT5 account.
                                </p>
                            </div>
                        </div>

                        {/* Footer Buttons */}
                        <div className="flex gap-4 pt-2">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setView("verify_ib")}
                                className="flex-1"
                            >
                                <ArrowLeft size={20} />
                                <span>Back</span>
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => setOpen(false)}
                                className="flex-1 whitespace-nowrap"
                            >
                                <span>I'll transfer first</span>
                            </Button>
                        </div>
                    </div>
                )}

                {/* ===== VIEW 0: VERIFY IB (CONFIRMATION) ===== */}
                {view === "verify_ib" && pendingData && (
                    <div className="p-8 relative">
                        {/* Close button at top right */}
                        <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => setView("form")}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <XCircle size={18} />
                        </Button>

                        <DialogHeader className="mb-8 mt-2 flex flex-row items-center justify-center space-y-0 pb-0">
                            <DialogTitle className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight text-center">
                                STEP 1: IB VERIFICATION
                            </DialogTitle>
                        </DialogHeader>

                        {/* Progress Steps Indicator */}
                        <div className="flex items-center justify-center gap-4 mb-10">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                                    1
                                </div>
                                <span className="text-sm font-bold text-amber-500">IB</span>
                            </div>
                            <div className="w-16 h-[2px] bg-gray-200 dark:bg-white/10" />
                            <div className="flex items-center gap-2 opacity-50">
                                <div className="w-8 h-8 rounded-full bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 flex items-center justify-center font-bold text-sm">
                                    2
                                </div>
                                <span className="text-sm font-bold text-gray-600 dark:text-gray-300">Balance</span>
                            </div>
                        </div>

                        {/* Warning Icon Container */}
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-full border-2 border-amber-100 dark:border-amber-500/20 flex items-center justify-center bg-amber-50/50 dark:bg-amber-500/5">
                                <AlertTriangle size={24} className="text-amber-500" strokeWidth={2} />
                            </div>
                        </div>

                        <h3 className="text-center text-xl font-black text-gray-900 dark:text-white mb-6">
                            Is your account under our IB?
                        </h3>

                        {/* IB Info Box */}
                        <div className="bg-gray-50 dark:bg-[#151925] rounded-xl p-6 mb-8 text-center space-y-5">
                            <div>
                                <p className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">Your Broker:</p>
                                <p className="text-2xl font-black text-gray-900 dark:text-white">
                                    {selectedBrokerData?.name || pendingData.broker}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm font-bold text-gray-600 dark:text-gray-300 mb-1">IB Code/Number:</p>
                                <p className="text-3xl font-black text-amber-500 tracking-wider">
                                    {selectedBrokerData?.ibCode || "Check Partner Link"}
                                </p>
                            </div>
                        </div>

                        <p className="text-sm text-center text-gray-600 dark:text-gray-300 mb-10 max-w-[320px] mx-auto leading-relaxed">
                            Your trading account must be registered under our Introducing Broker (IB) to receive free access to the EA.
                        </p>

                        <div className="flex gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setView("instructions")}
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                <XCircle size={20} />
                                <span>No</span>
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => setView("verify_balance")}
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                <CheckCircle size={20} />
                                <span>Yes</span>
                            </Button>
                        </div>
                    </div>
                )}

                {/* ===== VIEW 2: VERIFY BALANCE ===== */}
                {view === "verify_balance" && pendingData && (
                    <div className="p-8 pt-6 relative">
                        {/* Top Back Button (Absolute positioning for exact alignment) */}
                        <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => setView("verify_ib")}
                            disabled={isSubmitting}
                            aria-label="Back to previous step"
                            className="absolute top-6 left-6 flex items-center justify-center w-8 h-8 rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-white dark:hover:bg-white/10 transition-colors"
                        >
                            <ArrowLeft size={20} />
                        </Button>

                        <DialogHeader className="mb-8 mt-2 flex flex-row items-center justify-center space-y-0 pb-0">
                            <DialogTitle className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight text-center">
                                STEP 2: BALANCE CHECK
                            </DialogTitle>
                        </DialogHeader>

                        {/* Progress Steps Indicator */}
                        <div className="flex items-center justify-center gap-4 mb-10">
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-[#00C888] text-white flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(0,200,136,0.3)]">
                                    <CheckCircle size={16} strokeWidth={3} />
                                </div>
                                <span className="text-sm font-bold text-[#00C888]">IB</span>
                            </div>
                            <div className="w-16 h-[2px] bg-[#00C888]" />
                            <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold text-sm shadow-[0_0_15px_rgba(245,158,11,0.3)]">
                                    2
                                </div>
                                <span className="text-sm font-bold text-amber-500">Balance</span>
                            </div>
                        </div>

                        {/* Success Icon Container */}
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 rounded-full border-[1.5px] border-[#00C888] flex items-center justify-center bg-transparent">
                                <CheckCircle size={32} className="text-[#00C888]" strokeWidth={2} />
                            </div>
                        </div>

                        <h3 className="text-center text-2xl font-black text-gray-900 dark:text-white mb-6 leading-tight max-w-[280px] mx-auto">
                            Does your account have a minimum balance?
                        </h3>

                        {/* Balance Info Box */}
                        <div className="bg-[#F8F9FA] dark:bg-[#151925] rounded-xl p-6 mb-8 text-center space-y-2">
                            <p className="text-sm font-bold text-gray-600 dark:text-gray-300">
                                Minimum Required Balance:
                            </p>
                            <p className="text-5xl font-black text-[#00C888] tracking-tight">
                                $500
                            </p>
                        </div>

                        <p className="text-sm text-center text-gray-600 dark:text-gray-300 mb-8 max-w-[280px] mx-auto leading-relaxed">
                            A minimum balance of $500 is required to use the EA effectively.
                        </p>

                        <div className="flex gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setView("insufficient_balance")}
                                disabled={isSubmitting}
                                className="flex-1 whitespace-nowrap px-2"
                            >
                                <XCircle size={18} />
                                <span>Why do I need $500?</span>
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                onClick={handleConfirmSubmit}
                                disabled={isSubmitting}
                                className="flex-1 whitespace-nowrap px-2"
                            >
                                {isSubmitting ? (
                                    <Loader2 size={18} className="animate-spin" />
                                ) : (
                                    <CheckCircle size={18} />
                                )}
                                <span>Yes or more</span>
                            </Button>
                        </div>
                    </div>
                )}

                {/* ===== VIEW 3: INSUFFICIENT BALANCE EXPLANATION ===== */}
                {view === "insufficient_balance" && (
                    <div className="p-8 relative">
                        {/* Close button at top right */}
                        <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => setOpen(false)}
                            className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                        >
                            <XCircle size={18} />
                        </Button>
                        
                        <DialogHeader className="mb-8 mt-2 flex flex-col items-center justify-center space-y-0 pb-0">
                            <DialogTitle className="text-xl font-black text-gray-900 dark:text-white tracking-tight text-center">
                                Cannot Submit Yet
                            </DialogTitle>
                        </DialogHeader>

                        {/* Error Icon Container (Minimalist) */}
                        <div className="flex justify-center mb-8">
                            <div className="w-16 h-16 rounded-full border-[1.5px] border-red-500 flex items-center justify-center bg-transparent">
                                <span className="text-red-500">
                                    <XCircle size={28} strokeWidth={2.5} />
                                </span>
                            </div>
                        </div>

                        <h3 className="text-center text-xl font-black text-gray-900 dark:text-white mb-4">
                            Insufficient Balance
                        </h3>

                        <p className="text-sm text-center text-gray-600 dark:text-gray-300 mb-8 px-4 leading-relaxed max-w-[300px] mx-auto">
                            Please fund your account with at least $500 before submitting your MT5 account for EA access.
                        </p>

                        {/* Info Tip Box */}
                        <div className="bg-amber-50/50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/20 rounded-xl p-5 mb-8">
                            <div className="flex gap-3 items-start">
                                <Lightbulb size={20} className="text-amber-500 flex-shrink-0 mt-0.5" strokeWidth={2} />
                                <p className="text-sm text-amber-700 dark:text-amber-400 leading-relaxed">
                                    <span className="font-bold">Tip:</span> Having sufficient balance ensures the EA can manage trades properly and protect your account with proper risk management.
                                </p>
                            </div>
                        </div>

                        <div className="flex gap-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setView("verify_balance")}
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                <ArrowLeft size={18} />
                                <span>Back</span>
                            </Button>
                            <Button
                                type="button"
                                variant="primary"
                                onClick={() => setOpen(false)}
                                disabled={isSubmitting}
                                className="flex-1"
                            >
                                <span>I'll deposit first</span>
                            </Button>
                        </div>
                    </div>
                )}

                {/* ===== VIEW 1: ADD ACCOUNT FORM ===== */}
                {view === "form" && (
                    <div className="p-6">
                        <DialogHeader>
                            <DialogTitle className="text-xl font-bold text-gray-900 dark:text-white">
                                Add New Account
                            </DialogTitle>
                            <DialogDescription className="text-gray-600 dark:text-gray-300">
                                Enter your trading account information to activate license.
                            </DialogDescription>
                        </DialogHeader>

                        <form onSubmit={handleSubmit(onFormSubmit)} className="space-y-6 mt-2">
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
                                                "group cursor-pointer rounded-xl border p-4 flex flex-col items-center gap-3 transition-all duration-300",
                                                selectedBroker === broker.slug
                                                    ? "border-[#00C888] bg-[#00C888]/10 ring-1 ring-[#00C888]/30 shadow-[0_0_20px_rgba(0,200,136,0.15)]"
                                                    : "border-gray-200 dark:border-white/10 hover:border-[#00C888]/40 bg-gray-50 dark:bg-white/5"
                                            )}
                                        >
                                            <div className="w-16 h-8 flex items-center justify-center">
                                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                                <img
                                                    src={broker.logo}
                                                    alt={broker.name}
                                                    className={cn(
                                                        "max-w-full max-h-full object-contain transition-all duration-300",
                                                        "dark:brightness-0 dark:invert", // Turn logos white in dark mode
                                                        selectedBroker === broker.slug ? "opacity-100 scale-110" : "opacity-40 group-hover:opacity-80 group-hover:scale-105"
                                                    )}
                                                />
                                            </div>
                                            <span className={cn(
                                                "text-[13px] font-extrabold tracking-wide transition-colors",
                                                selectedBroker === broker.slug 
                                                    ? "text-gray-900 dark:text-white" 
                                                    : "text-gray-600 dark:text-gray-600 group-hover:text-gray-800 dark:group-hover:text-gray-300"
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

                            <DialogFooter className="gap-2 sm:gap-2 pt-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => setOpen(false)}
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    type="submit"
                                    variant="primary"
                                    className="flex-1 bg-primary hover:bg-[#00B078] text-white"
                                >
                                    Next Step
                                </Button>
                            </DialogFooter>

                            {/* Divider + Register CTA — outside DialogFooter to avoid justify-end */}
                            <div className="relative w-full py-2">
                                <div className="absolute inset-0 flex items-center">
                                    <div className="w-full border-t border-gray-200 dark:border-white/10" />
                                </div>
                                <div className="relative flex justify-center text-xs">
                                    <span className="px-3 bg-white dark:bg-[#1E2028] text-gray-400 font-medium">or</span>
                                </div>
                            </div>

                            <Button
                                variant="outline"
                                type="button"
                                onClick={() => setView("register")}
                                className="w-full h-auto py-3 px-4 rounded-xl border-2 border-dashed border-amber-200 dark:border-amber-500/20 bg-amber-50/50 dark:bg-amber-500/5 hover:bg-amber-50 dark:hover:bg-amber-500/10 transition-all group flex flex-col items-center justify-center"
                            >
                                <p className="text-sm font-bold text-amber-600 dark:text-amber-400 group-hover:text-amber-700 dark:group-hover:text-amber-300 transition-colors">
                                    Don&apos;t have an account yet?
                                </p>
                                <p className="text-[11px] text-amber-500/70 dark:text-amber-500/50 mt-0.5 font-medium">
                                    Register with our partner broker first
                                </p>
                            </Button>
                        </form>
                    </div>
                )}

                {/* ===== VIEW 2: REGISTER NEW ACCOUNT ===== */}
                {view === "register" && (
                    <div className="p-6">
                        <DialogHeader>
                            <div className="flex items-center gap-2">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    onClick={() => setView("form")}
                                    className="p-1.5 h-auto w-auto rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                    aria-label="Go back"
                                >
                                    <ArrowLeft size={18} className="text-gray-600 dark:text-gray-300" />
                                </Button>
                                <DialogTitle className="text-lg font-extrabold text-gray-900 dark:text-white">
                                    Create Your Trading Account
                                </DialogTitle>
                            </div>
                            <DialogDescription className="text-sm text-gray-600 dark:text-gray-300 mt-1 pl-8">
                                Sign up with a supported broker below to get started with our EAs.
                            </DialogDescription>
                        </DialogHeader>

                        {/* Broker List */}
                        <div className="space-y-3 mt-4">
                            {brokers.map((broker) => (
                                <div
                                    key={broker.slug}
                                    className="flex items-center gap-3 p-3 rounded-xl border border-gray-200 dark:border-white/10 hover:border-gray-200 dark:hover:border-white/10 bg-gray-50/50 dark:bg-white/[0.02] transition-colors"
                                >
                                    <div className="w-12 h-12 rounded-lg bg-white dark:bg-white/10 border border-gray-200 dark:border-white/10 flex items-center justify-center flex-shrink-0 p-1.5">
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
                                            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-500 hover:to-amber-600 text-white text-[11px] font-bold tracking-wide uppercase transition-all duration-200 flex-shrink-0 shadow-[0_2px_8px_rgba(245,158,11,0.3)] hover:shadow-[0_4px_12px_rgba(245,158,11,0.4)] hover:scale-105"
                                        >
                                            <ExternalLink size={14} />
                                            Register
                                        </a>
                                    ) : (
                                        <span className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 text-xs font-bold flex-shrink-0">
                                            Coming soon
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        {/* Info Footer */}
                        <p className="text-xs text-center text-gray-600 dark:text-gray-300 mt-6 leading-relaxed">
                            Once registered, return here and enter your MT5 account number to activate your license.
                        </p>

                        {/* Back Button */}
                        <Button
                            variant="outline"
                            type="button"
                            onClick={() => setView("form")}
                            className="w-full h-auto mt-4 py-3 px-4 rounded-xl border text-gray-700 dark:text-gray-300 border-gray-200 dark:border-white/10 hover:border-gray-300 dark:hover:border-white/20 hover:bg-gray-50 dark:hover:bg-white/5 transition-all flex items-center justify-center gap-2 font-bold text-sm"
                        >
                            I already have an account
                        </Button>
                    </div>
                )}

                {/* ===== VIEW 4: SUCCESS CONFETTI ===== */}
                {view === "success" && (
                    <div className="p-10 relative flex flex-col items-center justify-center min-h-[320px]">
                        {/* Close button at top right */}
                        <Button
                            variant="ghost"
                            size="icon"
                            type="button"
                            onClick={() => setOpen(false)}
                            className="absolute h-auto w-auto top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors z-10"
                        >
                            <XCircle size={18} />
                        </Button>

                        <div className="flex flex-col items-center text-center space-y-6 animate-in zoom-in duration-500">
                            <h2 className="text-xl font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                                Success!
                            </h2>

                            {/* Big Green Check Circle */}
                            <div className="w-24 h-24 rounded-full bg-[#00C888]/10 flex items-center justify-center relative">
                                {/* Ripple effect rings */}
                                <div className="absolute inset-0 rounded-full border-2 border-[#00C888]/20 animate-ping" />
                                <div className="absolute inset-2 rounded-full border-2 border-[#00C888]/30 animate-pulse" />
                                <div className="w-16 h-16 rounded-full bg-white dark:bg-[#1A1D27] border-[3px] border-[#00C888] flex items-center justify-center z-10 shadow-[0_0_20px_rgba(0,200,136,0.3)]">
                                    <CheckCircle size={36} className="text-[#00C888]" strokeWidth={2.5} />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <h3 className="text-2xl font-black text-[#00C888] uppercase tracking-wide">
                                    Account Submitted!
                                </h3>
                                <p className="text-sm text-gray-600 dark:text-gray-300 max-w-[280px] mx-auto leading-relaxed">
                                    Your MT5 account has been submitted for review. We'll notify you once it's approved.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

            </DialogContent>
        </Dialog>
    );
}
