"use client";

import { useState } from "react";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { toast } from "sonner";
import { submitAccountRequest } from "@/app/dashboard/trading-systems/actions";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";

interface AddLicenseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddLicenseModal({ isOpen, onClose }: AddLicenseModalProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [broker, setBroker] = useState("EXNESS");
    const [accountNumber, setAccountNumber] = useState("");

    const handleSubmit = async () => {
        if (!accountNumber) {
            toast.error("Please enter account number");
            return;
        }

        setIsLoading(true);
        try {
            const res = await submitAccountRequest({ broker, accountNumber });

            if (res.success) {
                toast.success("Request submitted successfully!");
                router.refresh();
                onClose();
                setAccountNumber("");
            } else {
                toast.error(res.error || "Failed to submit");
            }
        } catch (error: unknown) {
            toast.error(
                error instanceof Error
                    ? error.message
                    : "Something went wrong"
            );
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md rounded-2xl bg-white dark:bg-[#0D111C] border border-dashboard">
                <DialogHeader>
                    <DialogTitle>Add EA License</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="p-4 bg-amber-50 dark:bg-gold/10 border border-amber-200/60 dark:border-gold/20 rounded-lg flex gap-3 text-sm text-amber-700 dark:text-gold">
                        <Info className="shrink-0 mt-0.5" size={18} />
                        <p>
                            Register your trading account number to get access
                            to our EAs. Accounts must be under our IB to be
                            approved.
                        </p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-700 dark:text-white">
                            Select Broker
                        </label>
                        <div className="grid grid-cols-1 gap-2">
                            {["EXNESS", "VANTAGE", "VTMARKETS"].map((b) => (
                                <label
                                    key={b}
                                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all ${broker === b ? "border-gold bg-gold/10" : "border-dashboard hover:bg-gray-50 dark:hover:bg-white/5"}`}
                                >
                                    <input
                                        type="radio"
                                        name="broker"
                                        checked={broker === b}
                                        onChange={() => setBroker(b)}
                                        className="w-4 h-4 text-gold focus:ring-gold"
                                    />
                                    <span className="font-bold text-gray-700 dark:text-gray-200">
                                        {b}
                                    </span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <PremiumInput
                        label="Account Number"
                        helperText="Enter your MT5 live account number"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        required
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        variant="outline"
                        size="smd"
                        onClick={onClose}
                        className="rounded-lg font-bold text-gray-600 hover:text-gray-700 dark:text-gray-500 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="primary"
                        size="smd"
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="rounded-lg bg-gold hover:bg-amber-600 !text-white font-bold shadow-md shadow-amber-500/20 hover:shadow-lg hover:shadow-amber-500/30 transition-all border-none"
                    >
                        {isLoading ? "Submitting..." : "Submit Request"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
