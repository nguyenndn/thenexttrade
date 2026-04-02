"use client";

import { useState, useEffect } from "react";
import { Key, Lock, Shield, Monitor } from 'lucide-react';
import { toast } from 'sonner';
import { updatePassword, getTwoFactorStatus } from '@/app/dashboard/settings/account/actions';
import { TwoFactorSetup } from "./TwoFactorSetup";
import { ActiveSessionsList } from "./ActiveSessionsList";
import { Button } from "@/components/ui/Button";

export function SecuritySettings() {
    const [isLoading, setIsLoading] = useState(false);
    const [is2FAEnabled, setIs2FAEnabled] = useState(false);

    useEffect(() => {
        getTwoFactorStatus().then(res => setIs2FAEnabled(res.isEnabled));
    }, []);

    const refresh2FA = () => {
        getTwoFactorStatus().then(res => setIs2FAEnabled(res.isEnabled));
    };

    return (
        <div className="w-full space-y-5">

            {/* ── Change Password Card ── */}
            <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/8 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-blue-500/10 dark:bg-blue-500/20 flex items-center justify-center">
                        <Key size={14} className="text-blue-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Change Password</h2>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">Update your password to keep your account secure.</p>
                    </div>
                </div>

                <div className="px-6 py-5">
                    <form action={async (formData) => {
                        setIsLoading(true);
                        try {
                            const res = await updatePassword(formData);
                            if (res.error) toast.error(res.error);
                            else {
                                toast.success(res.message);
                                (document.querySelector('form') as HTMLFormElement)?.reset();
                            }
                        } catch (e: any) {
                            toast.error(e instanceof Error ? e.message : (e?.message || "Something went wrong"));
                        } finally {
                            setIsLoading(false);
                        }
                    }} className="space-y-4">
                        {[
                            { name: "currentPassword", label: "Current Password" },
                            { name: "newPassword", label: "New Password" },
                            { name: "confirmPassword", label: "Confirm New Password" },
                        ].map((field) => (
                            <div key={field.name}>
                                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wide mb-1.5">
                                    {field.label}
                                </label>
                                <div className="relative">
                                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                                    <input
                                        name={field.name}
                                        type="password"
                                        required
                                        minLength={field.name !== "currentPassword" ? 6 : undefined}
                                        className="w-full pl-9 pr-4 py-2.5 bg-gray-50 dark:bg-[#151925] border border-gray-200 dark:border-white/8 rounded-xl text-sm text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all"
                                        placeholder="••••••••"
                                    />
                                </div>
                            </div>
                        ))}
                        <div className="pt-1">
                            <Button type="submit" isLoading={isLoading} variant="primary">
                                Update Password
                            </Button>
                        </div>
                    </form>
                </div>
            </div>

            {/* ── Two-Factor Authentication Card ── */}
            <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/8 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center">
                        <Shield size={14} className="text-orange-500" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Two-Factor Authentication (2FA)</h2>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">Add an extra layer of security to your account.</p>
                    </div>
                </div>
                <div className="px-6 py-5">
                    <TwoFactorSetup isEnabled={is2FAEnabled} onUpdate={refresh2FA} />
                </div>
            </div>

            {/* ── Active Sessions Card ── */}
            <div className="bg-white dark:bg-[#1E2028] rounded-xl border border-gray-200 dark:border-white/10 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-100 dark:border-white/8 flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-lg bg-primary/10 dark:bg-primary/20 flex items-center justify-center">
                        <Monitor size={14} className="text-primary" />
                    </div>
                    <div>
                        <h2 className="text-sm font-semibold text-gray-900 dark:text-white">Active Sessions</h2>
                        <p className="text-xs text-gray-600 dark:text-gray-300 mt-0.5">Manage your logged-in devices and sessions.</p>
                    </div>
                </div>
                <div className="px-6 py-5">
                    <ActiveSessionsList />
                </div>
            </div>

        </div>
    );
}
