"use client";

import { useState, useEffect } from "react";
import { Key, Lock } from 'lucide-react';
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
        <div className="space-y-6">
            <h2 className="text-xl font-bold border-b pb-4 dark:border-white/10">Security</h2>

            {/* Password Change */}
            <div className="pb-8 border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center">
                        <Key size={24} className="text-blue-500" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-gray-900 dark:text-white">Change Password</h2>
                        <p className="text-gray-500 text-sm">Update your password to keep your account secure.</p>
                    </div>
                </div>

                <form action={async (formData) => {
                    setIsLoading(true);
                    try {
                        const res = await updatePassword(formData);
                        if (res.error) {
                            toast.error(res.error);
                        } else {
                            toast.success(res.message);
                            // Clear form
                            const form = document.querySelector('form');
                            form?.reset();
                        }
                    } catch (e: any) {
                        toast.error(e instanceof Error ? e.message : (e?.message || "Something went wrong"));
                    } finally {
                        setIsLoading(false);
                    }
                }} className="space-y-4 max-w-lg">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900 dark:text-white">Current Password</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                name="currentPassword"
                                type="password"
                                required
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:text-white placeholder:text-gray-500"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900 dark:text-white">New Password</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                name="newPassword"
                                type="password"
                                required
                                minLength={6}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:text-white placeholder:text-gray-500"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-900 dark:text-white">Confirm New Password</label>
                        <div className="relative">
                            <Lock size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                name="confirmPassword"
                                type="password"
                                required
                                minLength={6}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 dark:bg-white/5 border border-gray-200 dark:border-white/10 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all dark:text-white placeholder:text-gray-500"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>
                    <div className="pt-2">
                        <Button
                            type="submit"
                            isLoading={isLoading}
                        >
                            Update Password
                        </Button>
                    </div>
                </form>
            </div>

            {/* Two-Factor Authentication */}
            <div className="mt-8 pb-8 border-b border-gray-100 dark:border-white/5">
                <TwoFactorSetup isEnabled={is2FAEnabled} onUpdate={refresh2FA} />
            </div>

            {/* Active Sessions */}
            <div className="mt-8">
                <ActiveSessionsList />
            </div>
        </div>
    );
}
