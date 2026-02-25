"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/Dialog";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";
import { toast } from "sonner";
import { submitAccountRequest } from "@/app/dashboard/trading-systems/actions";
import { BrokerName } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Info } from "lucide-react";

interface AddLicenseModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function AddLicenseModal({ isOpen, onClose }: AddLicenseModalProps) {
    const router = useRouter();
    const [isLoading, setIsLoading] = useState(false);
    const [broker, setBroker] = useState<BrokerName>("EXNESS");
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
        } catch (error) {
            toast.error("Something went wrong");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Add EA License</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    <div className="p-4 bg-blue-50 dark:bg-blue-900/10 rounded-xl flex gap-3 text-sm text-blue-600 dark:text-blue-400">
                        <Info className="shrink-0 mt-0.5" size={18} />
                        <p>Register your trading account number to get access to our EAs. Accounts must be under our IB to be approved.</p>
                    </div>

                    <div className="space-y-3">
                        <label className="text-sm font-medium text-gray-900 dark:text-white">Select Broker</label>
                        <div className="grid grid-cols-1 gap-2">
                            {["EXNESS", "VANTAGE", "VTMARKETS"].map((b) => (
                                <label key={b} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${broker === b ? 'border-primary bg-primary/5' : 'border-gray-200 dark:border-white/10 hover:bg-gray-50 dark:hover:bg-white/5'}`}>
                                    <input
                                        type="radio"
                                        name="broker"
                                        checked={broker === b}
                                        onChange={() => setBroker(b as BrokerName)}
                                        className="w-4 h-4 text-primary focus:ring-primary"
                                    />
                                    <span className="font-bold text-gray-700 dark:text-gray-200">{b}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    <PremiumInput
                        label="Account Number"
                        placeholder="12345678"
                        value={accountNumber}
                        onChange={(e) => setAccountNumber(e.target.value)}
                        required
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        className="px-6 py-3 rounded-xl font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-white/5"
                    >Cancel
                    </Button>
                    <Button
                        variant="primary"
                        onClick={handleSubmit}
                        disabled={isLoading}
                        className="px-6 py-3 rounded-xl bg-primary hover:bg-[#00B078] text-white font-bold shadow-lg hover:shadow-primary/25 hover:-translate-y-0.5 transition-all"
                    >
                        {isLoading ? "Submitting..." : "Submit Request"}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
