
"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Plus, Wallet, Loader2 } from "lucide-react";
import {
    Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { BrokerLogo } from "@/components/ui/BrokerLogo";
import { BROKERS, BrokerKey } from "@/config/brokers";
import { submitAccountSchema } from "@/lib/validations/ea-license";
import { submitAccountRequest } from "@/app/dashboard/trading-systems/actions";
import { SubmitAccountInput } from "@/types/ea-license";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { cn } from "@/lib/utils";

export function AddAccountModal() {
    const [open, setOpen] = useState(false);
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
                    description: "We will review and approve strictly.",
                });
                setOpen(false);
                reset();
            } else {
                toast.error(result.error || "An error occurred, please try again");
            }
        } catch (error) {
            toast.error("An error occurred, please try again");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="primary"
                    className="bg-primary hover:bg-[#00B078] shadow-lg shadow-primary/25 text-white font-bold rounded-xl"
                >
                    <Plus size={20} className="mr-2" />
                    <span>Add Account</span>
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-white dark:bg-[#1E2028] rounded-3xl border-0 dark:border dark:border-white/5 max-w-md">
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
                        <div className="grid grid-cols-3 gap-3">
                            {(Object.keys(BROKERS) as BrokerKey[]).map((brokerKey) => (
                                <div
                                    key={brokerKey}
                                    onClick={() => setValue("broker", brokerKey, { shouldValidate: true })}
                                    className={cn(
                                        "cursor-pointer rounded-2xl border p-4 flex flex-col items-center gap-2 transition-all duration-200",
                                        selectedBroker === brokerKey
                                            ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                            : "border-gray-200 dark:border-white/10 hover:border-primary/50 bg-white dark:bg-white/5"
                                    )}
                                >
                                    <BrokerLogo broker={brokerKey} size={80} />
                                    <span className={cn(
                                        "text-xs font-bold",
                                        selectedBroker === brokerKey ? "text-primary" : "text-gray-500 dark:text-gray-400"
                                    )}>
                                        {BROKERS[brokerKey].name}
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
                        <div className="group">
                            <PremiumInput
                                label="Account Number"
                                {...register("accountNumber")}
                                placeholder="Example: 8062451"
                                icon={Wallet}
                                error={errors.accountNumber?.message}
                            />
                        </div>

                        <p className="text-xs text-gray-400 dark:text-gray-500">
                            Enter MT4/MT5 account number only. Do not enter password.
                        </p>
                    </div>

                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button
                            type="button"
                            variant="ghost"
                            onClick={() => setOpen(false)}
                            disabled={isSubmitting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            className="bg-primary hover:bg-[#00B078] text-white"
                            disabled={isSubmitting}
                        >
                            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Submit Request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
