"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Lock, Loader2 } from "lucide-react";
import { updatePassword } from "../actions";

export default function UpdatePasswordPage() {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        const formData = new FormData(e.currentTarget);
        const result = await updatePassword(formData);

        if (result?.error) {
            setError(result.error);
            setIsLoading(false);
        }
        // If success, the action redirects to /academy
    };

    return (
        <div className="w-full max-w-[440px] sm:max-w-[480px] mx-auto bg-white dark:bg-[#1E2028] border border-gray-200 dark:border-white/10 rounded-xl p-6 sm:p-8 shadow-sm transition-colors duration-300">
            <div className="mb-8">
                <h1 className="text-2xl sm:text-3xl font-black text-slate-950 dark:text-white mb-2">
                    Set New Password
                </h1>
                <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300">
                    Your new password must be different from previously used
                    passwords.
                </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1.5">
                    <label
                        htmlFor="new-password"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                        New Password
                    </label>
                    <div className="relative">
                        <input
                            id="new-password"
                            name="password"
                            type="password"
                            required
                            autoComplete="new-password"
                            className="w-full bg-gray-50/80 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 pl-11 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#151925] focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all"
                        />
                        <Lock
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-600 dark:text-gold"
                            size={20}
                        />
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 tabular-nums">
                        Minimum 6 characters required.
                    </p>
                </div>

                <div className="space-y-1.5">
                    <label
                        htmlFor="confirm-password"
                        className="text-sm font-medium text-slate-700 dark:text-slate-300"
                    >
                        Confirm Password
                    </label>
                    <div className="relative">
                        <input
                            id="confirm-password"
                            name="confirmPassword"
                            type="password"
                            required
                            autoComplete="new-password"
                            className="w-full bg-gray-50/80 dark:bg-[#151925] border border-gray-200 dark:border-white/10 rounded-lg px-4 py-3 pl-11 text-slate-900 dark:text-white focus:bg-white dark:focus:bg-[#151925] focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold/30 transition-all"
                        />
                        <Lock
                            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-amber-600 dark:text-gold"
                            size={20}
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-500 dark:text-red-400 text-sm">
                        {error}
                    </div>
                )}

                <Button
                    type="submit"
                    disabled={isLoading}
                    variant="gold"
                    className="w-full font-bold h-12 rounded-lg bg-gold hover:bg-amber-600 !text-white transition-all shadow-md shadow-amber-500/20 flex items-center justify-center"
                >
                    {isLoading ? (
                        <Loader2 className="animate-spin" />
                    ) : (
                        "Reset Password"
                    )}
                </Button>
            </form>
        </div>
    );
}
