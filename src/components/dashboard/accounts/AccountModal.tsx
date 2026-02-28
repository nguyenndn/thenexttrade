"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import { X, Check } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { PremiumInput } from "@/components/ui/PremiumInput";

interface TradingAccount {
    id: string;
    name: string;
    broker: string | null;
    accountNumber: string | null;
    balance: number;
    currency: string;
    platform: string | null;
    isDefault: boolean;
}

interface AccountModalProps {
    account?: TradingAccount | null;
    onClose: () => void;
    onSave: () => void;
}

const PLATFORMS = [
    { value: "MT4", label: "MetaTrader 4" },
    { value: "MT5", label: "MetaTrader 5" },
    { value: "CTRADER", label: "cTrader" },
];

export function AccountModal({ account, onClose, onSave }: AccountModalProps) {
    const [formData, setFormData] = useState({
        name: "",
        broker: "",
        accountNumber: "",
        balance: 0,
        currency: "USD",
        platform: "MT4",
        isDefault: false,
    });
    const [isLoading, setIsLoading] = useState(false);

    useEffect(() => {
        if (account) {
            setFormData({
                name: account.name,
                broker: account.broker || "",
                accountNumber: account.accountNumber || "",
                balance: account.balance,
                currency: account.currency,
                platform: account.platform || "MT4",
                isDefault: account.isDefault,
            });
        }
    }, [account]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            const url = account
                ? `/api/trading-accounts/${account.id}`
                : "/api/trading-accounts";

            const method = account ? "PATCH" : "POST";

            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(formData),
            });

            if (!res.ok) {
                const json = await res.json();
                throw new Error(json.error || "Failed to save account");
            }

            toast.success(account ? "Account updated" : "Account created");
            onSave();
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <div className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-opacity" onClick={onClose} />
            <div className="relative z-10 bg-white dark:bg-[#1E2028] rounded-xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl animate-in fade-in zoom-in-95 duration-200 cursor-default">
                <div className="p-6 border-b border-gray-200 dark:border-white/10 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                        {account ? "Edit Account" : "Connect Account"}
                    </h2>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-white/5 rounded-full transition-colors"
                    >
                        <X size={20} className="text-gray-500" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-4">
                    <div className="space-y-2">
                        <PremiumInput
                            id="name"
                            label="Account Name"
                            placeholder="My Trading Account"
                            value={formData.name}
                            onChange={(e: any) => setFormData({ ...formData, name: e.target.value })}
                            required
                            maxLength={50}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <PremiumInput
                                id="broker"
                                label="Broker"
                                placeholder="Exness"
                                value={formData.broker}
                                onChange={(e: any) => setFormData({ ...formData, broker: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="platform" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Platform
                            </label>
                            <div className="relative group">
                                <select
                                    id="platform"
                                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900 dark:text-white font-medium appearance-none"
                                    value={formData.platform}
                                    onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                                >
                                    {PLATFORMS.map(p => (
                                        <option key={p.value} value={p.value}>{p.label}</option>
                                    ))}
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <PremiumInput
                            id="accountNumber"
                            label="Account Number"
                            placeholder="e.g. 8062451"
                            value={formData.accountNumber}
                            onChange={(e: any) => setFormData({ ...formData, accountNumber: e.target.value })}
                        />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <PremiumInput
                                id="balance"
                                label="Initial Balance"
                                type="number"
                                placeholder="0.00"
                                value={formData.balance}
                                onChange={(e: any) => setFormData({ ...formData, balance: parseFloat(e.target.value) || 0 })}
                                required
                            />
                        </div>
                        <div className="space-y-2">
                            <label htmlFor="currency" className="block text-xs font-bold text-gray-400 uppercase tracking-wider">
                                Currency
                            </label>
                            <div className="relative group">
                                <select
                                    id="currency"
                                    className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/10 text-sm outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-gray-900 dark:text-white font-medium appearance-none"
                                    value={formData.currency}
                                    onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                                >
                                    <option value="USD">USD ($)</option>
                                    <option value="EUR">EUR (€)</option>
                                    <option value="GBP">GBP (£)</option>
                                    <option value="JPY">JPY (¥)</option>
                                    <option value="VND">VND (₫)</option>
                                </select>
                                <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-gray-400">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2 pt-2">
                        <input
                            type="checkbox"
                            id="isDefault"
                            checked={formData.isDefault}
                            onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                            className="w-4 h-4 rounded text-primary focus:ring-primary"
                        />
                        <label htmlFor="isDefault" className="text-sm text-gray-700 dark:text-gray-300">
                            Set as default account
                        </label>
                    </div>

                    <div className="pt-4 flex justify-end gap-3">
                        <Button type="button" variant="outline" onClick={onClose}>
                            Cancel
                        </Button>
                        <Button type="submit" disabled={isLoading} className="bg-primary hover:bg-[#00B078] text-white">
                            {isLoading ? "Saving..." : "Save Account"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
